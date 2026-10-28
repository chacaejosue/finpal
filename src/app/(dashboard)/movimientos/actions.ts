"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transaccionSchema } from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";
import { encryptFieldSync, decryptFieldSync, isEncrypted, autoMigrateRow } from "@/lib/crypto";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";

// ── Listar categorías del espacio ─────────────────────────────────────────
export async function getCategorias(espacioId: string) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre, tipo, created_at")
    .eq("espacio_id", espacioId)
    .order("nombre", { ascending: true });

  if (error) return [];
  return data ?? [];
}

// ── Listar transacciones del espacio ──────────────────────────────────────
export async function getMovimientos(espacioId: string, limit = 200) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const safeLimit = Math.min(Math.max(1, limit), 1000);

  const { data, error } = await supabase
    .from("transacciones")
    .select(`
      id, tipo, ajuste_sentido, monto, ocurrido_en, descripcion, created_at,
      prestamo_id, pago_prestamo_id, transfer_group_id,
      cuentas_dinero(id, nombre),
      categorias(id, nombre)
    `)
    .eq("espacio_id", espacioId)
    .order("ocurrido_en", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((m) => {
    // Auto-migración silenciosa y descifrado de la descripción
    if (m.descripcion && !isEncrypted(m.descripcion)) {
      autoMigrateRow(supabase, "transacciones", m.id, { descripcion: m.descripcion });
    }

    return {
      ...m,
      descripcion: decryptFieldSync(m.descripcion),
    };
  });
}

// ── Registrar movimiento (ingreso / gasto / transferencia / ajuste) ───────
export async function registrarMovimiento(espacioId: string, formData: FormData) {
  if (!isValidUuid(espacioId)) return { error: { _global: ["Espacio no válido"] } };

  const rawCategoriaId = formData.get("categoria_id") as string | null;
  const rawCategoriaNombre = sanitizeText(formData.get("categoria_nombre"), 100);
  const rawCuentaDestinoId = (formData.get("cuenta_destino_id") as string) || null;

  const parsed = transaccionSchema.safeParse({
    cuenta_dinero_id: formData.get("cuenta_dinero_id"),
    cuenta_destino_id: rawCuentaDestinoId,
    tipo: formData.get("tipo"),
    ajuste_sentido: formData.get("ajuste_sentido") || null,
    monto: formData.get("monto"),
    ocurrido_en: formData.get("ocurrido_en"),
    descripcion: sanitizeText(formData.get("descripcion"), 500),
    categoria_id: rawCategoriaId && isValidUuid(rawCategoriaId) ? rawCategoriaId : null,
    categoria_nombre: rawCategoriaNombre || "",
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const rl = await checkRateLimit({
    action: "mutation:movimiento",
    limit: 30,
    windowMs: 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) return { error: { _global: [rl.message!] } };

  const { count } = await supabase
    .from("transacciones")
    .select("id", { count: "exact", head: true })
    .eq("espacio_id", espacioId);

  if ((count ?? 0) >= QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE) {
    return {
      error: {
        _global: [
          `Has alcanzado el límite de ${QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE} transacciones en este espacio.`,
        ],
      },
    };
  }

  // Caso especial: Transferencia entre cuentas (genera salida en origen y entrada en destino)
  if (parsed.data.tipo === "transferencia" && parsed.data.cuenta_destino_id) {
    const { data: cuentasInfo } = await supabase
      .from("cuentas_dinero")
      .select("id, nombre")
      .eq("espacio_id", espacioId)
      .in("id", [parsed.data.cuenta_dinero_id, parsed.data.cuenta_destino_id]);

    const origenNombre =
      cuentasInfo?.find((c) => c.id === parsed.data.cuenta_dinero_id)?.nombre ?? "Cuenta origen";
    const destinoNombre =
      cuentasInfo?.find((c) => c.id === parsed.data.cuenta_destino_id)?.nombre ?? "Cuenta destino";

    const transferGroupId = crypto.randomUUID();
    const notaUsuario = parsed.data.descripcion ? ` · ${parsed.data.descripcion}` : "";

    const { error: txError } = await supabase.from("transacciones").insert([
      {
        espacio_id: espacioId,
        cuenta_dinero_id: parsed.data.cuenta_dinero_id,
        tipo: "transferencia_salida",
        monto: parsed.data.monto,
        ocurrido_en: parsed.data.ocurrido_en,
        transfer_group_id: transferGroupId,
        descripcion: encryptFieldSync(`Transferencia hacia ${destinoNombre}${notaUsuario}`),
      },
      {
        espacio_id: espacioId,
        cuenta_dinero_id: parsed.data.cuenta_destino_id,
        tipo: "transferencia_entrada",
        monto: parsed.data.monto,
        ocurrido_en: parsed.data.ocurrido_en,
        transfer_group_id: transferGroupId,
        descripcion: encryptFieldSync(`Transferencia desde ${origenNombre}${notaUsuario}`),
      },
    ]);

    if (txError) return { error: { _global: [txError.message] } };

    revalidatePath("/movimientos");
    revalidatePath("/cuentas");
    revalidatePath("/inicio");
    return { success: true };
  }

  // Resolver o crear categoría si se proporcionó nombre de categoría en ingreso/gasto
  let finalCategoriaId = parsed.data.categoria_id || null;
  if (
    !finalCategoriaId &&
    parsed.data.categoria_nombre &&
    (parsed.data.tipo === "ingreso" || parsed.data.tipo === "gasto")
  ) {
    const catName = parsed.data.categoria_nombre.trim();
    const { data: existingCat } = await supabase
      .from("categorias")
      .select("id, nombre")
      .eq("espacio_id", espacioId)
      .eq("tipo", parsed.data.tipo)
      .ilike("nombre", catName)
      .maybeSingle();

    if (existingCat?.id) {
      finalCategoriaId = existingCat.id;
    } else {
      const { data: newCat } = await supabase
        .from("categorias")
        .insert({
          espacio_id: espacioId,
          nombre: catName,
          tipo: parsed.data.tipo,
        })
        .select("id")
        .maybeSingle();

      if (newCat?.id) {
        finalCategoriaId = newCat.id;
      }
    }
  }

  const { error } = await supabase.from("transacciones").insert({
    espacio_id: espacioId,
    cuenta_dinero_id: parsed.data.cuenta_dinero_id,
    tipo: parsed.data.tipo,
    ajuste_sentido: parsed.data.ajuste_sentido,
    monto: parsed.data.monto,
    ocurrido_en: parsed.data.ocurrido_en,
    descripcion: encryptFieldSync(parsed.data.descripcion) || null,
    categoria_id: finalCategoriaId,
  });

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/inicio");
  return { success: true };
}

// ── Eliminar movimiento manual (o par de transferencia) ───────────────────
export async function eliminarMovimiento(txId: string, espacioId: string) {
  if (!isValidUuid(txId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { data: tx } = await supabase
    .from("transacciones")
    .select("id, prestamo_id, pago_prestamo_id, transfer_group_id")
    .eq("id", txId)
    .eq("espacio_id", espacioId)
    .maybeSingle();

  if (!tx) {
    return { error: "El movimiento no existe." };
  }

  if (tx.prestamo_id || tx.pago_prestamo_id) {
    return {
      error:
        "Este movimiento está vinculado a un préstamo o cobro. Anúlalo desde la sección de Cobros o Préstamos para mantener la integridad contable.",
    };
  }

  if (tx.transfer_group_id) {
    const { error } = await supabase
      .from("transacciones")
      .delete()
      .eq("transfer_group_id", tx.transfer_group_id)
      .eq("espacio_id", espacioId);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("transacciones")
      .delete()
      .eq("id", txId)
      .eq("espacio_id", espacioId)
      .is("prestamo_id", null);

    if (error) return { error: error.message };
  }

  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/inicio");
  return {
    success: true,
    message: tx.transfer_group_id
      ? "Transferencia entre cuentas anulada en ambas cuentas."
      : "Movimiento eliminado correctamente.",
  };
}
