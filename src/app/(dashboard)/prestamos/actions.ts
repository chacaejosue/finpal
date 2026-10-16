"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prestamoSchema } from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dueDateForMonth(year: number, month: number, day: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return isoDate(new Date(Date.UTC(year, month, Math.min(day, lastDay))));
}

function nextMonthDate(date: string, day: number) {
  const current = new Date(`${date}T00:00:00Z`);
  return dueDateForMonth(current.getUTCFullYear(), current.getUTCMonth() + 1, day);
}

// ── Listar préstamos del espacio ──────────────────────────────────────────
export async function getPrestamos(espacioId: string) {
  if (!isValidUuid(espacioId)) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data, error }, { data: pagos, error: pagosError }] = await Promise.all([
    supabase
    .from("prestamos")
    .select(`
      id, nombre, monto_principal, monto_capital_pagado, cobra_interes,
      tasa_interes_mensual, fecha_inicio, dia_pago, estado, notas,
      archivado_en, created_at,
      contactos(id, nombre, telefono, email, notas)
    `)
    .eq("espacio_id", espacioId)
    .is("archivado_en", null)
    .order("created_at", { ascending: false }),
    supabase
      .from("pagos_prestamos")
      .select("prestamo_id, fecha_esperada, monto_total, monto_interes")
      .eq("espacio_id", espacioId)
      .not("fecha_esperada", "is", null),
  ]);

  if (error) throw new Error(error.message);
  if (pagosError) throw new Error(pagosError.message);

  const pagosPorPrestamo = new Map<string, Map<string, number>>();
  const interesPorPrestamo = new Map<string, number>();
  for (const pago of pagos ?? []) {
    const periodos = pagosPorPrestamo.get(pago.prestamo_id) ?? new Map<string, number>();
    periodos.set(
      pago.fecha_esperada,
      (periodos.get(pago.fecha_esperada) ?? 0) + Number(pago.monto_total),
    );
    pagosPorPrestamo.set(pago.prestamo_id, periodos);
    interesPorPrestamo.set(
      pago.prestamo_id,
      (interesPorPrestamo.get(pago.prestamo_id) ?? 0) + Number(pago.monto_interes),
    );
  }

  const hoy = isoDate(new Date());
  return (data ?? []).map((prestamo) => {
    const periodosPagados = pagosPorPrestamo.get(prestamo.id) ?? new Map<string, number>();
    const primerVencimiento = nextMonthDate(prestamo.fecha_inicio, prestamo.dia_pago);
    const primer = new Date(`${primerVencimiento}T00:00:00Z`);
    const limite = new Date(`${hoy}T00:00:00Z`);
    const pendientes: string[] = [];
    let cursor = primer;

    while (cursor <= limite || pendientes.length === 0) {
      const vencimiento = isoDate(cursor);
      if (!periodosPagados.has(vencimiento)) pendingPush(pendientes, vencimiento);
      if (cursor > limite) break;
      cursor = new Date(`${nextMonthDate(vencimiento, prestamo.dia_pago)}T00:00:00Z`);
    }

    const atrasados = pendientes.filter((periodo) => periodo < hoy);
    const estadoCalculado =
      prestamo.estado === "pagado" || prestamo.estado === "cancelado"
        ? prestamo.estado
        : atrasados.length > 0 ? "atrasado" : "activo";

    return {
      ...prestamo,
      total_pagado: Number(prestamo.monto_capital_pagado),
      interes_pagado_total: interesPorPrestamo.get(prestamo.id) ?? 0,
      estado: estadoCalculado,
      fecha_proximo_pago: pendientes[0] ?? null,
      meses_atrasados: atrasados.length,
      vence_hoy: pendientes[0] === hoy,
    };
  });
}

function pendingPush(periodos: string[], vencimiento: string) {
  periodos.push(vencimiento);
}

// ── Crear préstamo + transacción de entrega ────────────────────────────────

/**
 * Registra un nuevo préstamo y genera su impacto contable automático:
 * 1. Valida el esquema con `prestamoSchema` (coerción de tasa 0% a sin interés).
 * 2. Asocia o crea automáticamente el deudor en la tabla `contactos` del espacio de trabajo.
 * 3. Inserta el registro del préstamo con estado `activo`.
 * 4. Inserta la transacción contable de tipo `entrega_prestamo` para debitar el dinero de la cuenta origen.
 * 5. Revalida rutas del dashboard para actualización en tiempo real.
 */
export async function crearPrestamo(espacioId: string, formData: FormData) {
  const parsed = prestamoSchema.safeParse({
    contacto_id: (formData.get("contacto_id") as string) || undefined,
    contacto_nombre: (formData.get("contacto_nombre") as string) || undefined,
    nombre: (formData.get("nombre") as string) || undefined,
    monto_principal: formData.get("monto_principal"),
    cobra_interes: formData.get("cobra_interes") === "true",
    tasa_interes_mensual: formData.get("tasa_interes_mensual"),
    fecha_inicio: formData.get("fecha_inicio"),
    dia_pago: formData.get("dia_pago"),
    metodo_entrega: (formData.get("metodo_entrega") as string) || undefined,
    notas: (formData.get("notas") as string) || undefined,
    cuenta_dinero_id: formData.get("cuenta_dinero_id"),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  let contactoId = parsed.data.contacto_id || "";
  let nombreDeudor = parsed.data.contacto_nombre?.trim() || "";

  if (!contactoId && nombreDeudor) {
    const { data: contactoExistente } = await supabase
      .from("contactos")
      .select("id, nombre")
      .eq("espacio_id", espacioId)
      .ilike("nombre", nombreDeudor)
      .is("archivado_en", null)
      .maybeSingle();

    if (contactoExistente) {
      contactoId = contactoExistente.id;
      nombreDeudor = contactoExistente.nombre;
    } else {
      const { data: nuevoContacto, error: contactoError } = await supabase
        .from("contactos")
        .insert({ espacio_id: espacioId, nombre: nombreDeudor })
        .select("id, nombre")
        .single();

      if (contactoError || !nuevoContacto) {
        return { error: { _global: [contactoError?.message ?? "No se pudo crear el deudor"] } };
      }
      contactoId = nuevoContacto.id;
      nombreDeudor = nuevoContacto.nombre;
    }
  } else if (contactoId && !nombreDeudor) {
    const { data: c } = await supabase
      .from("contactos")
      .select("nombre")
      .eq("id", contactoId)
      .maybeSingle();
    if (c?.nombre) {
      nombreDeudor = c.nombre;
    }
  }

  if (!contactoId) {
    return { error: { _global: ["Selecciona un deudor o escribe su nombre"] } };
  }

  // Insertar préstamo
  const nombrePrestamo =
    parsed.data.nombre?.trim() || (nombreDeudor ? `Préstamo a ${nombreDeudor}` : "Préstamo");
  const { data: prestamo, error: errPrestamo } = await supabase
    .from("prestamos")
    .insert({
      espacio_id: espacioId,
      contacto_id: contactoId,
      nombre: nombrePrestamo,
      monto_principal: parsed.data.monto_principal,
      cobra_interes: parsed.data.cobra_interes,
      tasa_interes_mensual: parsed.data.tasa_interes_mensual,
      fecha_inicio: parsed.data.fecha_inicio,
      dia_pago: parsed.data.dia_pago,
      metodo_entrega: parsed.data.metodo_entrega || null,
      notas: parsed.data.notas || null,
    })
    .select("id")
    .single();

  if (errPrestamo || !prestamo) return { error: { _global: [errPrestamo?.message ?? "Error al crear el préstamo"] } };

  // Registrar transacción de entrega (salida de dinero)
  await supabase.from("transacciones").insert({
    espacio_id: espacioId,
    cuenta_dinero_id: parsed.data.cuenta_dinero_id,
    tipo: "entrega_prestamo",
    monto: parsed.data.monto_principal,
    ocurrido_en: parsed.data.fecha_inicio,
    prestamo_id: prestamo.id,
    descripcion: `Préstamo entregado: ${nombrePrestamo}`,
  });

  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  revalidatePath("/cuentas");
  return { success: true };
}

// ── Actualizar estado de un préstamo ──────────────────────────────────────
export async function actualizarEstadoPrestamo(
  prestamoId: string,
  espacioId: string,
  estado: "activo" | "pagado" | "atrasado" | "cancelado"
) {
  if (!isValidUuid(prestamoId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }
  if (!["activo", "pagado", "atrasado", "cancelado"].includes(estado)) {
    return { error: "Estado no válido" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("prestamos")
    .update({ estado })
    .eq("id", prestamoId)
    .eq("espacio_id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  return { success: true };
}

// ── Archivar préstamo ─────────────────────────────────────────────────────
export async function archivarPrestamo(prestamoId: string, espacioId: string) {
  if (!isValidUuid(prestamoId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("prestamos")
    .update({ archivado_en: new Date().toISOString() })
    .eq("id", prestamoId)
    .eq("espacio_id", espacioId);

  if (error) return { error: error.message };

  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  return { success: true };
}
