"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cuentaDineroSchema } from "@/lib/validations/schemas";

// ── Listar cuentas del espacio ────────────────────────────────────────────
export async function getCuentas(espacioId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cuentas_dinero")
    .select("id, nombre, tipo, saldo_inicial, codigo_moneda, es_activa, created_at")
    .eq("espacio_id", espacioId)
    .eq("es_activa", true)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Cargar todos los saldos con una consulta de movimientos, evitando una
// petición independiente por cada cuenta.
export async function getCuentasConSaldo(espacioId: string) {
  const supabase = await createClient();
  const [{ data: cuentas, error: cuentasError }, { data: movimientos, error: movimientosError }] =
    await Promise.all([
      supabase
        .from("cuentas_dinero")
        .select("id, nombre, tipo, saldo_inicial, codigo_moneda, es_activa, created_at")
        .eq("espacio_id", espacioId)
        .eq("es_activa", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("transacciones")
        .select("cuenta_dinero_id, tipo, monto, ajuste_sentido")
        .eq("espacio_id", espacioId),
    ]);

  if (cuentasError) throw new Error(cuentasError.message);
  if (movimientosError) throw new Error(movimientosError.message);

  const deltas = new Map<string, number>();
  for (const movimiento of movimientos ?? []) {
    const suma =
      ["ingreso", "transferencia_entrada", "pago_prestamo"].includes(movimiento.tipo) ||
      (movimiento.tipo === "ajuste" && movimiento.ajuste_sentido === "sumar");
    const delta = suma ? Number(movimiento.monto) : -Number(movimiento.monto);
    deltas.set(
      movimiento.cuenta_dinero_id,
      (deltas.get(movimiento.cuenta_dinero_id) ?? 0) + delta,
    );
  }

  return (cuentas ?? []).map((cuenta) => ({
    ...cuenta,
    saldo: Number(cuenta.saldo_inicial) + (deltas.get(cuenta.id) ?? 0),
  }));
}

// ── Saldo calculado de una cuenta (saldo_inicial + movimientos) ───────────
export async function getSaldoCuenta(cuentaId: string) {
  const supabase = await createClient();
  const { data: cuenta } = await supabase
    .from("cuentas_dinero")
    .select("saldo_inicial")
    .eq("id", cuentaId)
    .single();

  const { data: txs } = await supabase
    .from("transacciones")
    .select("tipo, monto, ajuste_sentido")
    .eq("cuenta_dinero_id", cuentaId);

  if (!cuenta) return 0;

  const delta = (txs ?? []).reduce((sum, tx) => {
    if (["ingreso", "transferencia_entrada", "pago_prestamo"].includes(tx.tipo)) return sum + Number(tx.monto);
    if (tx.tipo === "ajuste" && tx.ajuste_sentido === "sumar") return sum + Number(tx.monto);
    return sum - Number(tx.monto);
  }, 0);

  return Number(cuenta.saldo_inicial) + delta;
}

// ── Crear cuenta ─────────────────────────────────────────────────────────
export async function crearCuenta(espacioId: string, formData: FormData) {
  const parsed = cuentaDineroSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    saldo_inicial: formData.get("saldo_inicial"),
    codigo_moneda: formData.get("codigo_moneda") ?? "BOB",
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase.from("cuentas_dinero").insert({
    espacio_id: espacioId,
    nombre: parsed.data.nombre,
    tipo: parsed.data.tipo,
    saldo_inicial: parsed.data.saldo_inicial,
    codigo_moneda: parsed.data.codigo_moneda,
  });

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/cuentas");
  return { success: true };
}

// ── Actualizar cuenta ─────────────────────────────────────────────────────
export async function actualizarCuenta(cuentaId: string, espacioId: string, formData: FormData) {
  const parsed = cuentaDineroSchema.safeParse({
    nombre: formData.get("nombre"),
    tipo: formData.get("tipo"),
    saldo_inicial: formData.get("saldo_inicial"),
    codigo_moneda: formData.get("codigo_moneda") ?? "BOB",
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cuentas_dinero")
    .update({
      nombre: parsed.data.nombre,
      tipo: parsed.data.tipo,
      saldo_inicial: parsed.data.saldo_inicial,
      codigo_moneda: parsed.data.codigo_moneda,
    })
    .eq("id", cuentaId)
    .eq("espacio_id", espacioId);

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/cuentas");
  return { success: true };
}

// ── Desactivar (soft-delete) cuenta ──────────────────────────────────────
export async function desactivarCuenta(cuentaId: string, espacioId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cuentas_dinero")
    .update({ es_activa: false })
    .eq("id", cuentaId)
    .eq("espacio_id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/cuentas");
  return { success: true };
}
