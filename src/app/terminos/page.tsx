import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale, ShieldCheck, FileText } from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  TERMINOS_DE_SERVICIO,
  LEGAL_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "@/config/legal-content";

export const metadata: Metadata = {
  title: "Términos de Servicio y Deslinde Legal | FinPal",
  description:
    "Condiciones de uso, deslinde de responsabilidad financiera y de inteligencia artificial, cumplimiento legal en Bolivia y jurisdicción internacional de FinPal.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed">
      <header className="sticky top-0 z-40 bg-surface-container-lowest/85 backdrop-blur-xl border-b border-surface-container-high/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link href="/" className="flex items-center gap-2">
              <FinPalLogo size={28} className="w-7 h-7" />
              <span className="font-heading font-extrabold text-base tracking-tight">
                Fin<span className="text-primary">Pal</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        <div className="bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-surface-container-high/60">
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Scale className="w-6 h-6" />
              </span>
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                  Marco Jurídico Internacional · Versión {LEGAL_VERSION}
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
                  Términos de Servicio y Deslinde de Responsabilidad
                </h1>
              </div>
            </div>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-xl border border-surface-container-high/60">
              Vigente desde: {LEGAL_EFFECTIVE_DATE}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs sm:text-sm text-on-surface leading-relaxed">
            <strong className="font-bold text-primary block mb-1">
              Aviso importante antes de utilizar FinPal:
            </strong>
            Al acceder, registrarte o utilizar FinPal desde el Estado Plurinacional de Bolivia, los Estados Unidos de América o cualquier otra jurisdicción, aceptas de forma expresa y vinculante los siguientes términos. Si no estás de acuerdo con alguna de estas cláusulas, debes abstenerte de utilizar la plataforma.
          </div>

          <div className="space-y-7">
            {TERMINOS_DE_SERVICIO.map((seccion) => (
              <section key={seccion.id} id={seccion.id} className="space-y-2.5">
                <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface">
                  {seccion.titulo}
                </h2>
                <div className="space-y-2.5 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {seccion.parrafos.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="pt-6 border-t border-surface-container-high/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>
                Consulta también nuestra{" "}
                <Link href="/privacidad" className="text-primary font-bold hover:underline">
                  Política de Privacidad y Soberanía de Datos
                </Link>
                .
              </span>
            </div>
            <Link
              href="/registrarse"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Ir al registro</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
