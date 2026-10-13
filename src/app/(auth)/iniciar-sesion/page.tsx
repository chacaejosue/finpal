import Link from "next/link";
import { signIn } from "../actions";
import { AuthShowcase } from "@/components/auth-showcase";
import { LoginForm } from "@/components/login-form";

export default async function SignInPage({ searchParams }: PageProps<"/iniciar-sesion">) {
  const { error, mensaje } = await searchParams;
  return (
    <div className="min-h-screen bg-background text-on-surface antialiased flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed relative">
      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-4 py-3 relative z-10">
        <div className="auth-page-enter relative w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 my-auto">
          {/* Atmospheric subtle ambient glows */}
          <div className="absolute -top-16 -left-16 w-80 h-80 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute -bottom-16 right-10 w-96 h-96 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Left Brand Showcase */}
          <AuthShowcase />

          {/* Right Authentication Card */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            <div className="auth-page-enter auth-page-enter-delayed bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl shadow-xl p-5 sm:p-7 relative">
              {/* Header */}
              <div className="mb-5">
                <h2 className="font-heading text-2xl sm:text-3xl text-on-surface font-extrabold tracking-tight">
                  Iniciar sesión
                </h2>
                <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                  Ingresa a tu cuenta para gestionar tus espacios de trabajo.
                </p>
              </div>

              {/* Form Component */}
              <LoginForm action={signIn} />

              {/* Error and Success Banners */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-error-container/60 border border-error/20 text-on-error-container text-xs font-semibold">
                  {error}
                </div>
              )}
              {mensaje && (
                <div className="mt-4 p-3 rounded-xl bg-secondary-container/60 border border-primary/20 text-on-secondary-container text-xs font-semibold">
                  {mensaje}
                </div>
              )}

              {/* Footer Call to Action */}
              <div className="mt-6 text-center text-xs text-on-surface-variant font-medium">
                <span>¿No tienes una cuenta aún?</span>
                <Link className="ml-1 inline-flex font-bold text-primary transition-[color,transform] duration-200 hover:-translate-y-px hover:text-primary-container" href="/registrarse">
                  Regístrate gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center border-t border-surface-container-high/30">
        <div className="flex items-center justify-center gap-3 text-xs text-on-surface-variant font-medium">
          <span className="font-mono uppercase text-outline text-[11px] tracking-wider">Open Source Ledger</span>
          <span>•</span>
          <span>FinPal Protocol</span>
        </div>
      </footer>
    </div>
  );
}
