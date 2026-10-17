import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Lock, Mail, ShieldCheck } from "lucide-react";
import { signUp } from "../actions";
import { FinPalLogo } from "@/components/finpal-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function SignUpPage({ searchParams }: PageProps<"/registrarse">) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed relative w-full max-w-full overflow-x-hidden">
      {/* Cabecera superior con botón de regreso al inicio */}
      <header className="w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-5 pb-2 flex items-center justify-between relative z-20 shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-on-surface-variant hover:text-on-surface hover:bg-surface-container hover:border-primary/40 text-xs font-semibold transition-all duration-150 group shadow-2xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-0.5 transition-transform" />
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

      <main className="flex-1 flex w-full max-w-full items-center justify-center px-4 py-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="auth-page-enter grid w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-surface-container-high/70 bg-surface-container-lowest shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-on-primary lg:flex">
            <div className="relative z-10">
              <Link href="/" className="text-sm font-semibold tracking-wide transition-[color,transform] duration-200 hover:-translate-y-px hover:text-primary-fixed">FinPal</Link>
              <p className="mt-16 max-w-xs font-heading text-4xl font-extrabold leading-tight">Un espacio claro para ordenar tu día a día.</p>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-on-primary/80">Empieza con una cuenta y reúne tu información financiera en un solo lugar.</p>
            </div>
            <div className="relative z-10 space-y-3 text-sm text-on-primary/90">
              {["Cuentas y movimientos en un mismo espacio", "Cobros y préstamos fáciles de consultar", "Preferencias adaptadas a ti"].map((item) => (
                <div className="flex items-center gap-2.5" key={item}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-on-primary/15"><Check className="h-3.5 w-3.5" /></span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-container/30 blur-2xl" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-primary-container/30 blur-2xl" />
          </section>

          <section className="auth-page-enter-delayed p-5 sm:p-8 md:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-6 sm:mb-8">
                <span className="inline-flex rounded-full badge-emerald px-3 py-1 text-xs font-semibold">Primer paso</span>
                <h1 className="mt-3 sm:mt-4 font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">Crea tu cuenta</h1>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-on-surface-variant">Configura tu acceso para comenzar a organizar tu información.</p>
              </div>
              <form className="space-y-4 sm:space-y-5" action={signUp}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" htmlFor="email">Correo electrónico</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-outline pointer-events-none" />
                    <input autoComplete="email" className="h-11 sm:h-12 w-full rounded-xl border border-surface-container-high/80 bg-background pl-10 pr-3.5 text-base sm:text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="email" name="email" placeholder="tu@correo.com" required type="email" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" htmlFor="password">Contraseña</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-outline pointer-events-none" />
                    <input autoComplete="new-password" className="h-11 sm:h-12 w-full rounded-xl border border-surface-container-high/80 bg-background pl-10 pr-3.5 text-base sm:text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="password" name="password" placeholder="Crea una contraseña segura" required type="password" />
                  </div>
                  <p className="pt-0.5 text-xs text-on-surface-variant">Usa una contraseña que puedas recordar con facilidad.</p>
                </div>
                <button className="mt-2 sm:mt-3 flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-on-primary shadow-xs transition-all duration-200 hover:bg-primary-container hover:shadow-sm active:translate-y-px cursor-pointer" type="submit">
                  <span>Crear mi cuenta</span><ArrowRight className="h-4 w-4" />
                </button>
              </form>
              {error && <div className="mt-4 rounded-xl border border-error/20 bg-error-container/60 p-3 text-xs font-semibold text-on-error-container">{error}</div>}
              <div className="mt-5 sm:mt-6 flex items-center justify-center gap-1.5 border-t border-surface-container-high/40 pt-4 text-center text-xs text-outline">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" /><span>Tu información se gestiona de forma segura.</span>
              </div>
              <p className="mt-5 sm:mt-6 text-center text-xs font-medium text-on-surface-variant">¿Ya tienes una cuenta?{" "}
                <Link className="inline-flex font-bold text-primary transition-[color,transform] duration-200 hover:-translate-y-px hover:text-primary-container" href="/iniciar-sesion">Inicia sesión</Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Pie de página */}
      <footer className="w-full py-2.5 text-center border-t border-surface-container-high/30 shrink-0">
        <div className="flex items-center justify-center gap-3 text-[11px] text-on-surface-variant font-medium">
          <span className="font-mono uppercase text-outline text-[10px] tracking-wider">Open Source Ledger</span>
          <span>•</span>
          <span>FinPal Protocol</span>
        </div>
      </footer>
    </div>
  );
}

