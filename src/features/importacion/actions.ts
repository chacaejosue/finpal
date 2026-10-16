"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  importContactoSchema,
  importPrestamoSchema,
  importMovimientoSchema,
  type ImportContactoRow,
  type ImportPrestamoRow,
  type ImportMovimientoRow,
} from "@/lib/validations/schemas";

export interface ImportResult {
  exitosos: number;
  fallidos: number;
  errores: { fila: number; mensaje: string }[];
}

// ── Importar Contactos por Lotes ─────────────────────────────────────────────
export async function importarContactos(
  espacioId: string,
  filas: unknown[]
): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const errores: { fila: number; mensaje: string }[] = [];
  const filasValidas: ImportContactoRow[] = [];

  filas.forEach((raw, idx) => {
    const res = importContactoSchema.safeParse(raw);
    if (!res.success) {
      const errMsgs = res.error.issues.map((i) => i.message).filter(Boolean).join(", ");
      errores.push({ fila: idx + 1, mensaje: errMsgs || "Datos inválidos en el contacto" });
    } else {
      filasValidas.push(res.data);
    }
  });

  if (filasValidas.length > 0) {
    const records = filasValidas.map((f) => ({
      espacio_id: espacioId,
      nombre: f.nombre,
      telefono: f.telefono || null,
      email: f.email || null,
      notas: f.notas || null,
    }));

    const { error } = await supabase.from("contactos").insert(records);
    if (error) {
      return {
        exitosos: 0,
        fallidos: filas.length,
        errores: [{ fila: 0, mensaje: `Error de base de datos: ${error.message}` }],
      };
    }
  }

  revalidatePath("/contactos");
  revalidatePath("/inicio");

  return {
    exitosos: filasValidas.length,
    fallidos: errores.length,
    errores,
  };
}

// ── Importar Préstamos por Lotes ─────────────────────────────────────────────
export async function importarPrestamos(
  espacioId: string,
  filas: unknown[],
  cuentaDineroId: string
): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  // Obtener contactos existentes en el espacio para mapear por nombre
  const { data: contactosExistentes } = await supabase
    .from("contactos")
    .select("id, nombre")
    .eq("espacio_id", espacioId);

  const contactoMap = new Map<string, string>();
  (contactosExistentes ?? []).forEach((c) => {
    contactoMap.set(c.nombre.toLowerCase().trim(), c.id);
  });

  const errores: { fila: number; mensaje: string }[] = [];
  const registrosParaInsertar: Array<{
    espacio_id: string;
    contacto_id: string;
    nombre: string;
    monto_principal: number;
    cobra_interes: boolean;
    tasa_interes_mensual: number;
    base_interes: string;
    fecha_inicio: string;
    dia_pago: number;
    estado: "activo" | "pagado" | "atrasado" | "cancelado";
    notas: string | null;
  }> = [];

  for (let idx = 0; idx < filas.length; idx++) {
    const raw = filas[idx];
    const res = importPrestamoSchema.safeParse(raw);

    if (!res.success) {
      const errMsgs = res.error.issues.map((i) => i.message).filter(Boolean).join(", ");
      errores.push({ fila: idx + 1, mensaje: errMsgs || "Datos incompletos o formato incorrecto" });
      continue;
    }

    const { data } = res;
    let cId = contactoMap.get(data.contacto_nombre.toLowerCase().trim());

    // Si el contacto no existe, lo creamos automáticamente
    if (!cId) {
      const { data: nuevoContacto, error: errContacto } = await supabase
        .from("contactos")
        .insert({
          espacio_id: espacioId,
          nombre: data.contacto_nombre.trim(),
        })
        .select("id")
        .single();

      if (errContacto || !nuevoContacto || !nuevoContacto.id) {
        errores.push({
          fila: idx + 1,
          mensaje: `No se pudo crear el contacto ${data.contacto_nombre}`,
        });
        continue;
      }
      cId = nuevoContacto.id as string;
      contactoMap.set(data.contacto_nombre.toLowerCase().trim(), cId);
    }

    if (!cId) continue;

    const tasaInteres = Number(data.tasa_interes || 0);
    const cobraInteres = Boolean(data.cobra_interes) && tasaInteres > 0;

    registrosParaInsertar.push({
      espacio_id: espacioId,
      contacto_id: cId,
      nombre: data.nombre,
      monto_principal: data.monto,
      cobra_interes: cobraInteres,
      tasa_interes_mensual: cobraInteres ? tasaInteres : 0,
      base_interes: "saldo_pendiente",
      fecha_inicio: data.fecha_inicio,
      dia_pago: Number(data.dia_pago),
      estado: data.estado ?? "activo",
      notas: data.notas || null,
    });
  }

  if (registrosParaInsertar.length > 0) {
    const { error } = await supabase.from("prestamos").insert(registrosParaInsertar);
    if (error) {
      return {
        exitosos: 0,
        fallidos: filas.length,
        errores: [{ fila: 0, mensaje: `Error de base de datos: ${error.message}` }],
      };
    }
  }

  revalidatePath("/prestamos");
  revalidatePath("/inicio");

  return {
    exitosos: registrosParaInsertar.length,
    fallidos: errores.length,
    errores,
  };
}

// ── Importar Movimientos por Lotes ───────────────────────────────────────────
export async function importarMovimientos(
  espacioId: string,
  filas: unknown[]
): Promise<ImportResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const { data: cuentas } = await supabase
    .from("cuentas_dinero")
    .select("id, nombre")
    .eq("espacio_id", espacioId);

  const cuentaMap = new Map<string, string>();
  (cuentas ?? []).forEach((c) => {
    cuentaMap.set(c.nombre.toLowerCase().trim(), c.id);
  });

  const errores: { fila: number; mensaje: string }[] = [];
  const registrosParaInsertar: Array<{
    espacio_id: string;
    cuenta_dinero_id: string;
    tipo: "ingreso" | "gasto" | "ajuste";
    monto: number;
    ocurrido_en: string;
    descripcion: string | null;
  }> = [];

  filas.forEach((raw, idx) => {
    const res = importMovimientoSchema.safeParse(raw);
    if (!res.success) {
      const errMsgs = res.error.issues.map((i) => i.message).filter(Boolean).join(", ");
      errores.push({ fila: idx + 1, mensaje: errMsgs || "Formato incorrecto en movimiento" });
      return;
    }

    const { data } = res;
    const cuentaId = cuentaMap.get(data.cuenta_nombre.toLowerCase().trim());
    if (!cuentaId) {
      errores.push({
        fila: idx + 1,
        mensaje: `La cuenta "${data.cuenta_nombre}" no existe en este espacio`,
      });
      return;
    }

    registrosParaInsertar.push({
      espacio_id: espacioId,
      cuenta_dinero_id: cuentaId,
      tipo: data.tipo,
      monto: Number(data.monto),
      ocurrido_en: data.fecha,
      descripcion: data.descripcion || null,
    });
  });

  if (registrosParaInsertar.length > 0) {
    const { error } = await supabase.from("transacciones").insert(registrosParaInsertar);
    if (error) {
      return {
        exitosos: 0,
        fallidos: filas.length,
        errores: [{ fila: 0, mensaje: `Error de base de datos: ${error.message}` }],
      };
    }
  }

  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/inicio");

  return {
    exitosos: registrosParaInsertar.length,
    fallidos: errores.length,
    errores,
  };
}
