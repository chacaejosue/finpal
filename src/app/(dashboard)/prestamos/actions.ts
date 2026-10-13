"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prestamoSchema } from "@/lib/validations/schemas";

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
  const supabase = await createClient();
  const [{ data, error }, { data: pagos, error: pagosError }] = await Promise.all([
    supabase
    .from("prestamos")
    .select(`
      id, nombre, monto_principal, monto_capital_pagado, cobra_interes,
      tasa_interes_mensual, fecha_inicio, dia_pago, estado, notas,
      archivado_en, created_at,
      contactos(id, nombre)
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
export async function crearPrestamo(espacioId: string, formData: FormData) {
  const parsed = prestamoSchema.safeParse({
    contacto_id: formData.get("contacto_id"),
    contacto_nombre: formData.get("contacto_nombre"),
    nombre: formData.get("nombre"),
    monto_principal: formData.get("monto_principal"),
    cobra_interes: formData.get("cobra_interes") === "true",
    tasa_interes_mensual: formData.get("tasa_interes_mensual"),
    fecha_inicio: formData.get("fecha_inicio"),
    dia_pago: formData.get("dia_pago"),
    metodo_entrega: formData.get("metodo_entrega"),
    notas: formData.get("notas"),
    cuenta_dinero_id: formData.get("cuenta_dinero_id"),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  let contactoId = parsed.data.contacto_id || "";
  if (!contactoId && parsed.data.contacto_nombre) {
    const nombreContacto = parsed.data.contacto_nombre.trim();
    const { data: contactoExistente } = await supabase
      .from("contactos")
      .select("id")
      .eq("espacio_id", espacioId)
      .ilike("nombre", nombreContacto)
      .is("archivado_en", null)
      .maybeSingle();

    if (contactoExistente) {
      contactoId = contactoExistente.id;
    } else {
      const { data: nuevoContacto, error: contactoError } = await supabase
        .from("contactos")
        .insert({ espacio_id: espacioId, nombre: nombreContacto })
        .select("id")
        .single();

      if (contactoError || !nuevoContacto) {
        return { error: { _global: [contactoError?.message ?? "No se pudo crear el deudor"] } };
      }
      contactoId = nuevoContacto.id;
    }
  }

  if (!contactoId) {
    return { error: { _global: ["Selecciona un deudor o escribe su nombre"] } };
  }

  // Insertar préstamo
  const nombrePrestamo =
    parsed.data.nombre || `Préstamo a ${parsed.data.contacto_nombre || "este deudor"}`;
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
      metodo_entrega: parsed.data.metodo_entrega,
      notas: parsed.data.notas,
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
