"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transaccionSchema } from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";
import { encryptFieldSync, decryptFieldSync, isEncrypted, autoMigrateRow } from "@/lib/crypto";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";
import { anularPago } from "@/app/(dashboard)/pagos/actions";

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

// ── Eliminar movimiento manual, transferencia o cobro ───────────────────
export async function eliminarMovimiento(txId: string, espacioId: string) {
  if (!isValidUuid(txId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { data: tx } = await supabase
    .from("transacciones")
    .select("id, tipo, ajuste_sentido, monto, ocurrido_en, descripcion, cuenta_dinero_id, prestamo_id, pago_prestamo_id, transfer_group_id")
    .eq("id", txId)
    .eq("espacio_id", espacioId)
    .maybeSingle();

  if (!tx) {
    return { error: "El movimiento no existe." };
  }

  // 1. Caso Desembolso de préstamo: Proteger integridad del expediente
  if (tx.tipo === "entrega_prestamo") {
    return {
      error:
        "Este movimiento corresponde al desembolso de un préstamo. Para anularlo o modificarlo, gestiona el préstamo desde su expediente para no desajustar el capital original.",
    };
  }

  // 2. Caso Cobro de cuota / Pago de préstamo: Deshacer cobro, revertir interés y restaurar saldos
  if (tx.tipo === "pago_prestamo" || tx.pago_prestamo_id) {
    let pagoId = tx.pago_prestamo_id;

    if (!pagoId && tx.prestamo_id) {
      // Buscar el cobro coincidente si la transacción histórica no tenía pago_prestamo_id enlazado
      const { data: pagoCandidato } = await supabase
        .from("pagos_prestamos")
        .select("id")
        .eq("espacio_id", espacioId)
        .eq("prestamo_id", tx.prestamo_id)
        .eq("cuenta_dinero_id", tx.cuenta_dinero_id)
        .eq("monto_total", tx.monto)
        .order("created_at", { ascending: false })
        .limit(1);

      if (pagoCandidato && pagoCandidato[0]) {
        pagoId = pagoCandidato[0].id;
      }
    }

    if (pagoId) {
      return await anularPago(pagoId, espacioId, tx.id);
    }

    // Si no existe pago_prestamo asociado (transacción huérfana), eliminarla y auditar
    const { error: delTxError } = await supabase
      .from("transacciones")
      .delete()
      .eq("id", txId)
      .eq("espacio_id", espacioId);

    if (delTxError) return { error: delTxError.message };

    await supabase.from("auditoria_cambios").insert({
      espacio_id: espacioId,
      entidad: "transacciones",
      entidad_id: txId,
      campo_modificado: "anulacion_cobro",
      valor_anterior: JSON.stringify({
        tipo: tx.tipo,
        monto_total: Number(tx.monto),
        cuenta_dinero_id: tx.cuenta_dinero_id,
        prestamo_id: tx.prestamo_id,
        ocurrido_en: tx.ocurrido_en,
        descripcion: decryptFieldSync(tx.descripcion),
      }),
      valor_nuevo: "eliminado",
      motivo: "Transacción de cobro eliminada por el usuario",
      usuario_id: user.id,
    });

    revalidatePath("/movimientos");
    revalidatePath("/cuentas");
    revalidatePath("/prestamos");
    revalidatePath("/inicio");

    return {
      success: true,
      message: "Cobro eliminado correctamente y registrado en la auditoría.",
    };
  }

  // 3. Caso Transferencia entre cuentas: Eliminar ambas patas de forma coordinada
  if (tx.transfer_group_id) {
    const { error } = await supabase
      .from("transacciones")
      .delete()
      .eq("transfer_group_id", tx.transfer_group_id)
      .eq("espacio_id", espacioId);

    if (error) return { error: error.message };

    await supabase.from("auditoria_cambios").insert({
      espacio_id: espacioId,
      entidad: "transacciones",
      entidad_id: txId,
      campo_modificado: "eliminacion_transferencia",
      valor_anterior: JSON.stringify({
        tipo: tx.tipo,
        monto: Number(tx.monto),
        cuenta_dinero_id: tx.cuenta_dinero_id,
        transfer_group_id: tx.transfer_group_id,
        ocurrido_en: tx.ocurrido_en,
        descripcion: decryptFieldSync(tx.descripcion),
      }),
      valor_nuevo: "eliminado",
      motivo: "Transferencia entre cuentas eliminada por el usuario",
      usuario_id: user.id,
    });

    revalidatePath("/movimientos");
    revalidatePath("/cuentas");
    revalidatePath("/inicio");

    return {
      success: true,
      message: "Transferencia entre cuentas anulada en ambas cuentas y registrada en la auditoría.",
    };
  }

  // 4. Caso General: Ingreso, gasto o ajuste manual
  const { error } = await supabase
    .from("transacciones")
    .delete()
    .eq("id", txId)
    .eq("espacio_id", espacioId);

  if (error) return { error: error.message };

  await supabase.from("auditoria_cambios").insert({
    espacio_id: espacioId,
    entidad: "transacciones",
    entidad_id: txId,
    campo_modificado: "eliminacion_movimiento",
    valor_anterior: JSON.stringify({
      tipo: tx.tipo,
      ajuste_sentido: tx.ajuste_sentido,
      monto: Number(tx.monto),
      cuenta_dinero_id: tx.cuenta_dinero_id,
      ocurrido_en: tx.ocurrido_en,
      descripcion: decryptFieldSync(tx.descripcion),
    }),
    valor_nuevo: "eliminado",
    motivo: "Movimiento eliminado por el usuario",
    usuario_id: user.id,
  });

  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/inicio");

  return {
    success: true,
    message: "Movimiento eliminado correctamente y registrado en la auditoría.",
  };
}

// ── Tipos y Consulta de Auditoría de Eliminaciones ───────────────────────
export type RegistroAuditoriaEliminacion = {
  id: string;
  entidad: string;
  entidad_id: string;
  campo_modificado: string;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  motivo: string | null;
  usuario_id: string | null;
  created_at: string;
  perfiles?: {
    id: string;
    nombre_mostrado: string | null;
  } | null;
};

export async function getAuditoriaEliminaciones(
  espacioId: string,
  limit = 50,
): Promise<RegistroAuditoriaEliminacion[]> {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const safeLimit = Math.min(Math.max(1, limit), 100);

  const { data, error } = await supabase
    .from("auditoria_cambios")
    .select(`
      id, entidad, entidad_id, campo_modificado, valor_anterior, valor_nuevo, motivo, usuario_id, created_at,
      perfiles(id, nombre_mostrado)
    `)
    .eq("espacio_id", espacioId)
    .in("campo_modificado", [
      "anulacion_cobro",
      "eliminacion_movimiento",
      "eliminacion_transferencia",
    ])
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error("Error al consultar bitácora de auditoría:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    perfiles: Array.isArray(row.perfiles) ? row.perfiles[0] : row.perfiles,
  }));
}
