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
      id, fecha_esperada, recibido_en, monto_total, monto_principal, monto_interes,
      metodo_pago, notas, created_at,
      prestamos(id, nombre, contactos(id, nombre)),
      cuentas_dinero(id, nombre)
    `)
    .eq("espacio_id", espacioId)
    .order("recibido_en", { ascending: false })
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

/**
 * Registra un cobro de préstamo y procesa su impacto contable y estado de cartera:
 * 1. Valida el desglose contable (total = capital + interés) y sanea entradas de texto.
 * 2. Verifica que el abono de capital no exceda el saldo pendiente real del préstamo.
 * 3. Inserta el cobro en `pagos_prestamos`.
 * 4. Inserta la transacción contable de tipo `pago_prestamo` para acreditar el dinero a la cuenta seleccionada.
 * 5. Actualiza `monto_capital_pagado` en el préstamo:
 *    - Si el capital devuelto cubre el 100% del principal -> estado pasa a `pagado`.
 *    - Si queda saldo y la fecha de cobro excedió el vencimiento -> pasa a `atrasado`.
 *    - Si queda saldo y está al día -> permanece `activo`.
 */
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
  // REGLA 2: Se cifra p_notas antes de enviarlo al procedimiento almacenado
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

