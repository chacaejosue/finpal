import Link from "next/link";
import { ArrowLeft, Code2, ShieldCheck } from "lucide-react";
import { signIn } from "../actions";
import { AuthShowcase } from "@/components/auth-showcase";
import { LoginForm } from "@/components/login-form";
import { FinPalLogo } from "@/components/finpal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SignInPage({ searchParams }: PageProps<"/iniciar-sesion">) {
  const { error, mensaje } = await searchParams;
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-background text-on-surface antialiased flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed relative w-full max-w-full overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Destellos ambientales suaves a pantalla completa (sin cajas que corten el brillo) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-[460px] w-96 h-96 bg-primary/12 dark:bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/2 translate-x-[120px] w-96 h-96 bg-secondary/12 dark:bg-secondary/8 rounded-full blur-[100px]" />
      </div>

      {/* Cabecera superior con botón de regreso al inicio */}
      <header className="w-full max-w-5xl mx-auto px-4 pt-3.5 pb-2 flex items-center justify-between relative z-20 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover:border-primary/40 text-xs font-semibold transition-all duration-150 group shadow-2xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver<span className="hidden sm:inline"> al inicio</span></span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ThemeToggle />
          <Link href="/" className="flex items-center gap-2 group focus:outline-none">
            <FinPalLogo size={26} className="w-6.5 h-6.5 group-hover:scale-105 transition-transform" />
            <span className="font-heading font-extrabold text-sm tracking-tight text-on-surface">
              Fin<span className="text-primary">Pal</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Área de contenido principal con tarjetas de igual tamaño */}
      <main className="w-full max-w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-6 relative z-10 min-h-0 overflow-x-hidden">
        <div className="auth-page-enter relative w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-6 my-auto">
          {/* Vitrina interactiva de marca (Tarjeta 1) */}
          <AuthShowcase />

          {/* Tarjeta de autenticación (Tarjeta 2 - Hermana directa en items-stretch) */}
          <div className="auth-page-enter auth-page-enter-delayed flex flex-col justify-between flex-1 max-w-md w-full mx-auto lg:mx-0 relative z-10 bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl shadow-xl p-5 sm:p-6">
            {/* Encabezado y Formulario */}
            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <h2 className="font-heading text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight">
                  Iniciar sesión
                </h2>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Ingresa a tu cuenta para gestionar tus espacios de trabajo.
                </p>
              </div>

              <LoginForm action={signIn} />

              {/* Avisos de error y éxito */}
              {error && (
                <div className="mt-3 p-2.5 rounded-xl bg-error-container/60 border border-error/20 text-on-error-container text-xs font-semibold">
                  {error}
                </div>
              )}
              {mensaje && (
                <div className="mt-3 p-2.5 rounded-xl badge-emerald text-xs font-semibold">
                  {mensaje}
                </div>
              )}
            </div>

            {/* Pie fijado de la tarjeta */}
            <div className="mt-auto pt-3.5 border-t border-surface-container-low text-center space-y-2 shrink-0">
              <div className="flex items-center justify-center gap-1.5 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[11px] font-medium text-outline">
                  Autenticación segura con Supabase Auth
                </span>
              </div>
              <div className="text-xs text-on-surface-variant font-medium">
                <span>¿No tienes una cuenta aún?</span>
                <Link
                  className="ml-1 inline-flex font-bold text-primary transition-[color,transform] duration-200 hover:-translate-y-px hover:text-primary-container"
                  href="/registrarse"
                >
                  Regístrate gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="w-full py-2.5 text-center border-t border-surface-container-high/30 shrink-0">
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-outline font-medium px-4">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Cifrado AES-256-GCM en servidor</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-primary" />
            <span>Aislamiento por RLS</span>
          </div>
          <span>•</span>
          <Link href="/terminos" className="hover:text-primary transition-colors">
            Términos
          </Link>
          <span>•</span>
          <Link href="/privacidad" className="hover:text-primary transition-colors">
            Privacidad
          </Link>
        </div>
      </footer>
    </div>
  );
}
