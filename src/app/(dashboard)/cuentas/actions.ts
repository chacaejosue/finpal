"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cuentaDineroSchema } from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";

// ── Listar cuentas del espacio ────────────────────────────────────────────
export async function getCuentas(espacioId: string) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

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
        .eq("espacio_id", espacioId)
        .limit(QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE),
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

  const rl = await checkRateLimit({
    action: "mutation:cuenta",
    limit: 20,
    windowMs: 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) return { error: { _global: [rl.message!] } };

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

// ── Actualizar cuenta (corrección de tipeo, nombre, tipo con auditoría) ──────
export async function actualizarCuenta(cuentaId: string, espacioId: string, formData: FormData) {
  if (!isValidUuid(cuentaId) || !isValidUuid(espacioId)) {
    return { error: { _global: ["Identificadores no válidos"] } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { data: anterior } = await supabase
    .from("cuentas_dinero")
    .select("nombre, tipo, saldo_inicial, codigo_moneda")
    .eq("id", cuentaId)
    .eq("espacio_id", espacioId)
    .single();

  if (!anterior) return { error: { _global: ["La cuenta no existe"] } };

  const rawNombre = sanitizeText(formData.get("nombre"));
  const rawTipo = formData.get("tipo") || anterior.tipo;
  const rawSaldoInicial =
    formData.get("saldo_inicial") !== null && formData.get("saldo_inicial") !== ""
      ? formData.get("saldo_inicial")
      : anterior.saldo_inicial;
  const rawMoneda = formData.get("codigo_moneda") || anterior.codigo_moneda || "BOB";

  const parsed = cuentaDineroSchema.safeParse({
    nombre: rawNombre,
    tipo: rawTipo,
    saldo_inicial: rawSaldoInicial,
    codigo_moneda: rawMoneda,
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

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

  // Registrar en tabla de auditoría si hubo cambio en el nombre o tipo
  if (anterior.nombre !== parsed.data.nombre || anterior.tipo !== parsed.data.tipo) {
    try {
      const campo = anterior.nombre !== parsed.data.nombre ? "nombre" : "tipo";
      const valAnt = anterior.nombre !== parsed.data.nombre ? anterior.nombre : anterior.tipo;
      const valNue = anterior.nombre !== parsed.data.nombre ? parsed.data.nombre : parsed.data.tipo;
      await supabase.from("auditoria_cambios").insert({
        espacio_id: espacioId,
        entidad: "cuentas_dinero",
        entidad_id: cuentaId,
        campo_modificado: campo,
        valor_anterior: valAnt,
        valor_nuevo: valNue,
        motivo: sanitizeText(formData.get("motivo")) || "Corrección de tipeo / nombre",
        usuario_id: user.id,
      });
    } catch {
      // Ignorar si la tabla de auditoría aún no se ha creado
    }
  }

  revalidatePath("/cuentas");
  return { success: true };
}

// ── Consultar historial de auditoría de una entidad ────────────────────────
export async function getAuditoriaEntidad(espacioId: string, entidad: string, entidadId?: string) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    let query = supabase
      .from("auditoria_cambios")
      .select("id, campo_modificado, valor_anterior, valor_nuevo, motivo, created_at, entidad_id")
      .eq("espacio_id", espacioId)
      .eq("entidad", entidad)
      .order("created_at", { ascending: false });

    if (entidadId && isValidUuid(entidadId)) {
      query = query.eq("entidad_id", entidadId);
    }

    const { data, error } = await query.limit(30);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}


// ── Desactivar (borrado lógico) cuenta ────────────────────────────────────
export async function desactivarCuenta(cuentaId: string, espacioId: string) {
  if (!isValidUuid(cuentaId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("cuentas_dinero")
    .update({ es_activa: false })
    .eq("id", cuentaId)
    .eq("espacio_id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/cuentas");
  return { success: true };
}

// ── Eliminar o desactivar cuenta de forma inteligente ─────────────────────
export async function eliminarODesactivarCuenta(cuentaId: string, espacioId: string) {
  if (!isValidUuid(cuentaId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  // Verificar si la cuenta tiene transacciones o cobros asociados
  const [{ count: txCount }, { count: pagosCount }] = await Promise.all([
    supabase
      .from("transacciones")
      .select("id", { count: "exact", head: true })
      .eq("cuenta_dinero_id", cuentaId),
    supabase
      .from("pagos_prestamos")
      .select("id", { count: "exact", head: true })
      .eq("cuenta_dinero_id", cuentaId),
  ]);

  const tieneHistorial = (txCount ?? 0) > 0 || (pagosCount ?? 0) > 0;

  if (tieneHistorial) {
    // Caso B: Tiene historial contable -> Desactivación / Archivado seguro
    const { error } = await supabase
      .from("cuentas_dinero")
      .update({ es_activa: false })
      .eq("id", cuentaId)
      .eq("espacio_id", espacioId);

    if (error) return { error: error.message };

    revalidatePath("/cuentas");
    revalidatePath("/inicio");
    return {
      success: true,
      action: "archived" as const,
      message: "La cuenta fue archivada correctamente. Su historial financiero se conserva intacto.",
    };
  } else {
    // Caso A: No tiene ningún movimiento -> Eliminación física definitiva
    const { error } = await supabase
      .from("cuentas_dinero")
      .delete()
      .eq("id", cuentaId)
      .eq("espacio_id", espacioId);

    if (error) return { error: error.message };

    revalidatePath("/cuentas");
    revalidatePath("/inicio");
    return {
      success: true,
      action: "deleted" as const,
      message: "La cuenta fue eliminada definitivamente del sistema.",
    };
  }
}

// ── Reactivar cuenta previamente archivada ────────────────────────────────
export async function reactivarCuenta(cuentaId: string, espacioId: string) {
  if (!isValidUuid(cuentaId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("cuentas_dinero")
    .update({ es_activa: true })
    .eq("id", cuentaId)
    .eq("espacio_id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/cuentas");
  revalidatePath("/inicio");
  return { success: true, message: "¡Cuenta reactivada exitosamente!" };
}

// ── Consultar cuentas archivadas con saldo calculado ─────────────────────
export async function getCuentasArchivadasConSaldo(espacioId: string) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: cuentas, error: cuentasError }, { data: movimientos, error: movimientosError }] =
    await Promise.all([
      supabase
        .from("cuentas_dinero")
        .select("id, nombre, tipo, saldo_inicial, codigo_moneda, es_activa, created_at")
        .eq("espacio_id", espacioId)
        .eq("es_activa", false)
        .order("created_at", { ascending: true }),
      supabase
        .from("transacciones")
        .select("cuenta_dinero_id, tipo, monto, ajuste_sentido")
        .eq("espacio_id", espacioId)
        .limit(QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE),
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

