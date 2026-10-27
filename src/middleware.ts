import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { INACTIVITY_TIMEOUT_MS } from "@/lib/security";
import { MODO_MANTENIMIENTO } from "@/config/mantenimiento";
import { AI_AND_SCRAPER_BOT_REGEX } from "@/lib/rate-limit";

const ACTIVITY_COOKIE = "finpal_last_active";
const LEGACY_ACTIVITY_COOKIE = "finora_last_active";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Bloqueo en el borde contra Scrapers y Bots de Entrenamiento de IA ──
  // Evita que bots consuman CPU de Vercel o invocaciones a Supabase
  const userAgent = request.headers.get("user-agent") || "";
  if (userAgent && AI_AND_SCRAPER_BOT_REGEX.test(userAgent)) {
    return new NextResponse("Acceso denegado a recolectores automatizados e IA.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noai, noimageai, noindex, nofollow",
      },
    });
  }

  // ── 2. Protocolo de Mantenimiento ─────────────────────────────────────────
  if (MODO_MANTENIMIENTO) {
    const isExcluded =
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/icon") ||
      pathname.startsWith("/logo") ||
      pathname.startsWith("/api") ||
      pathname === "/mantenimiento" ||
      request.nextUrl.searchParams.has("bypass");

    if (!isExcluded) {
      const url = request.nextUrl.clone();
      url.pathname = "/mantenimiento";
      return NextResponse.redirect(url);
    }
  }

  // Rutas públicas que no requieren autenticación
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registrarse") ||
    pathname.startsWith("/terminos") ||
    pathname.startsWith("/privacidad") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/mantenimiento") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest";

  // ── 3. Optimización Anti-Sobrecosto (Denial of Wallet Defense) ────────────
  // Si es una ruta pública y el visitante no tiene ninguna cookie de sesión de Supabase ('sb-'),
  // respondemos de inmediato SIN hacer una llamada de red a supabase.auth.getUser().
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (isPublicRoute && !hasSupabaseCookie) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refrescar sesión únicamente cuando existe cookie de sesión o es ruta protegida
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = Date.now();

  // Control estricto de inactividad de sesión (20 minutos)
  const lastActiveStr =
    request.cookies.get(ACTIVITY_COOKIE)?.value ||
    request.cookies.get(LEGACY_ACTIVITY_COOKIE)?.value;
  const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : null;
  const isInactive = Boolean(
    user && (!lastActive || isNaN(lastActive) || now - lastActive > INACTIVITY_TIMEOUT_MS)
  );

  // Si el usuario superó el tiempo máximo de inactividad o regresó después de días:
  if (user && isInactive) {
    await supabase.auth.signOut();
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/iniciar-sesion";
      url.searchParams.set(
        "mensaje",
        "Tu sesión ha expirado por inactividad. Por favor ingresa nuevamente."
      );
      const redirectRes = NextResponse.redirect(url);
      redirectRes.cookies.delete(ACTIVITY_COOKIE);
      redirectRes.cookies.delete(LEGACY_ACTIVITY_COOKIE);
      return redirectRes;
    }
    supabaseResponse.cookies.delete(ACTIVITY_COOKIE);
    supabaseResponse.cookies.delete(LEGACY_ACTIVITY_COOKIE);
  }

  // Si no hay usuario (o fue cerrado por inactividad) y la ruta es protegida → redirigir al login
  if (!isPublicRoute && (!user || isInactive)) {
    const url = request.nextUrl.clone();
    url.pathname = "/iniciar-sesion";
    return NextResponse.redirect(url);
  }

  // Si hay usuario con sesión activa VÁLIDA (dentro de los 20 min) y está en rutas de login → redirigir a espacios
  if (
    user &&
    !isInactive &&
    lastActive &&
    (pathname.startsWith("/iniciar-sesion") ||
      pathname.startsWith("/registrarse"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/espacios";
    return NextResponse.redirect(url);
  }

  // Si el usuario está autenticado y navegando en ruta protegida, actualizar timestamp de actividad
  if (user && !isPublicRoute) {
    const isRemembered =
      request.cookies.get("finpal_remember_session")?.value === "true";
    supabaseResponse.cookies.set(ACTIVITY_COOKIE, now.toString(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      ...(isRemembered ? { maxAge: 60 * 60 * 24 * 30 } : {}),
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
