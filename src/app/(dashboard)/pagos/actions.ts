"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pagoPrestamoSchema } from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";
import { encryptFieldSync, decryptFieldSync, isEncrypted, autoMigrateRow } from "@/lib/crypto";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";

// ── Listar pagos del espacio ──────────────────────────────────────────────
export async function getPagos(espacioId: string) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("pagos_prestamos")
    .select(`
      id, prestamo_id, cuenta_dinero_id, fecha_esperada, recibido_en, monto_total, monto_principal, monto_interes,
      metodo_pago, notas, created_at,
      prestamos(id, nombre, monto_principal, monto_capital_pagado, contactos(id, nombre)),
      cuentas_dinero(id, nombre)
    `)
    .eq("espacio_id", espacioId)
    .order("recibido_en", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(QUOTAS.MAX_QUERY_LIMIT);

  if (error) throw new Error(error.message);

  return (data ?? []).map((pago) => {
    // Auto-migración silenciosa y descifrado de notas del cobro
    if (pago.notas && !isEncrypted(pago.notas)) {
      autoMigrateRow(supabase, "pagos_prestamos", pago.id, { notas: pago.notas });
    }

    // Descifrado del deudor asociado al préstamo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prestamoRel: any = pago.prestamos;
    let decryptedPrestamos = prestamoRel;
    if (prestamoRel) {
      const contactoRel = prestamoRel.contactos;
      let decryptedContactos = contactoRel;
      if (contactoRel) {
        if (Array.isArray(contactoRel)) {
          decryptedContactos = contactoRel.map((c: { id: string; nombre: string }) => ({
            ...c,
            nombre: decryptFieldSync(c.nombre) ?? "",
          }));
        } else {
          decryptedContactos = {
            ...contactoRel,
            nombre: decryptFieldSync(contactoRel.nombre) ?? "",
          };
        }
      }
      decryptedPrestamos = {
        ...prestamoRel,
        contactos: decryptedContactos,
      };
    }

    return {
      ...pago,
      notas: decryptFieldSync(pago.notas),
      prestamos: decryptedPrestamos,
    };
  });
}

// ── Registrar cobro ────────────────────────────────────────────────────────
export async function registrarPago(espacioId: string, formData: FormData) {
  if (!isValidUuid(espacioId)) return { error: { _global: ["Espacio de trabajo no válido"] } };

  const parsed = pagoPrestamoSchema.safeParse({
    prestamo_id: formData.get("prestamo_id"),
    fecha_esperada: formData.get("fecha_esperada"),
    recibido_en: formData.get("recibido_en"),
    monto_total: formData.get("monto_total"),
    monto_principal: formData.get("monto_principal"),
    monto_interes: formData.get("monto_interes"),
    cuenta_dinero_id: formData.get("cuenta_dinero_id"),
    metodo_pago: sanitizeText(formData.get("metodo_pago"), 100),
    notas: sanitizeText(formData.get("notas")),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const rl = await checkRateLimit({
    action: "mutation:pago",
    limit: 30,
    windowMs: 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) return { error: { _global: [rl.message!] } };

  // Invocación a la transacción atómica en PostgreSQL vía RPC (BEGIN...COMMIT con FOR UPDATE)
  const { error: rpcError } = await supabase.rpc("fn_registrar_cobro_prestamo", {
    p_espacio_id: espacioId,
    p_prestamo_id: parsed.data.prestamo_id,
    p_cuenta_dinero_id: parsed.data.cuenta_dinero_id,
    p_fecha_esperada: parsed.data.fecha_esperada,
    p_recibido_en: parsed.data.recibido_en,
    p_monto_total: parsed.data.monto_total,
    p_monto_principal: parsed.data.monto_principal,
    p_monto_interes: parsed.data.monto_interes,
    p_metodo_pago: parsed.data.metodo_pago || null,
    p_notas: encryptFieldSync(parsed.data.notas) || null,
  });

  if (rpcError) {
    return { error: { _global: [rpcError.message] } };
  }

  revalidatePath("/pagos");
  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  revalidatePath("/cuentas");
  return { success: true };
}

// ── Anular / Revertir un cobro registrado por error ────────────────────────
export async function anularPago(pagoId: string, espacioId: string) {
  if (!isValidUuid(pagoId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { data: pago } = await supabase
    .from("pagos_prestamos")
    .select("id, prestamo_id, cuenta_dinero_id, monto_total, monto_principal, monto_interes, recibido_en")
    .eq("id", pagoId)
    .eq("espacio_id", espacioId)
    .maybeSingle();

  if (!pago) {
    return { error: "El cobro no fue encontrado en este espacio." };
  }

  const { data: prestamo } = await supabase
    .from("prestamos")
    .select("id, monto_principal, monto_capital_pagado, estado")
    .eq("id", pago.prestamo_id)
    .eq("espacio_id", espacioId)
    .maybeSingle();

  // 1. Eliminar transacción asociada a este cobro
  const { data: txByPagoId } = await supabase
    .from("transacciones")
    .select("id")
    .eq("espacio_id", espacioId)
    .eq("pago_prestamo_id", pagoId);

  if (txByPagoId && txByPagoId.length > 0) {
    await supabase
      .from("transacciones")
      .delete()
      .eq("espacio_id", espacioId)
      .eq("pago_prestamo_id", pagoId);
  } else {
    // Si el RPC insertó la transacción sin pago_prestamo_id, buscar la transacción pago_prestamo coincidente
    const { data: candidateTx } = await supabase
      .from("transacciones")
      .select("id")
      .eq("espacio_id", espacioId)
      .eq("prestamo_id", pago.prestamo_id)
      .eq("cuenta_dinero_id", pago.cuenta_dinero_id)
      .eq("tipo", "pago_prestamo")
      .eq("monto", pago.monto_total)
      .eq("ocurrido_en", pago.recibido_en)
      .order("created_at", { ascending: false })
      .limit(1);

    if (candidateTx && candidateTx[0]) {
      await supabase
        .from("transacciones")
        .delete()
        .eq("id", candidateTx[0].id)
        .eq("espacio_id", espacioId);
    }
  }

  // 2. Eliminar el registro del cobro en pagos_prestamos
  const { error: delError } = await supabase
    .from("pagos_prestamos")
    .delete()
    .eq("id", pagoId)
    .eq("espacio_id", espacioId);

  if (delError) {
    return { error: delError.message };
  }

  // 3. Restaurar el capital pagado y el estado del préstamo
  if (prestamo) {
    const nuevoCapitalPagado = Math.max(
      0,
      Number(prestamo.monto_capital_pagado) - Number(pago.monto_principal),
    );
    const nuevoEstado =
      nuevoCapitalPagado >= Number(prestamo.monto_principal)
        ? "pagado"
        : prestamo.estado === "pagado"
        ? "activo"
        : prestamo.estado;

    await supabase
      .from("prestamos")
      .update({
        monto_capital_pagado: nuevoCapitalPagado,
        estado: nuevoEstado,
      })
      .eq("id", prestamo.id)
      .eq("espacio_id", espacioId);
  }

  revalidatePath("/pagos");
  revalidatePath("/prestamos");
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/inicio");

  return {
    success: true,
    message: "Cobro anulado correctamente. Se restauró el saldo del préstamo y de la cuenta.",
  };
}
