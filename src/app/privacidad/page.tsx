import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Scale } from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  POLITICA_DE_PRIVACIDAD,
  LEGAL_VERSION,
  LEGAL_EFFECTIVE_DATE,
} from "@/config/legal-content";

export const metadata: Metadata = {
  title: "Política de Privacidad y Soberanía de Datos | FinPal",
  description:
    "Política de privacidad, cifrado AES-256-GCM en servidor, aislamiento RLS, no entrenamiento de IA y ejercicio del Derecho al Olvido (Bolivia, CCPA, GDPR).",
};

export default function PrivacidadPage() {
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
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                  Protección de Datos y Privacidad · Versión {LEGAL_VERSION}
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">
                  Política de Privacidad y Soberanía de Datos
                </h1>
              </div>
            </div>
            <span className="text-xs font-medium text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-xl border border-surface-container-high/60">
              Vigente desde: {LEGAL_EFFECTIVE_DATE}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs sm:text-sm text-on-surface leading-relaxed flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-primary block mb-0.5">
                Compromiso de Privacidad y No Entrenamiento de IA:
              </strong>
              Tus registros financieros y contactos se cifran con AES-256-GCM en servidor, están aislados por políticas Row Level Security (RLS) y jamás se venden ni se utilizan para entrenar modelos de Inteligencia Artificial de terceros.
            </div>
          </div>

          <div className="space-y-7">
            {POLITICA_DE_PRIVACIDAD.map((seccion) => (
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
              <Scale className="w-4 h-4 text-primary shrink-0" />
              <span>
                Revisa también nuestros{" "}
                <Link href="/terminos" className="text-primary font-bold hover:underline">
                  Términos de Servicio y Deslinde Legal
                </Link>
                .
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
