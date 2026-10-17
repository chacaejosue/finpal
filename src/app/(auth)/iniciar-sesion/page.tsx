import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { signIn } from "../actions";
import { AuthShowcase } from "@/components/auth-showcase";
import { LoginForm } from "@/components/login-form";
import { FinPalLogo } from "@/components/finpal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SignInPage({ searchParams }: PageProps<"/iniciar-sesion">) {
  const { error, mensaje } = await searchParams;
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-background text-on-surface antialiased flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed relative w-full max-w-full overflow-x-hidden overflow-y-auto lg:overflow-hidden">
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

      {/* Área de contenido principal */}
      <main className="w-full max-w-full flex-1 flex flex-col items-center justify-center px-4 py-3 sm:py-6 relative z-10 min-h-0 overflow-x-hidden">
        <div className="auth-page-enter relative w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-6 my-auto">
          {/* Destellos ambientales de fondo confinados */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute -top-16 -left-16 w-72 sm:w-80 h-72 sm:h-80 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 sm:right-10 w-72 sm:w-96 h-72 sm:h-96 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Vitrina interactiva de marca */}
          <AuthShowcase />

          {/* Tarjeta de autenticación */}
          <div className="w-full max-w-md mx-auto lg:mx-0 shrink-0">
            <div className="auth-page-enter auth-page-enter-delayed bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl shadow-xl p-4 sm:p-6 relative">
              {/* Encabezado */}
              <div className="mb-3.5">
                <h2 className="font-heading text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight">
                  Iniciar sesión
                </h2>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Ingresa a tu cuenta para gestionar tus espacios de trabajo.
                </p>
              </div>

              {/* Formulario de acceso */}
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

              {/* Enlace para registrarse */}
              <div className="mt-4 text-center text-xs text-on-surface-variant font-medium">
                <span>¿No tienes una cuenta aún?</span>
                <Link className="ml-1 inline-flex font-bold text-primary transition-[color,transform] duration-200 hover:-translate-y-px hover:text-primary-container" href="/registrarse">
                  Regístrate gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="w-full py-2 text-center border-t border-surface-container-high/30 shrink-0">
        <div className="flex items-center justify-center gap-3 text-[11px] text-on-surface-variant font-medium">
          <span className="font-mono uppercase text-outline text-[10px] tracking-wider">Open Source Ledger</span>
          <span>•</span>
          <span>FinPal Protocol</span>
        </div>
      </footer>
    </div>
  );
}

