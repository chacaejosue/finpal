import Link from "next/link";
import { ArrowRight, Check, Lock, Mail, ShieldCheck } from "lucide-react";
import { signUp } from "../actions";

export default async function SignUpPage({ searchParams }: PageProps<"/registrarse">) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      <main className="flex min-h-screen w-full items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="auth-page-enter grid w-full max-w-4xl overflow-hidden rounded-3xl border border-surface-container-high/70 bg-surface-container-lowest shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
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

          <section className="auth-page-enter-delayed p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <span className="inline-flex rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-on-primary-fixed">Primer paso</span>
                <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight">Crea tu cuenta</h1>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">Configura tu acceso para comenzar a organizar tu información.</p>
              </div>
              <form className="space-y-5" action={signUp}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" htmlFor="email">Correo electrónico</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-outline pointer-events-none" />
                    <input autoComplete="email" className="h-12 w-full rounded-xl border border-surface-container-high/80 bg-background pl-10 pr-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="email" name="email" placeholder="tu@correo.com" required type="email" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold" htmlFor="password">Contraseña</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-outline pointer-events-none" />
                    <input autoComplete="new-password" className="h-12 w-full rounded-xl border border-surface-container-high/80 bg-background pl-10 pr-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="password" name="password" placeholder="Crea una contraseña segura" required type="password" />
                  </div>
                  <p className="pt-1 text-xs text-on-surface-variant">Usa una contraseña que puedas recordar con facilidad.</p>
                </div>
                <button className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-on-primary shadow-xs transition-[background-color,transform,box-shadow] duration-200 hover:bg-primary-container hover:shadow-sm active:translate-y-px" type="submit">
                  <span>Crear mi cuenta</span><ArrowRight className="h-4 w-4" />
                </button>
              </form>
              {error && <div className="mt-4 rounded-xl border border-error/20 bg-error-container/60 p-3 text-xs font-semibold text-on-error-container">{error}</div>}
              <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-surface-container-high/40 pt-4 text-center text-xs text-outline">
                <ShieldCheck className="h-4 w-4 text-primary" /><span>Tu información se gestiona de forma segura.</span>
              </div>
              <p className="mt-6 text-center text-xs font-medium text-on-surface-variant">¿Ya tienes una cuenta?{" "}
                <Link className="inline-flex font-bold text-primary transition-[color,transform] duration-200 hover:-translate-y-px hover:text-primary-container" href="/iniciar-sesion">Inicia sesión</Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
