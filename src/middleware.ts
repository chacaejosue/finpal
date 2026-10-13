import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

  // Refrescar sesión (importante para que no expire)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const isPublicRoute =
    pathname.startsWith("/iniciar-sesion") ||
    pathname.startsWith("/registrarse") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/";

  // Si no hay usuario y la ruta es protegida → redirigir al login
  if (!isPublicRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/iniciar-sesion";
    return NextResponse.redirect(url);
  }

  // Si hay usuario y está en rutas de auth → redirigir a espacios
  if (
    user &&
    (pathname.startsWith("/iniciar-sesion") ||
      pathname.startsWith("/registrarse"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/espacios";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
