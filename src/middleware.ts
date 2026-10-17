import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { INACTIVITY_TIMEOUT_MS } from "@/lib/security";
import { MODO_MANTENIMIENTO } from "@/config/mantenimiento";

const ACTIVITY_COOKIE = "finpal_last_active";
const LEGACY_ACTIVITY_COOKIE = "finora_last_active";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protocolo de Mantenimiento ──────────────────────────────────────────
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

  // Refrescar sesión (importante para que no expire inesperadamente)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = Date.now();

  // Rutas públicas que no requieren autenticación
  const isPublicRoute =
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registrarse") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/mantenimiento") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/";

  // Control estricto de inactividad de sesión (20 minutos)
  // Si pasaron días o no existe registro de actividad reciente, la sesión se considera inactiva
  const lastActiveStr =
    request.cookies.get(ACTIVITY_COOKIE)?.value ||
    request.cookies.get(LEGACY_ACTIVITY_COOKIE)?.value;
  const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : null;
  const isInactive = Boolean(user && (!lastActive || isNaN(lastActive) || (now - lastActive > INACTIVITY_TIMEOUT_MS)));

  // Si el usuario superó el tiempo máximo de inactividad o regresó después de días:
  if (user && isInactive) {
    await supabase.auth.signOut();
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/iniciar-sesion";
      url.searchParams.set("mensaje", "Tu sesión ha expirado por inactividad. Por favor ingresa nuevamente.");
      const redirectRes = NextResponse.redirect(url);
      redirectRes.cookies.delete(ACTIVITY_COOKIE);
      redirectRes.cookies.delete(LEGACY_ACTIVITY_COOKIE);
      return redirectRes;
    }
    // En rutas públicas (ej. /iniciar-sesion), limpiamos la cookie de actividad y dejamos que vea el formulario
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
    const isRemembered = request.cookies.get("finpal_remember_session")?.value === "true";
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
