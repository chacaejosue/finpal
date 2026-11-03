import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Code2, Lock, Mail, ShieldCheck, Wallet, BadgePercent } from "lucide-react";
import { signUp } from "../actions";
import { FinPalLogo } from "@/components/finpal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Crear Cuenta",
};

export default async function SignUpPage({ searchParams }: PageProps<"/registrarse">) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-background text-on-surface antialiased flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed relative w-full max-w-full overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Destellos ambientales suaves a pantalla completa */}
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

      {/* Área de contenido principal con tarjetas de igual tamaño perfectamente compactas */}
      <main className="w-full max-w-full flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-4 relative z-10 min-h-0 overflow-x-hidden">
        <div className="auth-page-enter relative w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-6 my-auto">
          {/* Vitrina de bienvenida y beneficios (Tarjeta 1) */}
          <div className="auth-page-enter hidden lg:flex flex-col justify-between flex-1 max-w-md w-full select-none relative z-10 bg-surface-container-lowest border border-surface-container-high/70 p-5 sm:p-6 rounded-2xl shadow-xl">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono text-[10px] font-medium w-fit mb-2.5 shadow-2xs border border-surface-container-high/40">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>FinPal · Registro gratuito</span>
              </div>

              <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight mb-1.5 leading-tight">
                Tu dinero, <span className="text-primary font-extrabold">centralizado y claro.</span>
              </h2>

              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                Crea tu cuenta en 30 segundos y reúne todas tus cuentas, préstamos y cobros en un solo lugar.
              </p>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/40">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-on-surface">Cuentas y Billeteras</p>
                    <p className="text-[11px] text-on-surface-variant leading-snug">Efectivo, bancos y transferencias con saldos actualizados.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/40">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                    <BadgePercent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-on-surface">Préstamos y Amortizaciones</p>
                    <p className="text-[11px] text-on-surface-variant leading-snug">Intereses exactos, semáforo de puntualidad y recibos con folio.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/40">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-on-surface">Privacidad en Servidor</p>
                    <p className="text-[11px] text-on-surface-variant leading-snug">Cifrado AES-256 de contactos y aislamiento estricto por usuario.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-container-low flex items-center justify-between text-[11px] text-on-surface-variant">
              <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Sin tarjeta requerida
              </span>
              <span className="font-mono font-semibold">100% Gratuito</span>
            </div>
          </div>

          {/* Tarjeta de Formulario de Registro (Tarjeta 2) */}
          <div className="auth-page-enter auth-page-enter-delayed flex flex-col justify-between flex-1 max-w-md w-full mx-auto lg:mx-0 relative z-10 bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl shadow-xl p-5 sm:p-6">
            <div className="flex-1 flex flex-col justify-between">
              <div className="mb-3.5">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full badge-emerald text-[10px] font-bold mb-1.5">
                  <span>Primer paso</span>
                </div>
                <h1 className="font-heading text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight">
                  Crea tu cuenta
                </h1>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                  Configura tu acceso para comenzar a organizar tu dinero.
                </p>
              </div>

              <form className="space-y-3" action={signUp}>
                {/* Campo señuelo (Honeypot) invisible para bloquear bots automatizados */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website_url">Sitio web</label>
                  <input id="website_url" name="website_url" type="text" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface" htmlFor="email">
                    Correo electrónico
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 h-4 w-4 text-outline pointer-events-none" />
                    <input
                      autoComplete="email"
                      className="h-10 w-full rounded-xl border border-surface-container-high/80 bg-background pl-9 pr-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface"
                      id="email"
                      name="email"
                      placeholder="tu@correo.com"
                      required
                      type="email"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-on-surface" htmlFor="password">
                    Contraseña
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-4 w-4 text-outline pointer-events-none" />
                    <input
                      autoComplete="new-password"
                      minLength={8}
                      className="h-10 w-full rounded-xl border border-surface-container-high/80 bg-background pl-9 pr-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 text-on-surface"
                      id="password"
                      name="password"
                      placeholder="Mínimo 8 caracteres"
                      required
                      type="password"
                    />
                  </div>
                </div>

                {/* Consentimiento activo Clickwrap */}
                <div className="flex items-start gap-2 pt-0.5">
                  <input
                    id="accept_terms"
                    name="accept_terms"
                    type="checkbox"
                    required
                    className="mt-0.5 h-3.5 w-3.5 rounded border-surface-container-high accent-primary cursor-pointer shrink-0"
                  />
                  <label htmlFor="accept_terms" className="text-[11px] text-on-surface-variant leading-tight cursor-pointer select-none">
                    Soy mayor de 18 años y acepto los{" "}
                    <Link href="/terminos" target="_blank" className="text-primary font-semibold hover:underline">
                      Términos de Servicio
                    </Link>{" "}
                    y la{" "}
                    <Link href="/privacidad" target="_blank" className="text-primary font-semibold hover:underline">
                      Política de Privacidad
                    </Link>
                    .
                  </label>
                </div>

                <button
                  className="mt-1.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs sm:text-sm font-semibold text-on-primary shadow-xs transition-all hover:bg-primary-container active:scale-[0.99] cursor-pointer"
                  type="submit"
                >
                  <span>Crear mi cuenta gratis</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {error && (
                <div className="mt-2.5 rounded-xl border border-error/20 bg-error-container/60 p-2 text-xs font-semibold text-on-error-container">
                  {error}
                </div>
              )}
            </div>

            {/* Pie fijado de la tarjeta */}
            <div className="mt-3.5 pt-3 border-t border-surface-container-low text-center space-y-1.5 shrink-0">
              <div className="flex items-center justify-center gap-1.5 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-[11px] font-medium text-outline">
                  Autenticación segura con Supabase Auth
                </span>
              </div>
              <div className="text-xs text-on-surface-variant font-medium">
                <span>¿Ya tienes una cuenta?</span>
                <Link
                  className="ml-1 inline-flex font-bold text-primary transition-colors hover:text-primary-container"
                  href="/iniciar-sesion"
                >
                  Inicia sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pie de página compacto */}
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
