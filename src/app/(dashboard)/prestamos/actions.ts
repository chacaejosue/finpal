"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  prestamoSchema,
  actualizarPrestamoSchema,
  ampliarCapitalSchema,
} from "@/lib/validations/schemas";

import { isValidUuid, sanitizeText } from "@/lib/security";
import { encryptFieldSync, decryptFieldSync, isEncrypted, autoMigrateRow } from "@/lib/crypto";
import { getLocalDateString, formatMonthYear, formatDateEs } from "@/lib/format-date";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";

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

  const [{ data, error }, { data: pagos, error: pagosError }, { data: espacioData }] = await Promise.all([
    supabase
      .from("prestamos")
      .select(`
        id, nombre, monto_principal, monto_capital_pagado, cobra_interes,
        tasa_interes_mensual, fecha_inicio, dia_pago, estado, metodo_entrega, notas,
        archivado_en, created_at,
        contactos(id, nombre, telefono, email, notas)
      `)
      .eq("espacio_id", espacioId)
      .is("archivado_en", null)
      .order("created_at", { ascending: false })
      .limit(QUOTAS.MAX_LOANS_PER_WORKSPACE),
    supabase
      .from("pagos_prestamos")
      .select("id, prestamo_id, fecha_esperada, recibido_en, monto_total, monto_principal, monto_interes, created_at")
      .eq("espacio_id", espacioId)
      .order("recibido_en", { ascending: false })
      .limit(QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE),
    supabase
      .from("espacios_trabajo")
      .select("zona_horaria")
      .eq("id", espacioId)
      .maybeSingle(),
  ]);

  if (error) throw new Error(error.message);
  if (pagosError) throw new Error(pagosError.message);

  type PagoItem = {
    id: string;
    fecha_esperada: string | null;
    recibido_en: string;
    monto_total: number;
    monto_principal: number;
    monto_interes: number;
  };

  const pagosPorPrestamo = new Map<string, PagoItem[]>();
  const setFechasPagadas = new Map<string, Set<string>>();
  const setMesesPagados = new Map<string, Set<string>>();
  const interesPorPrestamo = new Map<string, number>();

  for (const pago of pagos ?? []) {
    const list = pagosPorPrestamo.get(pago.prestamo_id) ?? [];
    list.push({
      id: pago.id,
      fecha_esperada: pago.fecha_esperada,
      recibido_en: pago.recibido_en,
      monto_total: Number(pago.monto_total),
      monto_principal: Number(pago.monto_principal),
      monto_interes: Number(pago.monto_interes),
    });
    pagosPorPrestamo.set(pago.prestamo_id, list);

    if (pago.fecha_esperada) {
      const fechas = setFechasPagadas.get(pago.prestamo_id) ?? new Set<string>();
      fechas.add(pago.fecha_esperada);
      setFechasPagadas.set(pago.prestamo_id, fechas);

      const mesKey = pago.fecha_esperada.slice(0, 7);
      const meses = setMesesPagados.get(pago.prestamo_id) ?? new Set<string>();
      meses.add(mesKey);
      setMesesPagados.set(pago.prestamo_id, meses);
    }

    interesPorPrestamo.set(
      pago.prestamo_id,
      (interesPorPrestamo.get(pago.prestamo_id) ?? 0) + Number(pago.monto_interes),
    );
  }

  const timezone = espacioData?.zona_horaria || "America/La_Paz";
  const hoy = getLocalDateString(new Date(), timezone);
  const hoyTime = new Date(`${hoy}T00:00:00Z`).getTime();

  return (data ?? []).map((prestamo) => {
    const pagosList = pagosPorPrestamo.get(prestamo.id) ?? [];
    const fechasPagadas = setFechasPagadas.get(prestamo.id) ?? new Set<string>();
    const mesesPagados = setMesesPagados.get(prestamo.id) ?? new Set<string>();

    const primerVencimiento = nextMonthDate(prestamo.fecha_inicio, prestamo.dia_pago);
    let cursor = new Date(`${primerVencimiento}T00:00:00Z`);
    const pendientes: string[] = [];

    type PeriodoSugerido = {
      fecha: string;
      mes_nombre: string;
      estado: "vencido" | "hoy" | "proximo" | "adelantado";
      dias_diferencia: number;
      label: string;
    };

    const periodosSugeridos: PeriodoSugerido[] = [];
    let futurosCount = 0;
    const maxFuturos = 6;

    while (futurosCount < maxFuturos) {
      const vencimiento = isoDate(cursor);
      const mesKey = vencimiento.slice(0, 7);
      const yaPagado = fechasPagadas.has(vencimiento) || mesesPagados.has(mesKey);

      if (!yaPagado) {
        pendientes.push(vencimiento);

        const vTime = cursor.getTime();
        const diffDias = Math.round((hoyTime - vTime) / (1000 * 60 * 60 * 24));
        let estadoPeriodo: "vencido" | "hoy" | "proximo" | "adelantado" = "proximo";
        let labelEstado = "";

        if (vencimiento < hoy) {
          estadoPeriodo = "vencido";
          labelEstado = `Atrasada por ${diffDias} día${diffDias === 1 ? "" : "s"}`;
        } else if (vencimiento === hoy) {
          estadoPeriodo = "hoy";
          labelEstado = "Vence hoy";
        } else if (futurosCount === 0 && pendientes.length === 1) {
          estadoPeriodo = "proximo";
          labelEstado = `Próximo vencimiento (en ${Math.abs(diffDias)} días)`;
        } else {
          estadoPeriodo = "adelantado";
          labelEstado = "Pago adelantado";
        }

        const mesNombre = formatMonthYear(vencimiento);
        periodosSugeridos.push({
          fecha: vencimiento,
          mes_nombre: mesNombre,
          estado: estadoPeriodo,
          dias_diferencia: diffDias,
          label: `${formatDateEs(vencimiento)} · Cuota de ${mesNombre} (${labelEstado})`,
        });
      }

      if (cursor.getTime() >= hoyTime) {
        futurosCount++;
      }

      cursor = new Date(`${nextMonthDate(vencimiento, prestamo.dia_pago)}T00:00:00Z`);
    }

    const atrasados = pendientes.filter((periodo) => periodo < hoy);
    const estadoCalculado =
      prestamo.estado === "pagado" || prestamo.estado === "cancelado"
        ? prestamo.estado
        : atrasados.length > 0 ? "atrasado" : "activo";

    const oldestAtrasado = atrasados[0];
    const diasAtraso = oldestAtrasado
      ? Math.max(0, Math.round((hoyTime - new Date(`${oldestAtrasado}T00:00:00Z`).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const ultimoPago = pagosList.length > 0 ? pagosList[0] : null;
    const ultimoMesCubierto = ultimoPago?.fecha_esperada ? formatMonthYear(ultimoPago.fecha_esperada) : null;

    // Auto-migración silenciosa y descifrado de notas del préstamo
    if (prestamo.notas && !isEncrypted(prestamo.notas)) {
      autoMigrateRow(supabase, "prestamos", prestamo.id, { notas: prestamo.notas });
    }

    // Auto-migración silenciosa y descifrado del contacto relacionado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawContactos = prestamo.contactos as any;
    let decryptedContactos = rawContactos;
    if (rawContactos) {
      if (Array.isArray(rawContactos)) {
        decryptedContactos = rawContactos.map((c) => {
          if (!isEncrypted(c.nombre) || (c.telefono && !isEncrypted(c.telefono)) || (c.email && !isEncrypted(c.email)) || (c.notas && !isEncrypted(c.notas))) {
            autoMigrateRow(supabase, "contactos", c.id, {
              ...(!isEncrypted(c.nombre) ? { nombre: c.nombre } : {}),
              ...(c.telefono && !isEncrypted(c.telefono) ? { telefono: c.telefono } : {}),
              ...(c.email && !isEncrypted(c.email) ? { email: c.email } : {}),
              ...(c.notas && !isEncrypted(c.notas) ? { notas: c.notas } : {}),
            });
          }
          return {
            ...c,
            nombre: decryptFieldSync(c.nombre) ?? "",
            telefono: decryptFieldSync(c.telefono) ?? "",
            email: decryptFieldSync(c.email) ?? "",
            notas: decryptFieldSync(c.notas) ?? "",
          };
        });
      } else {
        if (!isEncrypted(rawContactos.nombre) || (rawContactos.telefono && !isEncrypted(rawContactos.telefono)) || (rawContactos.email && !isEncrypted(rawContactos.email)) || (rawContactos.notas && !isEncrypted(rawContactos.notas))) {
          autoMigrateRow(supabase, "contactos", rawContactos.id, {
            ...(!isEncrypted(rawContactos.nombre) ? { nombre: rawContactos.nombre } : {}),
            ...(rawContactos.telefono && !isEncrypted(rawContactos.telefono) ? { telefono: rawContactos.telefono } : {}),
            ...(rawContactos.email && !isEncrypted(rawContactos.email) ? { email: rawContactos.email } : {}),
            ...(rawContactos.notas && !isEncrypted(rawContactos.notas) ? { notas: rawContactos.notas } : {}),
          });
        }
        decryptedContactos = {
          ...rawContactos,
          nombre: decryptFieldSync(rawContactos.nombre) ?? "",
          telefono: decryptFieldSync(rawContactos.telefono) ?? "",
          email: decryptFieldSync(rawContactos.email) ?? "",
          notas: decryptFieldSync(rawContactos.notas) ?? "",
        };
      }
    }

    return {
      ...prestamo,
      notas: decryptFieldSync(prestamo.notas),
      contactos: decryptedContactos,
      total_pagado: Number(prestamo.monto_capital_pagado),
      interes_pagado_total: interesPorPrestamo.get(prestamo.id) ?? 0,
      estado: estadoCalculado,
      fecha_proximo_pago: pendientes[0] ?? null,
      meses_atrasados: atrasados.length,
      dias_atraso: diasAtraso,
      vence_hoy: pendientes[0] === hoy,
      periodos_sugeridos: periodosSugeridos,
      ultimo_mes_cubierto: ultimoMesCubierto,
      ultimo_pago: ultimoPago
        ? {
            recibido_en: ultimoPago.recibido_en,
            fecha_esperada: ultimoPago.fecha_esperada,
            mes_cubierto: ultimoMesCubierto,
            monto_total: ultimoPago.monto_total,
            monto_interes: ultimoPago.monto_interes,
            monto_principal: ultimoPago.monto_principal,
          }
        : null,
    };
  });
}

// ── Crear préstamo + transacción de entrega ────────────────────────────────
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

  const rl = await checkRateLimit({
    action: "mutation:prestamo",
    limit: 25,
    windowMs: 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) return { error: { _global: [rl.message!] } };

  const { count } = await supabase
    .from("prestamos")
    .select("id", { count: "exact", head: true })
    .eq("espacio_id", espacioId);

  if ((count ?? 0) >= QUOTAS.MAX_LOANS_PER_WORKSPACE) {
    return {
      error: {
        _global: [
          `Has alcanzado el límite máximo de ${QUOTAS.MAX_LOANS_PER_WORKSPACE} préstamos en este espacio.`,
        ],
      },
    };
  }

  let contactoId = parsed.data.contacto_id || "";
  let nombreDeudor = parsed.data.contacto_nombre?.trim() || "";

  if (!contactoId && nombreDeudor) {
    const { data: contactosEspacio } = await supabase
      .from("contactos")
      .select("id, nombre")
      .eq("espacio_id", espacioId)
      .is("archivado_en", null);

    const match = (contactosEspacio ?? []).find(
      (c) => (decryptFieldSync(c.nombre) ?? "").toLowerCase().trim() === nombreDeudor.toLowerCase().trim()
    );

    if (match) {
      contactoId = match.id;
      nombreDeudor = decryptFieldSync(match.nombre) ?? nombreDeudor;
    } else {
      const { data: nuevoContacto, error: contactoError } = await supabase
        .from("contactos")
        .insert({ espacio_id: espacioId, nombre: encryptFieldSync(nombreDeudor)! })
        .select("id, nombre")
        .single();

      if (contactoError || !nuevoContacto) {
        return { error: { _global: [contactoError?.message ?? "No se pudo crear el deudor"] } };
      }
      contactoId = nuevoContacto.id;
      nombreDeudor = decryptFieldSync(nuevoContacto.nombre) ?? nombreDeudor;
    }
  } else if (contactoId && !nombreDeudor) {
    const { data: c } = await supabase
      .from("contactos")
      .select("nombre")
      .eq("id", contactoId)
      .maybeSingle();
    if (c?.nombre) {
      nombreDeudor = decryptFieldSync(c.nombre) ?? "";
    }
  }

  if (!contactoId) {
    return { error: { _global: ["Selecciona un deudor o escribe su nombre"] } };
  }

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
      notas: encryptFieldSync(parsed.data.notas) || null,
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
    descripcion: encryptFieldSync(`Préstamo entregado: ${nombrePrestamo}`),
  });

  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  revalidatePath("/cuentas");
  return { success: true };
}

// ── Actualizar parámetros de un préstamo existente ────────────────────────
export async function actualizarPrestamo(
  prestamoId: string,
  espacioId: string,
  formData: FormData,
) {
  if (!isValidUuid(prestamoId) || !isValidUuid(espacioId)) {
    return { error: { _global: ["Identificadores no válidos"] } };
  }

  const parsed = actualizarPrestamoSchema.safeParse({
    nombre: sanitizeText(formData.get("nombre"), 150),
    cobra_interes: formData.get("cobra_interes") === "true",
    tasa_interes_mensual: formData.get("tasa_interes_mensual"),
    dia_pago: formData.get("dia_pago"),
    notas: sanitizeText(formData.get("notas"), 1000),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { error } = await supabase
    .from("prestamos")
    .update({
      nombre: parsed.data.nombre,
      cobra_interes: parsed.data.cobra_interes,
      tasa_interes_mensual: parsed.data.tasa_interes_mensual,
      dia_pago: parsed.data.dia_pago,
      notas: encryptFieldSync(parsed.data.notas) || null,
    })
    .eq("id", prestamoId)
    .eq("espacio_id", espacioId);

  if (error) return { error: { _global: [error.message] } };

  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  return { success: true };
}

// ── Ampliar capital de un préstamo existente (Recarga / Refinanciamiento) ─
export async function ampliarCapitalPrestamo(
  prestamoId: string,
  espacioId: string,
  formData: FormData,
) {
  if (!isValidUuid(prestamoId) || !isValidUuid(espacioId)) {
    return { error: { _global: ["Identificadores no válidos"] } };
  }

  const parsed = ampliarCapitalSchema.safeParse({
    monto_ampliacion: formData.get("monto_ampliacion"),
    cuenta_dinero_id: formData.get("cuenta_dinero_id"),
    fecha: formData.get("fecha"),
    notas: sanitizeText(formData.get("notas"), 500),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { data: actual } = await supabase
    .from("prestamos")
    .select("id, nombre, monto_principal, estado, notas")
    .eq("id", prestamoId)
    .eq("espacio_id", espacioId)
    .single();

  if (!actual) return { error: { _global: ["El préstamo no existe"] } };

  const nuevoMontoPrincipal = Number(actual.monto_principal) + Number(parsed.data.monto_ampliacion);
  const notaAnterior = decryptFieldSync(actual.notas) ?? "";
  const notaAdicional = `[Ampliación ${formatDateEs(parsed.data.fecha)}: +${parsed.data.monto_ampliacion}${parsed.data.notas ? ` — ${parsed.data.notas}` : ""}]`;
  const nuevaNota = notaAnterior ? `${notaAnterior}\n${notaAdicional}` : notaAdicional;

  const { error: errUpdate } = await supabase
    .from("prestamos")
    .update({
      monto_principal: nuevoMontoPrincipal,
      estado: actual.estado === "pagado" ? "activo" : actual.estado,
      notas: encryptFieldSync(nuevaNota),
    })
    .eq("id", prestamoId)
    .eq("espacio_id", espacioId);

  if (errUpdate) return { error: { _global: [errUpdate.message] } };

  // Registrar desembolso adicional en transacciones
  await supabase.from("transacciones").insert({
    espacio_id: espacioId,
    cuenta_dinero_id: parsed.data.cuenta_dinero_id,
    tipo: "entrega_prestamo",
    monto: parsed.data.monto_ampliacion,
    ocurrido_en: parsed.data.fecha,
    prestamo_id: prestamoId,
    descripcion: encryptFieldSync(
      `Ampliación de capital (${actual.nombre})${parsed.data.notas ? `: ${parsed.data.notas}` : ""}`,
    ),
  });

  revalidatePath("/prestamos");
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/inicio");
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
