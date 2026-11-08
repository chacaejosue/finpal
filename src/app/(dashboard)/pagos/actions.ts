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

  // Consultar el registro de cobro recién creado para emitir el comprobante
  const { data: nuevoPago } = await supabase
    .from("pagos_prestamos")
    .select(`
      id, prestamo_id, cuenta_dinero_id, fecha_esperada, recibido_en, monto_total, monto_principal, monto_interes,
      metodo_pago, notas, created_at,
      prestamos (id, nombre, monto_principal, monto_capital_pagado, tasa_interes_mensual, cobra_interes, contactos (id, nombre, telefono, email)),
      cuentas_dinero (id, nombre, codigo_moneda)
    `)
    .eq("espacio_id", espacioId)
    .eq("prestamo_id", parsed.data.prestamo_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  revalidatePath("/pagos");
  revalidatePath("/prestamos");
  revalidatePath("/inicio");
  revalidatePath("/cuentas");
  return {
    success: true,
    pago: nuevoPago
      ? {
          ...nuevoPago,
          notas: decryptFieldSync(nuevoPago.notas),
        }
      : undefined,
  };
}

// ── Anular / Revertir un cobro registrado por error ────────────────────────
// Un cobro revertido debe desaparecer de TODAS las vistas y cálculos
// (/pagos, /movimientos, saldos de cuentas, reportes, intereses percibidos)
// como si nunca hubiera existido; el único rastro es la bitácora de auditoría.
type ResultadoAnulacion =
  | { success: true; message: string; error?: undefined }
  | { error: string; success?: undefined; message?: undefined };

const MENSAJE_EXITO_ANULACION =
  "Cobro revertido correctamente. Se eliminó el ingreso de la cuenta, se descontó el interés, se restauró el saldo del préstamo y quedó registrado en el historial de eliminaciones.";

function revalidarVistasCobro() {
  revalidatePath("/pagos");
  revalidatePath("/prestamos");
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/reportes");
  revalidatePath("/inicio");
}

function esFuncionInexistente(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false;
  return (
    err.code === "PGRST202" ||
    err.code === "42883" ||
    /could not find the function|does not exist/i.test(err.message ?? "")
  );
}

export async function anularPago(
  pagoId: string,
  espacioId: string,
  transaccionId?: string,
): Promise<ResultadoAnulacion> {
  if (!isValidUuid(pagoId) || !isValidUuid(espacioId)) {
    return { error: "Identificadores no válidos" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  // 1. Camino preferido: reversión atómica en PostgreSQL (todo o nada)
  const { error: rpcError } = await supabase.rpc("fn_anular_cobro_prestamo", {
    p_espacio_id: espacioId,
    p_pago_id: pagoId,
    p_transaccion_id: transaccionId && isValidUuid(transaccionId) ? transaccionId : null,
    p_motivo: null,
  });

  if (!rpcError) {
    revalidarVistasCobro();
    return { success: true, message: MENSAJE_EXITO_ANULACION };
  }

  if (!esFuncionInexistente(rpcError)) {
    return { error: `No se pudo revertir el cobro: ${rpcError.message}` };
  }

  // 2. Respaldo (si aún no se aplicó supabase/setup/7-anulacion-cobros.sql):
  //    cada borrado se verifica y, si algo falla, se restaura lo eliminado
  //    para no dejar el cobro "a medias".
  return await anularPagoSinRpc(pagoId, espacioId, user.id, transaccionId);
}

async function anularPagoSinRpc(
  pagoId: string,
  espacioId: string,
  userId: string,
  transaccionId?: string,
): Promise<ResultadoAnulacion> {
  const supabase = await createClient();

  const { data: pago } = await supabase
    .from("pagos_prestamos")
    .select("id, prestamo_id, cuenta_dinero_id, monto_total, monto_principal, monto_interes, recibido_en")
    .eq("id", pagoId)
    .eq("espacio_id", espacioId)
    .maybeSingle();

  if (!pago) {
    return { error: "El cobro no fue encontrado en este espacio." };
  }

  const [{ data: prestamo }, { data: cuenta }] = await Promise.all([
    supabase
      .from("prestamos")
      .select("id, nombre, monto_principal, monto_capital_pagado, estado")
      .eq("id", pago.prestamo_id)
      .eq("espacio_id", espacioId)
      .maybeSingle(),
    supabase
      .from("cuentas_dinero")
      .select("id, nombre")
      .eq("id", pago.cuenta_dinero_id)
      .eq("espacio_id", espacioId)
      .maybeSingle(),
  ]);

  // Localizar todas las transacciones del cobro
  const idsTx = new Set<string>();
  if (transaccionId && isValidUuid(transaccionId)) idsTx.add(transaccionId);

  const { data: txEnlazadas } = await supabase
    .from("transacciones")
    .select("id")
    .eq("espacio_id", espacioId)
    .eq("pago_prestamo_id", pagoId);
  (txEnlazadas ?? []).forEach((t) => idsTx.add(t.id));

  if (idsTx.size === 0) {
    const { data: candidatas } = await supabase
      .from("transacciones")
      .select("id, prestamo_id, ocurrido_en")
      .eq("espacio_id", espacioId)
      .eq("tipo", "pago_prestamo")
      .is("pago_prestamo_id", null)
      .eq("cuenta_dinero_id", pago.cuenta_dinero_id)
      .eq("monto", pago.monto_total)
      .order("created_at", { ascending: false })
      .limit(10);

    const mejor = (candidatas ?? [])
      .filter((t) => !t.prestamo_id || t.prestamo_id === pago.prestamo_id)
      .sort((a, b) => Number(b.ocurrido_en === pago.recibido_en) - Number(a.ocurrido_en === pago.recibido_en))[0];
    if (mejor) idsTx.add(mejor.id);
  }

  // Borrar transacciones guardando copia para poder restaurarlas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let txBorradas: any[] = [];
  if (idsTx.size > 0) {
    const { data: borradas, error: delTxError } = await supabase
      .from("transacciones")
      .delete()
      .eq("espacio_id", espacioId)
      .in("id", Array.from(idsTx))
      .select("*");

    if (delTxError) return { error: `No se pudo eliminar el ingreso del cobro: ${delTxError.message}` };
    txBorradas = borradas ?? [];
    if (txBorradas.length === 0) {
      return {
        error:
          "No tienes permiso para eliminar movimientos en este espacio. Pide al administrador que aplique el script supabase/setup/7-anulacion-cobros.sql.",
      };
    }
  }

  // Borrar el cobro (verificando que realmente se eliminó)
  const { data: pagosBorrados, error: delError } = await supabase
    .from("pagos_prestamos")
    .delete()
    .eq("id", pagoId)
    .eq("espacio_id", espacioId)
    .select("id");

  if (delError || !pagosBorrados || pagosBorrados.length === 0) {
    // Restaurar el ingreso para no dejar el cobro a medias
    if (txBorradas.length > 0) {
      await supabase.from("transacciones").insert(txBorradas);
    }
    return {
      error: delError
        ? `No se pudo revertir el cobro: ${delError.message}`
        : "No tienes permiso para eliminar cobros en este espacio. Pide al administrador que aplique el script supabase/setup/7-anulacion-cobros.sql.",
    };
  }

  // Restaurar capital y estado del préstamo
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
      .update({ monto_capital_pagado: nuevoCapitalPagado, estado: nuevoEstado })
      .eq("id", prestamo.id)
      .eq("espacio_id", espacioId);
  }

  await supabase.from("auditoria_cambios").insert({
    espacio_id: espacioId,
    entidad: "pagos_prestamos",
    entidad_id: pagoId,
    campo_modificado: "anulacion_cobro",
    valor_anterior: JSON.stringify({
      tipo: "pago_prestamo",
      monto_total: Number(pago.monto_total),
      monto_principal: Number(pago.monto_principal),
      monto_interes: Number(pago.monto_interes),
      prestamo_id: pago.prestamo_id,
      prestamo_nombre: prestamo?.nombre ?? null,
      cuenta_dinero_id: pago.cuenta_dinero_id,
      cuenta_nombre: cuenta?.nombre ?? null,
      recibido_en: pago.recibido_en,
      transacciones_eliminadas: txBorradas.length,
    }),
    valor_nuevo: "eliminado",
    motivo: "Cobro revertido y eliminado por corrección del usuario",
    usuario_id: userId,
  });

  revalidarVistasCobro();
  return { success: true, message: MENSAJE_EXITO_ANULACION };
}
