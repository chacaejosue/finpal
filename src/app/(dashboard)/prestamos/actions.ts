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
import { getLocalDateString, formatMonthYear, formatDateEs, isoDate, dueDateForMonth, nextMonthDate } from "@/lib/format-date";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";

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
  const esHistorico = formData.get("es_historico") === "true";
  const descontarDeCuenta = formData.get("descontar_de_cuenta") !== "false";
  const cuotasHistoricasPagadas = (formData.get("cuotas_historicas_pagadas") as string) || "[]";
  const capitalAmortizadoPrevio = formData.get("capital_amortizado_previo") || "0";

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
    cuenta_dinero_id: (formData.get("cuenta_dinero_id") as string) || undefined,
    es_historico: esHistorico,
    descontar_de_cuenta: descontarDeCuenta,
    cuotas_historicas_pagadas: cuotasHistoricasPagadas,
    capital_amortizado_previo: capitalAmortizadoPrevio,
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

  const capitalAmortizadoVal = parsed.data.es_historico
    ? Math.min(parsed.data.monto_principal, parsed.data.capital_amortizado_previo)
    : 0;
  const estadoInicial = capitalAmortizadoVal >= parsed.data.monto_principal ? "pagado" : "activo";

  const { data: prestamo, error: errPrestamo } = await supabase
    .from("prestamos")
    .insert({
      espacio_id: espacioId,
      contacto_id: contactoId,
      nombre: nombrePrestamo,
      monto_principal: parsed.data.monto_principal,
      monto_capital_pagado: capitalAmortizadoVal,
      cobra_interes: parsed.data.cobra_interes,
      tasa_interes_mensual: parsed.data.tasa_interes_mensual,
      fecha_inicio: parsed.data.fecha_inicio,
      dia_pago: parsed.data.dia_pago,
      estado: estadoInicial,
      metodo_entrega: parsed.data.metodo_entrega || null,
      notas: encryptFieldSync(parsed.data.notas) || null,
    })
    .select("id")
    .single();

  if (errPrestamo || !prestamo) return { error: { _global: [errPrestamo?.message ?? "Error al crear el préstamo"] } };

  // Registrar desembolso en transacciones únicamente si no es histórico o si el usuario pide descontar
  if (!parsed.data.es_historico || parsed.data.descontar_de_cuenta) {
    if (parsed.data.cuenta_dinero_id) {
      await supabase.from("transacciones").insert({
        espacio_id: espacioId,
        cuenta_dinero_id: parsed.data.cuenta_dinero_id,
        tipo: "entrega_prestamo",
        monto: parsed.data.monto_principal,
        ocurrido_en: parsed.data.fecha_inicio,
        prestamo_id: prestamo.id,
        descripcion: encryptFieldSync(`Préstamo entregado: ${nombrePrestamo}`),
      });
    }
  }

  // Registrar cuotas históricas ya cubiertas previamente (sin crear transacciones de caja que alteren saldos)
  if (parsed.data.es_historico) {
    let cuotasFechas: string[] = [];
    try {
      cuotasFechas = JSON.parse(parsed.data.cuotas_historicas_pagadas);
    } catch {
      cuotasFechas = [];
    }

    if (Array.isArray(cuotasFechas) && cuotasFechas.length > 0) {
      // Determinar una cuenta válida para satisfacer la restricción NOT NULL en pagos_prestamos
      let cuentaParaPagosId = parsed.data.cuenta_dinero_id;
      if (!cuentaParaPagosId) {
        const { data: cDefault } = await supabase
          .from("cuentas_dinero")
          .select("id")
          .eq("espacio_id", espacioId)
          .limit(1)
          .maybeSingle();
        cuentaParaPagosId = cDefault?.id || "";
      }

      if (cuentaParaPagosId) {
        const totalCuotas = cuotasFechas.length;
        const totalCapitalAmortizado = capitalAmortizadoVal;
        const capitalPorCuota = Math.round((totalCapitalAmortizado / totalCuotas) * 100) / 100;
        let capitalAcumulado = 0;

        const tasa = parsed.data.tasa_interes_mensual;
        const interesPorCuota = parsed.data.cobra_interes && tasa > 0
          ? Math.max(0, Math.round((parsed.data.monto_principal * (tasa / 100)) * 100) / 100)
          : 0;

        const pagosPayload = cuotasFechas.map((fechaVenc, idx) => {
          let principalThis = capitalPorCuota;
          if (idx === totalCuotas - 1) {
            principalThis = Math.max(0, Math.round((totalCapitalAmortizado - capitalAcumulado) * 100) / 100);
          } else {
            capitalAcumulado += capitalPorCuota;
          }

          let interesThis = interesPorCuota;
          let totalThis = Math.round((principalThis + interesThis) * 100) / 100;

          // chk_desglose_pago exige monto_total > 0 y monto_principal + monto_interes = monto_total
          if (totalThis <= 0) {
            interesThis = 0.01;
            totalThis = 0.01;
          }

          return {
            espacio_id: espacioId,
            prestamo_id: prestamo.id,
            recibido_en: fechaVenc,
            fecha_esperada: fechaVenc,
            monto_total: totalThis,
            monto_principal: principalThis,
            monto_interes: interesThis,
            cuenta_dinero_id: cuentaParaPagosId,
            metodo_pago: "Registro histórico",
            notas: encryptFieldSync(
              `[Migración previa a FinPal] Cuota de ${formatMonthYear(fechaVenc)} cubierta en Excel antes de registrar en FinPal.`
            ),
          };
        });

        await supabase.from("pagos_prestamos").insert(pagosPayload);
      }
    }
  }

  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  revalidatePath("/cuentas");
  revalidatePath("/pagos");
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
    fecha_inicio: (formData.get("fecha_inicio") as string) || undefined,
    notas: sanitizeText(formData.get("notas"), 1000),
  });

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const updateData: Record<string, unknown> = {
    nombre: parsed.data.nombre,
    cobra_interes: parsed.data.cobra_interes,
    tasa_interes_mensual: parsed.data.tasa_interes_mensual,
    dia_pago: parsed.data.dia_pago,
    notas: encryptFieldSync(parsed.data.notas) || null,
  };
  if (parsed.data.fecha_inicio) {
    updateData.fecha_inicio = parsed.data.fecha_inicio;
  }

  const { error } = await supabase
    .from("prestamos")
    .update(updateData)
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


// ── Eliminar y Revertir Préstamo (Desembolso + Cobros + Saldos + Auditoría) ─
type ResultadoAnulacionPrestamo =
  | { success: true; message: string; error?: undefined }
  | { error: string; success?: undefined; message?: undefined };

const MENSAJE_EXITO_ANULACION_PRESTAMO =
  "Préstamo eliminado y revertido por completo. Se devolvió el capital desembolsado a la cuenta, se revirtieron sus movimientos asociados y quedó registrado en el historial de eliminaciones.";

function revalidarVistasPrestamo() {
  revalidatePath("/prestamos");
  revalidatePath("/pagos");
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/contactos");
  revalidatePath("/reportes");
  revalidatePath("/inicio");
}

function esFuncionRpcInexistente(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return (
    err.code === "PGRST202" ||
    err.code === "42883" ||
    /could not find the function|does not exist/i.test(err.message ?? "")
  );
}

export async function anularPrestamo(
  prestamoId: string,
  espacioId: string,
  transaccionId?: string,
): Promise<ResultadoAnulacionPrestamo> {
  if (!isValidUuid(prestamoId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  // 1. Camino preferido: reversión atómica en PostgreSQL vía RPC
  const { error: rpcError } = await supabase.rpc("fn_anular_prestamo", {
    p_espacio_id: espacioId,
    p_prestamo_id: prestamoId,
    p_transaccion_id: transaccionId && isValidUuid(transaccionId) ? transaccionId : null,
    p_motivo: null,
  });

  if (!rpcError) {
    revalidarVistasPrestamo();
    return { success: true, message: MENSAJE_EXITO_ANULACION_PRESTAMO };
  }

  if (!esFuncionRpcInexistente(rpcError)) {
    return { error: `No se pudo eliminar y revertir el préstamo: ${rpcError.message}` };
  }

  // 2. Respaldo coordinado con restauración automática si aún no se aplicó fn_anular_prestamo
  return await anularPrestamoSinRpc(prestamoId, espacioId, user.id, transaccionId);
}

async function anularPrestamoSinRpc(
  prestamoId: string,
  espacioId: string,
  userId: string,
  transaccionId?: string,
): Promise<ResultadoAnulacionPrestamo> {
  const supabase = await createClient();

  const { data: prestamo } = await supabase
    .from("prestamos")
    .select("id, nombre, monto_principal, monto_capital_pagado, fecha_inicio, estado")
    .eq("id", prestamoId)
    .eq("espacio_id", espacioId)
    .maybeSingle();

  if (!prestamo) {
    return { error: "El préstamo no fue encontrado en este espacio." };
  }

  // Consultar cobros asociados al préstamo
  const { data: pagosAsociadosData } = await supabase
    .from("pagos_prestamos")
    .select("*")
    .eq("prestamo_id", prestamoId)
    .eq("espacio_id", espacioId);

  const pagosAsociados = pagosAsociadosData ?? [];
  const pagoIds = pagosAsociados.map((p) => p.id);

  // Localizar transacciones vinculadas al préstamo y a sus cobros
  const idsTx = new Set<string>();
  if (transaccionId && isValidUuid(transaccionId)) idsTx.add(transaccionId);

  const { data: txDelPrestamo } = await supabase
    .from("transacciones")
    .select("id, tipo, cuenta_dinero_id")
    .eq("espacio_id", espacioId)
    .eq("prestamo_id", prestamoId);

  let cuentaDesembolsoId: string | null = null;
  for (const t of txDelPrestamo ?? []) {
    idsTx.add(t.id);
    if (t.tipo === "entrega_prestamo" && !cuentaDesembolsoId) {
      cuentaDesembolsoId = t.cuenta_dinero_id;
    }
  }

  if (pagoIds.length > 0) {
    const { data: txDePagos } = await supabase
      .from("transacciones")
      .select("id")
      .eq("espacio_id", espacioId)
      .in("pago_prestamo_id", pagoIds);
    (txDePagos ?? []).forEach((t) => idsTx.add(t.id));
  }

  // Si no había transacción de desembolso con prestamo_id enlazado, buscar huérfana coincidente
  if (!cuentaDesembolsoId) {
    const { data: candidatas } = await supabase
      .from("transacciones")
      .select("id, cuenta_dinero_id, ocurrido_en")
      .eq("espacio_id", espacioId)
      .eq("tipo", "entrega_prestamo")
      .is("prestamo_id", null)
      .eq("monto", prestamo.monto_principal)
      .order("created_at", { ascending: false })
      .limit(10);

    const mejor = (candidatas ?? []).sort(
      (a, b) => Number(b.ocurrido_en === prestamo.fecha_inicio) - Number(a.ocurrido_en === prestamo.fecha_inicio),
    )[0];
    if (mejor) {
      idsTx.add(mejor.id);
      cuentaDesembolsoId = mejor.cuenta_dinero_id;
    }
  }

  let cuentaNombre: string | null = null;
  if (cuentaDesembolsoId) {
    const { data: c } = await supabase
      .from("cuentas_dinero")
      .select("nombre")
      .eq("id", cuentaDesembolsoId)
      .eq("espacio_id", espacioId)
      .maybeSingle();
    cuentaNombre = c?.nombre ?? null;
  }

  // 1. Eliminar transacciones guardando copia para restaurar ante cualquier fallo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let txBorradas: any[] = [];
  if (idsTx.size > 0) {
    const { data: borradas, error: delTxError } = await supabase
      .from("transacciones")
      .delete()
      .eq("espacio_id", espacioId)
      .in("id", Array.from(idsTx))
      .select("*");

    if (delTxError) {
      return { error: `No se pudieron revertir los movimientos del préstamo: ${delTxError.message}` };
    }
    txBorradas = borradas ?? [];
    if (txBorradas.length === 0) {
      return {
        error:
          "No tienes permiso para revertir movimientos en este espacio. Aplica el script supabase/setup/7-anulacion-cobros.sql.",
      };
    }
  }

  // 2. Eliminar cobros asociados al préstamo (si los hubiera)
  if (pagosAsociados.length > 0) {
    const { data: pagosBorrados, error: delPagosError } = await supabase
      .from("pagos_prestamos")
      .delete()
      .eq("prestamo_id", prestamoId)
      .eq("espacio_id", espacioId)
      .select("id");

    if (delPagosError || !pagosBorrados || pagosBorrados.length === 0) {
      if (txBorradas.length > 0) {
        await supabase.from("transacciones").insert(txBorradas);
      }
      return {
        error: delPagosError
          ? `No se pudieron revertir los cobros del préstamo: ${delPagosError.message}`
          : "No tienes permiso para eliminar cobros asociados. Aplica el script supabase/setup/7-anulacion-cobros.sql.",
      };
    }
  }

  // 3. Eliminar pagos esperados (si los hubiera)
  await supabase
    .from("pagos_esperados")
    .delete()
    .eq("prestamo_id", prestamoId)
    .eq("espacio_id", espacioId);

  // 4. Eliminar el préstamo
  const { data: prestamoBorrado, error: delPrestamoError } = await supabase
    .from("prestamos")
    .delete()
    .eq("id", prestamoId)
    .eq("espacio_id", espacioId)
    .select("id");

  if (delPrestamoError || !prestamoBorrado || prestamoBorrado.length === 0) {
    // Restaurar cobros y transacciones para no dejar el préstamo a medias
    if (pagosAsociados.length > 0) {
      await supabase.from("pagos_prestamos").insert(pagosAsociados);
    }
    if (txBorradas.length > 0) {
      await supabase.from("transacciones").insert(txBorradas);
    }
    return {
      error: delPrestamoError
        ? `No se pudo eliminar el préstamo: ${delPrestamoError.message}`
        : "No tienes permiso para eliminar préstamos en este espacio. Aplica el script supabase/setup/7-anulacion-cobros.sql.",
    };
  }

  const montoTotalCobrado = pagosAsociados.reduce((acc, p) => acc + Number(p.monto_total), 0);
  const montoInteresCobrado = pagosAsociados.reduce((acc, p) => acc + Number(p.monto_interes), 0);

  // 5. Registrar en bitácora de auditoría
  await supabase.from("auditoria_cambios").insert({
    espacio_id: espacioId,
    entidad: "prestamos",
    entidad_id: prestamoId,
    campo_modificado: "anulacion_prestamo",
    valor_anterior: JSON.stringify({
      tipo: "entrega_prestamo",
      prestamo_id: prestamo.id,
      prestamo_nombre: prestamo.nombre,
      monto: Number(prestamo.monto_principal),
      monto_total: Number(prestamo.monto_principal),
      monto_principal: Number(prestamo.monto_principal),
      monto_capital_pagado: Number(prestamo.monto_capital_pagado),
      monto_interes: montoInteresCobrado,
      monto_total_cobrado: montoTotalCobrado,
      cobros_eliminados: pagosAsociados.length,
      transacciones_eliminadas: txBorradas.length,
      cuenta_dinero_id: cuentaDesembolsoId,
      cuenta_nombre: cuentaNombre,
      ocurrido_en: prestamo.fecha_inicio,
    }),
    valor_nuevo: "eliminado",
    motivo: "Préstamo eliminado y revertido en cuentas y movimientos",
    usuario_id: userId,
  });

  revalidarVistasPrestamo();
  return { success: true, message: MENSAJE_EXITO_ANULACION_PRESTAMO };
}
