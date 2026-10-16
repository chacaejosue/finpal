import { z } from "zod";

/**
 * Tiempo de espera de inactividad de 20 minutos en milisegundos
 */
export const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;

/**
 * Tiempo previo de 15 minutos antes de mostrar la advertencia de inactividad en la UI
 */
export const INACTIVITY_WARNING_MS = 15 * 60 * 1000;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida que un identificador sea un UUID v4 bien formado
 */
export function isValidUuid(id: unknown): id is string {
  if (typeof id !== "string") return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Sanitiza texto genérico ingresado por el usuario eliminando etiquetas HTML y scripts potencialmente peligrosos
 * para prevenir ataques XSS almacenados, preservando caracteres en español y puntuación normal.
 */
export function sanitizeText(val: unknown, maxLength = 1000): string {
  if (val == null) return "";
  let str = String(val).trim();
  if (str.length > maxLength) {
    str = str.slice(0, maxLength);
  }
  // Eliminar caracteres de control y etiquetas HTML
  return str
    .replace(/<[^>]*>?/gm, "") // Eliminar etiquetas HTML <...>
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Eliminar nulos y caracteres de control
}

/**
 * Sanitiza valores para exportaciones de CSV / Excel para prevenir Inyección de Fórmulas (CWE-1236).
 * Si una celda inicia con =, +, -, @, \t, o \r, antepone una comilla simple para que la hoja de cálculo lo trate como texto literal.
 */
export function sanitizeSpreadsheetCell(value: unknown): string | number {
  if (value == null) return "";
  if (typeof value === "number") return value;
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
