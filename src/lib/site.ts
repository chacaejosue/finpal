/**
 * Obtiene la URL canónica base de FinPal garantizando siempre el protocolo 'https://'.
 * Normaliza variables de entorno sin protocolo (ej: 'finpal-tan.vercel.app') y elimina barras finales.
 */
export function getSiteUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://finpal-tan.vercel.app";

  const trimmed = rawUrl.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
