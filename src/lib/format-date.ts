const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/**
 * Obtiene la fecha actual formateada en YYYY-MM-DD en la hora local del usuario o zona horaria provista.
 * Previene el bug de UTC donde a las 8:00 PM (UTC-4 Bolivia) se pasaba al día siguiente.
 */
export function getLocalDateString(date: Date = new Date(), timezone: string = "America/La_Paz"): string {
  try {
    if (timezone) {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const y = parts.find((p) => p.type === "year")?.value;
      const m = parts.find((p) => p.type === "month")?.value;
      const d = parts.find((p) => p.type === "day")?.value;
      if (y && m && d) return `${y}-${m}-${d}`;
    }
  } catch {
    // Si la zona horaria falla o no es soportada, fallback a la hora local del dispositivo
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateEs(value: string | null | undefined, timezone: string = "America/La_Paz"): string {
  if (!value) return "Sin fecha";

  // Si es una fecha simple tipo ISO (YYYY-MM-DD)
  const plainIsoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainIsoMatch) {
    const [, year, month, day] = plainIsoMatch;
    return `${Number(day)} de ${MONTHS[Number(month) - 1]} de ${year}`;
  }

  // Si es formato latino (DD/MM/YYYY)
  const latinMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (latinMatch) {
    const [, day, month, year] = latinMatch;
    return `${Number(day)} de ${MONTHS[Number(month) - 1]} de ${year}`;
  }

  // Si es un timestamp completo (ej. TIMESTAMPTZ como 2026-10-11T00:30:00Z)
  try {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      let day: number;
      let month: number;
      let year: number;
      if (timezone) {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric",
          month: "numeric",
          day: "numeric",
        }).formatToParts(parsed);
        year = Number(parts.find((p) => p.type === "year")?.value);
        month = Number(parts.find((p) => p.type === "month")?.value);
        day = Number(parts.find((p) => p.type === "day")?.value);
      } else {
        year = parsed.getFullYear();
        month = parsed.getMonth() + 1;
        day = parsed.getDate();
      }
      return `${day} de ${MONTHS[month - 1]} de ${year}`;
    }
  } catch {}

  const normalized = value.slice(0, 10);
  return normalized;
}

/**
 * Formatea una fecha ISO o año-mes en el nombre del mes y año en español (ej. "Octubre 2026").
 * Determinístico y libre de desviaciones de zona horaria.
 */
export function formatMonthYear(value: string | null | undefined): string {
  if (!value) return "—";
  const match = value.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const [, year, month] = match;
    const monthName = MONTHS[Number(month) - 1] ?? "";
    const capitalMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalMonth} ${year}`;
  }
  return value;
}

