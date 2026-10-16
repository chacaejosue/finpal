import { z } from "zod";

// ── Contactos ──────────────────────────────────────────────────────────────

export const contactoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del contacto es obligatorio").max(150),
  telefono: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().email("Email inválido").max(150).optional().or(z.literal("")).default(""),
  notas: z.string().trim().max(1000).optional().default(""),
});
export type ContactoInput = z.infer<typeof contactoSchema>;

// ── Cuentas de dinero ──────────────────────────────────────────────────────

export const cuentaDineroSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  tipo: z.enum(["efectivo", "banco", "billetera_movil", "ahorro", "otra"]),
  saldo_inicial: z.coerce.number().min(0, "El saldo no puede ser negativo"),
  codigo_moneda: z.string().trim().length(3).toUpperCase().default("BOB"),
});
export type CuentaDineroInput = z.infer<typeof cuentaDineroSchema>;

// ── Préstamos ──────────────────────────────────────────────────────────────

/**
 * Esquema de validación para la creación de préstamos.
 * 
 * Regla de negocio / Invariante de BD:
 * - Si la tasa de interés es 0 o el usuario desmarca la opción de interés, el préstamo se
 *   transforma a `cobra_interes = false` y `tasa_interes_mensual = 0`. Esto garantiza el
 *   cumplimiento del constraint PostgreSQL `chk_prestamo_interes`:
 *   `((cobra_interes AND tasa > 0) OR (NOT cobra_interes AND tasa = 0))`.
 * - Permite asignar el préstamo a un contacto existente (`contacto_id`) o crear uno nuevo
 *   sobre la marcha (`contacto_nombre`).
 */
export const prestamoSchema = z.object({
  contacto_id: z.string().uuid("Selecciona un contacto válido").optional().or(z.literal("")),
  contacto_nombre: z.string().trim().max(150).optional().default(""),
  nombre: z.string().trim().max(150).optional().default(""),
  monto_principal: z.coerce.number().positive("El monto debe ser mayor a 0"),
  cobra_interes: z.boolean().default(true),
  tasa_interes_mensual: z.coerce.number().min(0, "La tasa no puede ser negativa").max(100, "La tasa máxima es 100%").default(0),
  fecha_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  dia_pago: z.coerce.number().int().min(1).max(31),
  metodo_entrega: z.string().trim().max(100).optional().nullable().default(""),
  notas: z.string().trim().max(1000).optional().nullable().default(""),
  cuenta_dinero_id: z.string().uuid("Selecciona una cuenta válida"),
}).transform((d) => {
  // Coerción coherente con la restricción de base de datos
  const tieneInteres = Boolean(d.cobra_interes) && d.tasa_interes_mensual > 0;
  return {
    ...d,
    cobra_interes: tieneInteres,
    tasa_interes_mensual: tieneInteres ? d.tasa_interes_mensual : 0,
  };
}).refine(
  (d) => Boolean(d.contacto_id || d.contacto_nombre),
  { message: "Selecciona un deudor o escribe su nombre", path: ["contacto_id"] }
);
export type PrestamoInput = z.infer<typeof prestamoSchema>;

// ── Cobros de préstamos ────────────────────────────────────────────────────

/**
 * Esquema de validación para cobros y amortizaciones de préstamos.
 * 
 * Regla de negocio / Balance contable:
 * - El monto total cobrado debe equivaler exactamente a la suma del abono a capital
 *   (`monto_principal`) más el cobro de intereses (`monto_interes`).
 * - Se usa una tolerancia de 0.01 (1 centavo) para evitar rechazos por redondeo de coma flotante.
 */
export const pagoPrestamoSchema = z.object({
  prestamo_id: z.string().uuid(),
  fecha_esperada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha esperada inválida"),
  recibido_en: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  monto_total: z.coerce.number().positive("El monto debe ser mayor a 0"),
  monto_principal: z.coerce.number().min(0),
  monto_interes: z.coerce.number().min(0),
  cuenta_dinero_id: z.string().uuid(),
  metodo_pago: z.string().trim().max(100).optional().default(""),
  notas: z.string().trim().max(1000).optional().default(""),
}).refine(
  (d) => Math.abs(d.monto_principal + d.monto_interes - d.monto_total) < 0.01,
  { message: "La suma de capital + interés debe ser igual al monto total", path: ["monto_total"] }
);
export type PagoPrestamoInput = z.infer<typeof pagoPrestamoSchema>;

// ── Transacciones (gastos / ingresos) ─────────────────────────────────────

export const transaccionSchema = z.object({
  cuenta_dinero_id: z.string().uuid(),
  tipo: z.enum(["ingreso", "gasto", "transferencia_entrada", "transferencia_salida", "ajuste"]),
  ajuste_sentido: z.enum(["sumar", "restar"]).optional().nullable(),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  ocurrido_en: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  descripcion: z.string().trim().max(500).optional().default(""),
  categoria_id: z.string().uuid().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.tipo === "ajuste" && !data.ajuste_sentido) {
    ctx.addIssue({ code: "custom", path: ["ajuste_sentido"], message: "Indica si el ajuste suma o resta dinero" });
  }
  if (data.tipo === "ajuste" && !data.descripcion) {
    ctx.addIssue({ code: "custom", path: ["descripcion"], message: "La justificación del ajuste es obligatoria" });
  }
});
export type TransaccionInput = z.infer<typeof transaccionSchema>;

// ── Importación desde Excel / CSV ──────────────────────────────────────────

export const importContactoSchema = z.object({
  nombre: z.preprocess(
    (val) => (val == null ? "" : String(val).trim()),
    z.string().min(1, "Falta el nombre del contacto")
  ),
  telefono: z.preprocess((val) => (val == null ? "" : String(val).trim()), z.string().default("")),
  email: z.preprocess((val) => (val == null ? "" : String(val).trim()), z.string().default("")),
  notas: z.preprocess((val) => (val == null ? "" : String(val).trim()), z.string().default("")),
});
export type ImportContactoRow = z.infer<typeof importContactoSchema>;

export const importPrestamoSchema = z.object({
  contacto_nombre: z.preprocess(
    (val) => (val == null ? "" : String(val).trim()),
    z.string().min(1, "Falta el nombre de la persona o deudor")
  ),
  nombre: z.preprocess(
    (val) => (val == null || String(val).trim() === "" ? "Préstamo" : String(val).trim()),
    z.string().default("Préstamo")
  ),
  monto: z.preprocess(
    (val) => {
      if (typeof val === "number" && !isNaN(val)) return val;
      if (!val) return 0;
      const num = Number(String(val).replace(/[^\d.-]/g, ""));
      return isNaN(num) ? 0 : num;
    },
    z.number().positive("El monto debe ser un número mayor a 0")
  ),
  tasa_interes: z.preprocess(
    (val) => {
      if (typeof val === "number" && !isNaN(val)) return val;
      if (!val) return 0;
      const num = Number(String(val).replace(/[^\d.-]/g, ""));
      return isNaN(num) ? 0 : Math.max(0, num);
    },
    z.number().min(0).default(0)
  ),
  cobra_interes: z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const s = val.toLowerCase().trim();
      return s === "true" || s === "si" || s === "sí" || s === "1";
    }
    return Boolean(val);
  }, z.boolean().default(false)),
  fecha_inicio: z.preprocess(
    (val) => {
      if (!val) return new Date().toISOString().slice(0, 10);
      return String(val).trim();
    },
    z.string().min(1, "Fecha de inicio no válida")
  ),
  dia_pago: z.preprocess(
    (val) => {
      const num = Number(val);
      if (isNaN(num) || num < 1 || num > 31) return 15;
      return Math.floor(num);
    },
    z.number().int().min(1).max(31).default(15)
  ),
  notas: z.preprocess((val) => (val == null ? "" : String(val).trim()), z.string().default("")),
  estado: z.preprocess((val) => {
    const s = String(val || "").toLowerCase().trim();
    if (s.includes("pagado") || s.includes("saldado") || s.includes("cobrado")) return "pagado";
    if (s.includes("atras") || s.includes("mora") || s.includes("vencid")) return "atrasado";
    return "activo";
  }, z.enum(["activo", "pagado", "atrasado", "cancelado"]).default("activo")),
});
export type ImportPrestamoRow = z.infer<typeof importPrestamoSchema>;

export const importMovimientoSchema = z.object({
  fecha: z.preprocess(
    (val) => (val ? String(val).trim() : new Date().toISOString().slice(0, 10)),
    z.string().min(1, "Fecha de movimiento requerida")
  ),
  tipo: z.preprocess((val) => {
    const s = String(val || "").toLowerCase().trim();
    if (s.includes("ingreso") || s === "in") return "ingreso";
    if (s.includes("ajuste")) return "ajuste";
    return "gasto";
  }, z.enum(["ingreso", "gasto", "ajuste"])),
  monto: z.preprocess((val) => {
    if (typeof val === "number" && !isNaN(val)) return Math.abs(val);
    const n = Number(String(val || "").replace(/[^\d.-]/g, ""));
    return isNaN(n) ? 0 : Math.abs(n);
  }, z.number().positive("El monto debe ser mayor a 0")),
  descripcion: z.preprocess((val) => (val == null ? "" : String(val).trim()), z.string().default("")),
  cuenta_nombre: z.preprocess(
    (val) => (val == null ? "" : String(val).trim()),
    z.string().min(1, "Nombre de cuenta requerido")
  ),
});
export type ImportMovimientoRow = z.infer<typeof importMovimientoSchema>;
