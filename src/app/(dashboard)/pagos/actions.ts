"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pagoPrestamoSchema } from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";

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
    .order("recibido_en", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
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

  const { data: prestamoActual, error: prestamoError } = await supabase
    .from("prestamos")
    .select("monto_principal, monto_capital_pagado")
    .eq("id", parsed.data.prestamo_id)
    .eq("espacio_id", espacioId)
    .single();

  if (prestamoError || !prestamoActual) {
    return { error: { _global: ["No se encontró el préstamo seleccionado"] } };
  }

  const capitalPendiente =
    Number(prestamoActual.monto_principal) - Number(prestamoActual.monto_capital_pagado);
  if (parsed.data.monto_principal > capitalPendiente + 0.01) {
    return {
      error: {
        monto_principal: [
          `El capital abonado no puede superar el saldo pendiente de ${capitalPendiente.toFixed(2)}`,
        ],
      },
    };
  }

  // Insertar pago
  const { data: pago, error: errPago } = await supabase
    .from("pagos_prestamos")
    .insert({
      espacio_id: espacioId,
      prestamo_id: parsed.data.prestamo_id,
      fecha_esperada: parsed.data.fecha_esperada,
      recibido_en: parsed.data.recibido_en,
      monto_total: parsed.data.monto_total,
      monto_principal: parsed.data.monto_principal,
      monto_interes: parsed.data.monto_interes,
      cuenta_dinero_id: parsed.data.cuenta_dinero_id,
      metodo_pago: parsed.data.metodo_pago,
      notas: parsed.data.notas,
    })
    .select("id")
    .single();

  if (errPago || !pago) return { error: { _global: [errPago?.message ?? "Error al registrar el pago"] } };

  // Registrar transacción de ingreso
  await supabase.from("transacciones").insert({
    espacio_id: espacioId,
    cuenta_dinero_id: parsed.data.cuenta_dinero_id,
    tipo: "pago_prestamo",
    monto: parsed.data.monto_total,
    ocurrido_en: parsed.data.recibido_en,
    prestamo_id: parsed.data.prestamo_id,
    pago_prestamo_id: pago.id,
    descripcion: `Cobro de préstamo`,
  });

  // Actualizar monto_capital_pagado en el préstamo
  if (prestamoActual) {
    const nuevoPagado = Number(prestamoActual.monto_capital_pagado) + parsed.data.monto_principal;
    const estadoNuevo = nuevoPagado >= Number(prestamoActual.monto_principal)
      ? "pagado"
      : parsed.data.recibido_en > parsed.data.fecha_esperada ? "atrasado" : "activo";
    await supabase
      .from("prestamos")
      .update({ monto_capital_pagado: nuevoPagado, estado: estadoNuevo })
      .eq("id", parsed.data.prestamo_id)
      .eq("espacio_id", espacioId);
  }

  revalidatePath("/pagos");
  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  revalidatePath("/cuentas");
  return { success: true };
}
