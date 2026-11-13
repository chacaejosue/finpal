import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  BadgePercent,
  Check,
  ReceiptText,
  UserCheck,
  Wallet,
} from "lucide-react";
import { MODO_MANTENIMIENTO } from "@/config/mantenimiento";
import { PantallaMantenimiento } from "@/components/pantalla-mantenimiento";
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { LoanSimulator } from "@/components/landing/loan-simulator";
import { LiveBoardPreview } from "@/components/landing/live-board-preview";
import { FaqAccordion } from "@/components/landing/faq-and-legal";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingLegalProvider } from "@/components/landing/landing-legal-provider";
import { faqs, GITHUB_WEB_URL, metrics } from "@/components/landing/landing-data";

const features = [
  {
    title: "Cuentas y Billeteras",
    description:
      "Controla saldos de efectivo, bancos y billeteras con transferencias inmediatas y trazabilidad.",
    tag: "Billeteras",
    icon: Wallet,
    accentColor: "text-cyan-600 dark:text-cyan-400",
    bgGradient: "from-cyan-500/15 via-blue-500/10 to-indigo-500/5",
    borderColor: "border-cyan-500/20",
    glowColor: "bg-cyan-500/20",
    badgeBg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  {
    title: "Intereses y Cuotas",
    description:
      "Calcula cobros de interés mensual fijo o cuotas con amortización a capital (Sistema Francés).",
    tag: "Francés & Fijo",
    icon: BadgePercent,
    accentColor: "text-teal-600 dark:text-teal-400",
    bgGradient: "from-teal-500/15 via-emerald-500/10 to-teal-500/5",
    borderColor: "border-teal-500/20",
    glowColor: "bg-teal-500/20",
    badgeBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    title: "Recibos Digitales",
    description:
      "Emite comprobantes con folio y desglose claro, listos para compartir o imprimir en PDF.",
    tag: "PDF & Folio",
    icon: ReceiptText,
    accentColor: "text-amber-600 dark:text-amber-400",
    bgGradient: "from-amber-500/15 via-orange-500/10 to-amber-500/5",
    borderColor: "border-amber-500/20",
    glowColor: "bg-amber-500/20",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    title: "Kardex de Deudores",
    description:
      "Monitorea el historial de cobros, saldos pendientes y el semáforo de puntualidad de cada cliente.",
    tag: "Semáforo 360°",
    icon: UserCheck,
    accentColor: "text-violet-600 dark:text-violet-400",
    bgGradient: "from-violet-500/15 via-purple-500/10 to-violet-500/5",
    borderColor: "border-violet-500/20",
    glowColor: "bg-violet-500/20",
    badgeBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
];

export default function Home() {
  if (MODO_MANTENIMIENTO) {
    return <PantallaMantenimiento />;
  }

  return (
    <LandingLegalProvider>
      <div className="min-h-screen bg-surface text-on-surface antialiased flex flex-col selection:bg-primary-container selection:text-on-primary-container">
        <LandingHeader />

        <main className="w-full pt-16 bg-surface overflow-x-hidden">
          <HeroSection />

          {/* ─── CINTILLO DE MÉTRICAS RÁPIDAS ─── */}
          <section className="w-full py-6 bg-surface-container-lowest border-b border-surface-container-high/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="p-2 rounded-xl transition-colors hover:bg-surface-container-low/40"
                  >
                    <p
                      className={`font-heading text-xl sm:text-2xl font-extrabold ${
                        metric.highlight ? "text-primary" : "text-on-surface"
                      }`}
                    >
                      {metric.value}
                    </p>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <LoanSimulator />

          <LiveBoardPreview />

          {/* ─── SECCIÓN: DE LA DISPERSIÓN A UN SOLO SISTEMA ─── */}
          <section
            className="w-full py-14 sm:py-16 bg-surface-container-low/40 border-y border-surface-container-high/40 scroll-mt-20"
            id="centralizar"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-teal text-xs font-semibold mb-2">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Nacido de una necesidad real</span>
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  ¿Cuentas y cobros repartidos en varias apps y notas?
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 max-w-xl mx-auto leading-relaxed">
                  FinPal nació para resolver exactamente eso: dejar de saltar entre múltiples aplicaciones, hojas de cálculo y libretas para tener todo tu dinero bajo control en un solo lugar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* Tarjeta 1: La dispersión habitual */}
                <div className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-surface-container-highest transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-surface-container-low">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span className="font-heading text-sm font-bold text-on-surface">
                          El problema de tener todo disperso
                        </span>
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-full bg-rose-500/10">
                        Fragmentado
                      </span>
                    </div>
                    <div className="space-y-3 text-xs text-on-surface-variant">
                      <div className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                        <div>
                          <p className="font-semibold text-on-surface">Información fragmentada</p>
                          <p className="text-[11px]">
                            Saldos en una app de banco, préstamos en notas y cobros en mensajes.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                        <div>
                          <p className="font-semibold text-on-surface">Riesgo de olvidos y descontrol</p>
                          <p className="text-[11px]">
                            Fechas de pago que se pasan y cobros que se vuelven incómodos de reclamar.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                        <div>
                          <p className="font-semibold text-on-surface">Cálculos manuales y confusos</p>
                          <p className="text-[11px]">
                            Recalcular intereses, abonos a capital y saldos pendientes a mano.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-surface-container-low text-[11px] text-on-surface-variant">
                    <span>Resultado: falta de claridad sobre cuánto tienes y cuánto te deben.</span>
                  </div>
                </div>

                {/* Tarjeta 2: La solución con FinPal */}
                <div className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-surface-container-highest transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-surface-container-low">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-heading text-sm font-bold text-on-surface">
                          Con FinPal: Todo unificado
                        </span>
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10">
                        Centralizado
                      </span>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-on-surface">Un solo tablero centralizado</p>
                          <p className="text-on-surface-variant text-[11px]">
                            Cuentas de dinero, préstamos activos y movimientos en vivo.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-on-surface">Alertas automáticas de cobro</p>
                          <p className="text-on-surface-variant text-[11px]">
                            Semáforo de puntualidad y días exactos de atraso sin tener que recordar.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-on-surface">Recálculo automático y recibos con folio</p>
                          <p className="text-on-surface-variant text-[11px]">
                            Amortizaciones matemáticas y comprobantes digitales listos para compartir.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-surface-container-low text-xs flex items-center justify-between gap-2">
                    <span className="text-on-surface-variant text-[11px]">
                      ¿Tienes archivos previos (.xlsx o .csv)?
                    </span>
                    <Link
                      href="/registrarse"
                      className="font-semibold text-primary hover:underline text-xs flex items-center gap-1 shrink-0"
                    >
                      <span>Usa el importador asistido</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── SECCIÓN: CARACTERÍSTICAS ─── */}
          <section className="w-full py-14 sm:py-16 scroll-mt-20" id="alcance">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
              <div className="text-center max-w-xl mx-auto mb-10 sm:mb-12">
                <span className="font-mono text-primary font-bold text-xs uppercase tracking-wider">
                  Funciones clave
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mt-1">
                  Todo lo que necesitas, sin complicaciones
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {features.map((feature) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="group relative bg-surface-container-lowest/90 backdrop-blur-xs p-6 rounded-3xl shadow-xs border border-surface-container-high/60 hover:border-surface-container-highest hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                    >
                      <div>
                        <div className="relative mb-5 flex items-center justify-between">
                          <div className="relative">
                            <div
                              className={`absolute -inset-1 rounded-2xl ${feature.glowColor} blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                            />
                            <div
                              className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.bgGradient} border ${feature.borderColor} ${feature.accentColor} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>
                          </div>

                          <span
                            className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${feature.badgeBg}`}
                          >
                            {feature.tag}
                          </span>
                        </div>

                        <h3 className="font-heading text-base font-bold text-on-surface mb-2 tracking-tight">
                          {feature.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ─── SECCIÓN: PREGUNTAS FRECUENTES ─── */}
          <section
            className="w-full py-14 sm:py-16 bg-surface-container-low/60 border-t border-surface-container-high/40 scroll-mt-20"
            id="faq"
          >
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  Preguntas frecuentes
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  Respuestas directas sobre el uso de FinPal.
                </p>
              </div>

              <FaqAccordion />

              {/* Schema.org FAQPage para SEO (renderizado en servidor) */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: faqs.map((faq) => ({
                      "@type": "Question",
                      name: faq.pregunta,
                      acceptedAnswer: {
                        "@type": "Answer",
                        text: faq.respuesta,
                      },
                    })),
                  }),
                }}
              />
            </div>
          </section>

          {/* ─── BANNER FINAL ─── */}
          <section className="w-full py-16 bg-surface-container relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-primary/10 blur-[90px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                Toma el control de tus préstamos hoy
              </h2>
              <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-lg mx-auto">
                Empieza gratis en 30 segundos. Sin tarjetas ni compromisos.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <Link
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm transition-all shadow-sm flex items-center gap-2"
                  href="/registrarse"
                >
                  <span>Crear cuenta gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  className="px-5 py-3 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container font-semibold text-sm transition-colors border border-surface-container-high/70"
                  href="/iniciar-sesion"
                >
                  <span>Iniciar sesión</span>
                </Link>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-5">
                Software libre y transparente •{" "}
                <a
                  href={GITHUB_WEB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  Código en GitHub
                </a>
              </p>
            </div>
          </section>

          <LandingFooter />
        </main>
      </div>
    </LandingLegalProvider>
  );
}
