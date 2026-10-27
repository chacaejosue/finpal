"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  importContactoSchema,
  importPrestamoSchema,
  importMovimientoSchema,
  type ImportContactoRow,
} from "@/lib/validations/schemas";
import { encryptFieldSync, decryptFieldSync } from "@/lib/crypto";
import { isValidUuid, sanitizeText } from "@/lib/security";
import { checkRateLimit, QUOTAS } from "@/lib/rate-limit";

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
  if (!isValidUuid(espacioId)) {
    return {
      exitosos: 0,
      fallidos: 0,
      errores: [{ fila: 0, mensaje: "Identificador de espacio no válido." }],
    };
  }

  if (!Array.isArray(filas) || filas.length === 0) {
    return {
      exitosos: 0,
      fallidos: 0,
      errores: [{ fila: 0, mensaje: "No hay filas para importar." }],
    };
  }

  if (filas.length > QUOTAS.MAX_IMPORT_ROWS_PER_BATCH) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [
        {
          fila: 0,
          mensaje: `Por seguridad, el máximo permitido por lote es de ${QUOTAS.MAX_IMPORT_ROWS_PER_BATCH} filas.`,
        },
      ],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const rl = await checkRateLimit({
    action: "import:contactos",
    limit: 3,
    windowMs: 5 * 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [{ fila: 0, mensaje: rl.message! }],
    };
  }

  const { count: currentCount } = await supabase
    .from("contactos")
    .select("id", { count: "exact", head: true })
    .eq("espacio_id", espacioId);

  if ((currentCount ?? 0) + filas.length > QUOTAS.MAX_CONTACTS_PER_WORKSPACE) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [
        {
          fila: 0,
          mensaje: `Este espacio superaría el límite máximo de ${QUOTAS.MAX_CONTACTS_PER_WORKSPACE} contactos.`,
        },
      ],
    };
  }

  const errores: { fila: number; mensaje: string }[] = [];
  const filasValidas: ImportContactoRow[] = [];

  filas.forEach((raw, idx) => {
    const res = importContactoSchema.safeParse(raw);
    if (!res.success) {
      const errMsgs = res.error.issues
        .map((i) => i.message)
        .filter(Boolean)
        .join(", ");
      errores.push({
        fila: idx + 1,
        mensaje: errMsgs || "Datos inválidos en el contacto",
      });
    } else {
      filasValidas.push(res.data);
    }
  });

  if (filasValidas.length > 0) {
    const records = filasValidas.map((f) => ({
      espacio_id: espacioId,
      nombre: encryptFieldSync(sanitizeText(f.nombre, 150))!,
      telefono: encryptFieldSync(sanitizeText(f.telefono, 30)) || null,
      email: encryptFieldSync(sanitizeText(f.email, 150)) || null,
      notas: encryptFieldSync(sanitizeText(f.notas, 1000)) || null,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _cuentaDineroId: string
): Promise<ImportResult> {
  if (!isValidUuid(espacioId)) {
    return {
      exitosos: 0,
      fallidos: 0,
      errores: [{ fila: 0, mensaje: "Identificador de espacio no válido." }],
    };
  }

  if (!Array.isArray(filas) || filas.length === 0) {
    return {
      exitosos: 0,
      fallidos: 0,
      errores: [{ fila: 0, mensaje: "No hay filas para importar." }],
    };
  }

  if (filas.length > QUOTAS.MAX_IMPORT_ROWS_PER_BATCH) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [
        {
          fila: 0,
          mensaje: `Por seguridad, el máximo permitido por lote es de ${QUOTAS.MAX_IMPORT_ROWS_PER_BATCH} filas.`,
        },
      ],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const rl = await checkRateLimit({
    action: "import:prestamos",
    limit: 3,
    windowMs: 5 * 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [{ fila: 0, mensaje: rl.message! }],
    };
  }

  const { count: currentLoansCount } = await supabase
    .from("prestamos")
    .select("id", { count: "exact", head: true })
    .eq("espacio_id", espacioId);

  if ((currentLoansCount ?? 0) + filas.length > QUOTAS.MAX_LOANS_PER_WORKSPACE) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [
        {
          fila: 0,
          mensaje: `Este espacio superaría el límite máximo de ${QUOTAS.MAX_LOANS_PER_WORKSPACE} préstamos.`,
        },
      ],
    };
  }

  // Obtener contactos existentes en el espacio para mapear por nombre (con límite defensivo)
  const { data: contactosExistentes } = await supabase
    .from("contactos")
    .select("id, nombre")
    .eq("espacio_id", espacioId)
    .limit(QUOTAS.MAX_CONTACTS_PER_WORKSPACE);

  const contactoMap = new Map<string, string>();
  (contactosExistentes ?? []).forEach((c) => {
    const decNombre = decryptFieldSync(c.nombre) ?? "";
    contactoMap.set(decNombre.toLowerCase().trim(), c.id);
  });

  const errores: { fila: number; mensaje: string }[] = [];
  const filasParseadas: Array<{
    idx: number;
    data: NonNullable<ReturnType<typeof importPrestamoSchema.safeParse>["data"]>;
  }> = [];

  for (let idx = 0; idx < filas.length; idx++) {
    const raw = filas[idx];
    const res = importPrestamoSchema.safeParse(raw);
    if (!res.success) {
      const errMsgs = res.error.issues
        .map((i) => i.message)
        .filter(Boolean)
        .join(", ");
      errores.push({
        fila: idx + 1,
        mensaje: errMsgs || "Datos incompletos o formato incorrecto",
      });
      continue;
    }
    filasParseadas.push({ idx, data: res.data });
  }

  // Crear contactos faltantes en UN SOLO LOTE (evita ataque N+1 de base de datos)
  const nombresFaltantesUnicos = new Map<string, string>(); // lowerName -> originalCleanName
  for (const item of filasParseadas) {
    const cleanName = sanitizeText(item.data.contacto_nombre, 150);
    const key = cleanName.toLowerCase().trim();
    if (key && !contactoMap.has(key) && !nombresFaltantesUnicos.has(key)) {
      nombresFaltantesUnicos.set(key, cleanName);
    }
  }

  if (nombresFaltantesUnicos.size > 0) {
    const listaOriginal = Array.from(nombresFaltantesUnicos.entries());
    const payloadNuevosContactos = listaOriginal.map(([, originalName]) => ({
      espacio_id: espacioId,
      nombre: encryptFieldSync(originalName)!,
    }));

    const { data: insertados, error: errBatchContactos } = await supabase
      .from("contactos")
      .insert(payloadNuevosContactos)
      .select("id");

    if (errBatchContactos || !insertados) {
      return {
        exitosos: 0,
        fallidos: filas.length,
        errores: [
          {
            fila: 0,
            mensaje: `Error al registrar nuevos contactos por lote: ${
              errBatchContactos?.message ?? "Desconocido"
            }`,
          },
        ],
      };
    }

    insertados.forEach((row, i) => {
      const [lowerKey] = listaOriginal[i];
      if (row?.id && lowerKey) {
        contactoMap.set(lowerKey, row.id as string);
      }
    });
  }

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

  for (const { idx, data } of filasParseadas) {
    const key = sanitizeText(data.contacto_nombre, 150).toLowerCase().trim();
    const cId = contactoMap.get(key);
    if (!cId) {
      errores.push({
        fila: idx + 1,
        mensaje: `No se pudo asociar el contacto ${data.contacto_nombre}`,
      });
      continue;
    }

    const tasaInteres = Math.min(100, Math.max(0, Number(data.tasa_interes || 0)));
    const cobraInteres = Boolean(data.cobra_interes) && tasaInteres > 0;

    registrosParaInsertar.push({
      espacio_id: espacioId,
      contacto_id: cId,
      nombre: sanitizeText(data.nombre, 150) || "Préstamo",
      monto_principal: data.monto,
      cobra_interes: cobraInteres,
      tasa_interes_mensual: cobraInteres ? tasaInteres : 0,
      base_interes: "saldo_pendiente",
      fecha_inicio: data.fecha_inicio,
      dia_pago: Number(data.dia_pago),
      estado: data.estado ?? "activo",
      notas: encryptFieldSync(sanitizeText(data.notas, 1000)) || null,
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
  if (!isValidUuid(espacioId)) {
    return {
      exitosos: 0,
      fallidos: 0,
      errores: [{ fila: 0, mensaje: "Identificador de espacio no válido." }],
    };
  }

  if (!Array.isArray(filas) || filas.length === 0) {
    return {
      exitosos: 0,
      fallidos: 0,
      errores: [{ fila: 0, mensaje: "No hay filas para importar." }],
    };
  }

  if (filas.length > QUOTAS.MAX_IMPORT_ROWS_PER_BATCH) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [
        {
          fila: 0,
          mensaje: `Por seguridad, el máximo permitido por lote es de ${QUOTAS.MAX_IMPORT_ROWS_PER_BATCH} filas.`,
        },
      ],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/iniciar-sesion");

  const rl = await checkRateLimit({
    action: "import:movimientos",
    limit: 3,
    windowMs: 5 * 60_000,
    identifier: user.id,
  });
  if (!rl.allowed) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [{ fila: 0, mensaje: rl.message! }],
    };
  }

  const { count: currentTxCount } = await supabase
    .from("transacciones")
    .select("id", { count: "exact", head: true })
    .eq("espacio_id", espacioId);

  if ((currentTxCount ?? 0) + filas.length > QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE) {
    return {
      exitosos: 0,
      fallidos: filas.length,
      errores: [
        {
          fila: 0,
          mensaje: `Este espacio superaría el límite máximo de ${QUOTAS.MAX_TRANSACTIONS_PER_WORKSPACE} transacciones.`,
        },
      ],
    };
  }

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
      const errMsgs = res.error.issues
        .map((i) => i.message)
        .filter(Boolean)
        .join(", ");
      errores.push({
        fila: idx + 1,
        mensaje: errMsgs || "Formato incorrecto en movimiento",
      });
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
      descripcion: encryptFieldSync(sanitizeText(data.descripcion, 500)) || null,
    });
  });

  if (registrosParaInsertar.length > 0) {
    const { error } = await supabase
      .from("transacciones")
      .insert(registrosParaInsertar);
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
