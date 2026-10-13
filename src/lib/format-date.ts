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

export function formatDateEs(value: string | null | undefined): string {
  if (!value) return "Sin fecha";
  const normalized = value.slice(0, 10);
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const latinMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const match = isoMatch
    ? [normalized, isoMatch[3], isoMatch[2], isoMatch[1]]
    : latinMatch
      ? [normalized, latinMatch[1], latinMatch[2], latinMatch[3]]
      : null;
  if (!match) return value;
  return `${Number(match[1])} de ${MONTHS[Number(match[2]) - 1]} de ${match[3]}`;
}
