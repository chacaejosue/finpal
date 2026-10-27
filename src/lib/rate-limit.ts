import { headers } from "next/headers";

/**
 * Cuotas máximas por usuario / espacio para prevenir ataques de sobrecosto
 * ("Denial of Wallet" / agotamiento de almacenamiento y CPU en Supabase y Vercel).
 */
export const QUOTAS = {
  MAX_WORKSPACES_PER_USER: 5,
  MAX_IMPORT_ROWS_PER_BATCH: 200,
  MAX_CONTACTS_PER_WORKSPACE: 1000,
  MAX_LOANS_PER_WORKSPACE: 1000,
  MAX_TRANSACTIONS_PER_WORKSPACE: 10000,
  MAX_QUERY_LIMIT: 500,
} as const;

/**
 * Lista de User-Agents conocidos de scrapers agresivos y recolectores de entrenamiento de IA.
 */
export const AI_AND_SCRAPER_BOT_REGEX =
  /GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-Web|anthropic-ai|CCBot|Bytespider|PerplexityBot|Google-Extended|Amazonbot|FacebookBot|Meta-ExternalAgent|Diffbot|Omgilibot|ImagesiftBot|Barkrowler|SemrushBot|AhrefsBot|MJ12bot|DotBot|PetalBot/i;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 5000;

function cleanupExpired(now: number) {
  if (memoryStore.size < MAX_STORE_SIZE) return;
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
  // Si aún supera el límite, limpiar las entradas más antiguas
  if (memoryStore.size >= MAX_STORE_SIZE) {
    const keysToDelete = Array.from(memoryStore.keys()).slice(0, 1000);
    for (const k of keysToDelete) memoryStore.delete(k);
  }
}

/**
 * Obtiene una huella de IP segura desde las cabeceras de Vercel / Cloudflare / Proxy.
 */
export async function getClientIp(): Promise<string> {
  try {
    const hdrs = await headers();
    const xff = hdrs.get("x-forwarded-for");
    if (xff) {
      const firstIp = xff.split(",")[0]?.trim();
      if (firstIp) return firstIp;
    }
    return (
      hdrs.get("x-real-ip") ||
      hdrs.get("cf-connecting-ip") ||
      "127.0.0.1"
    );
  } catch {
    return "127.0.0.1";
  }
}

export interface RateLimitConfig {
  /** Identificador de la acción (ej. 'auth:signin', 'import:prestamos', 'mutation:loan') */
  action: string;
  /** Número máximo de peticiones permitidas dentro de la ventana */
  limit: number;
  /** Ventana de tiempo en milisegundos (por defecto 60_000 ms = 1 minuto) */
  windowMs?: number;
  /** Identificador adicional (ej. user.id) para aislar límites por usuario autenticado */
  identifier?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  message?: string;
}

/**
 * Aplica control de tasa (Rate Limiting) en servidor para proteger Server Actions y Route Handlers
 * contra ataques de fuerza bruta, scripts con IA o abuso de costos en Vercel/Supabase.
 */
export async function checkRateLimit({
  action,
  limit,
  windowMs = 60_000,
  identifier,
}: RateLimitConfig): Promise<RateLimitResult> {
  const now = Date.now();
  cleanupExpired(now);

  const ip = await getClientIp();
  const subject = identifier ? `${identifier}:${ip}` : ip;
  const key = `rl:${action}:${subject}`;

  const existing = memoryStore.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;
  if (existing.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      message: `Demasiadas solicitudes seguidas. Por seguridad, espera ${retryAfterSeconds} segundos antes de intentarlo de nuevo.`,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: 0,
  };
}

/**
 * Verifica si un formulario contiene datos en el campo señuelo (Honeypot) que solo los bots rellenan.
 */
export function isBotHoneypotTriggered(formData: FormData, fieldName = "website_url"): boolean {
  const val = formData.get(fieldName);
  return typeof val === "string" && val.trim().length > 0;
}
