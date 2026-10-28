import Link from "next/link";
import { Compass, ArrowLeft, Home } from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-surface text-on-surface overflow-hidden selection:bg-primary/20 selection:text-primary">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[640px] h-[440px] bg-primary/10 rounded-full blur-[130px] opacity-70 dark:opacity-35" />
      </div>

      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 p-1.5 shadow-2xs flex items-center justify-center">
            <FinPalLogo size={28} className="w-full h-full" priority />
          </div>
          <div className="flex items-baseline tracking-tight font-heading text-lg">
            <span className="font-extrabold text-on-surface">Fin</span>
            <span className="font-extrabold text-primary">Pal</span>
          </div>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-mono text-xs font-bold border border-surface-container-high/60">
          Error 404
        </span>
      </header>

      <main className="w-full max-w-lg mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-surface-container-lowest border border-surface-container-high/80 p-4 shadow-lg flex items-center justify-center relative">
            <FinPalLogo size={68} className="w-full h-full object-contain" priority />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-on-primary border-2 border-surface flex items-center justify-center shadow-sm">
              <Compass className="w-4 h-4" />
            </div>
          </div>
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
          Página no encontrada
        </h1>

        <p className="mt-3 text-sm sm:text-base text-on-surface-variant leading-relaxed">
          La dirección que buscas no existe o fue movida a otra sección dentro de FinPal.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <Link
            href="/inicio"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:bg-primary-container transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Ir al panel principal</span>
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container text-xs sm:text-sm font-semibold border border-surface-container-high/70 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-on-surface-variant" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto px-6 py-6 border-t border-surface-container-high/50 text-center text-xs text-on-surface-variant">
        FinPal © {new Date().getFullYear()} · Control claro de préstamos y finanzas personales.
      </footer>
    </div>
  );
}
