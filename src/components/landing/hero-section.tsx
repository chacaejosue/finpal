"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { ContactAvatar } from "@/components/contact-avatar";
import { borrowers } from "./landing-data";

const tabLabels = {
  resumen: "Resumen",
  prestamos: "Préstamos",
  recibo: "Recibo",
} as const;

type MockTabKey = keyof typeof tabLabels;

export function HeroSection() {
  const [mockTab, setMockTab] = useState<MockTabKey>("resumen");

  return (
    <div className="relative w-full overflow-hidden border-b border-surface-container-high/40 bg-surface">
      {/* Luces ambientales sutiles */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] max-w-[100vw] h-[420px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[300px] bg-teal-500/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Patrón de matriz sutil con máscara radial */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_25%,#000_60%,transparent_100%)] pointer-events-none" />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-8 sm:pt-14 pb-14 sm:pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-14 items-center">
          {/* Columna izquierda */}
          <motion.div
            className="lg:col-span-6 flex flex-col items-start space-y-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-emerald text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Control de préstamos simple · Cifrado AES-256</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.12] text-on-surface text-balance">
              Préstamos personales y cobro de intereses,{" "}
              <span className="relative inline-block text-primary font-bold">
                simplificados.
                <span className="absolute left-0 right-0 -bottom-1.5 h-1 overflow-hidden rounded-full bg-primary/20">
                  <motion.span
                    className="absolute inset-y-0 w-1/2 rounded-full bg-primary"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.2 }}
                  />
                </span>
                <span className="absolute left-0 right-0 -bottom-1.5 h-1 rounded-full border-b-2 border-primary/30" />
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-on-surface-variant max-w-xl leading-relaxed">
              Registra préstamos, calcula intereses al instante y cobra a tiempo con recibos digitales. Sin hojas de cálculo ni desorden.
            </p>

            {/* Botones de acción principales + acceso directo a iniciar sesión */}
            <div className="flex flex-col gap-3 pt-1 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm sm:text-base shadow-md hover:shadow-lg transition-all text-center w-full"
                    href="/registrarse"
                  >
                    <span>Empezar gratis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <a
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-surface-container-high/80 font-semibold text-sm sm:text-base shadow-xs transition-colors text-center w-full"
                    href="#simulador"
                  >
                    <Calculator className="w-4 h-4 text-primary" />
                    <span>Simular préstamo</span>
                  </a>
                </motion.div>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant">
                <span>¿Ya tienes cuenta?</span>
                <Link
                  href="/iniciar-sesion"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md px-1 py-0.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Iniciar sesión</span>
                </Link>
              </div>
            </div>

            {/* Beneficios directos */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-on-surface-variant text-xs pt-1">
              <span className="flex items-center gap-1.5 font-medium text-on-surface">
                <Check className="w-3.5 h-3.5 text-primary stroke-[3]" /> Gratis sin tarjeta
              </span>
              <span className="text-outline-variant" aria-hidden="true">•</span>
              <span className="flex items-center gap-1.5 font-medium text-on-surface">
                <Check className="w-3.5 h-3.5 text-primary stroke-[3]" /> Celular y PC
              </span>
              <span className="text-outline-variant" aria-hidden="true">•</span>
              <span className="flex items-center gap-1.5 font-medium text-on-surface">
                <Check className="w-3.5 h-3.5 text-primary stroke-[3]" /> Cifrado en servidor
              </span>
            </div>
          </motion.div>

          {/* Columna derecha: Mockup interactivo */}
          <motion.div
            className="lg:col-span-6 relative flex flex-col items-center justify-center w-full"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            {/* Floating Chip 1 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: [0, -6, 0] }}
              transition={{
                opacity: { delay: 0.4, duration: 0.4 },
                y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.4 },
              }}
              className="hidden sm:flex absolute -top-3.5 -right-2 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest/95 backdrop-blur-md border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-lg pointer-events-none"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cobro registrado +$200.00</span>
            </motion.div>

            {/* Floating Chip 2 */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: [0, 6, 0] }}
              transition={{
                opacity: { delay: 0.5, duration: 0.4 },
                y: { repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.8 },
              }}
              className="hidden sm:flex absolute -bottom-3 -left-3 z-20 items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest/95 backdrop-blur-md border border-surface-container-high/80 text-on-surface text-xs font-semibold shadow-lg pointer-events-none"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Cifrado AES-256 en servidor</span>
            </motion.div>

            {/* Contenedor Mockup Ventana */}
            <div className="relative w-full rounded-2xl bg-surface-container-lowest border border-surface-container-high/80 p-4 sm:p-5 shadow-2xl">
              {/* Barra de cabecera con pestañas */}
              <div className="flex items-center justify-between gap-2 pb-3 px-1 border-b border-surface-container-low mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5" aria-hidden="true">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="ml-1 font-mono text-[11px] text-outline hidden xs:inline">
                    finpal.app/panel
                  </span>
                </div>

                {/* Selector de pestañas dinámico accesible */}
                <div
                  role="tablist"
                  aria-label="Vista previa del panel"
                  className="relative inline-flex rounded-lg bg-surface-container-low p-0.5 border border-surface-container-high/40 text-xs font-semibold"
                >
                  {(Object.keys(tabLabels) as MockTabKey[]).map((tabKey) => {
                    const isActive = mockTab === tabKey;
                    return (
                      <button
                        key={tabKey}
                        type="button"
                        role="tab"
                        id={`hero-tab-${tabKey}`}
                        aria-selected={isActive}
                        aria-controls={`hero-tabpanel-${tabKey}`}
                        onClick={() => setMockTab(tabKey)}
                        className={`relative px-2.5 py-1 rounded-md transition-colors cursor-pointer z-10 ${
                          isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="mockTabPill"
                            className="absolute inset-0 rounded-md bg-surface-container-lowest shadow-xs -z-10"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        {tabLabels[tabKey]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cuerpo de la Maqueta */}
              <div className="rounded-xl bg-surface-container-low border border-surface-container-high/30 p-3.5 min-h-[260px] flex flex-col justify-between overflow-hidden">
                <AnimatePresence mode="wait">
                  {mockTab === "resumen" && (
                    <motion.div
                      key="resumen"
                      role="tabpanel"
                      id="hero-tabpanel-resumen"
                      aria-labelledby="hero-tab-resumen"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/40 p-2.5">
                          <p className="text-[11px] font-semibold uppercase text-on-surface-variant">Saldo total</p>
                          <p className="mt-1 font-heading text-sm sm:text-base font-extrabold text-on-surface">$4,825.00</p>
                          <span className="text-[11px] font-mono text-primary font-semibold">+12.4% mes</span>
                        </div>
                        <div className="rounded-xl bg-surface-container-lowest border border-primary/25 p-2.5">
                          <p className="text-[11px] font-semibold uppercase text-on-surface-variant">Por cobrar</p>
                          <p className="mt-1 font-heading text-sm sm:text-base font-extrabold text-primary">$1,950.00</p>
                          <span className="text-[11px] text-on-surface-variant">3 préstamos</span>
                        </div>
                        <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/40 p-2.5">
                          <p className="text-[11px] font-semibold uppercase text-on-surface-variant">Interés mes</p>
                          <p className="mt-1 font-heading text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">+$93.00</p>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">94% puntual</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-surface-container-lowest border border-surface-container-high/40 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-on-surface">Carlos Ramírez • Mensual</span>
                          <span className="font-mono text-[11px] font-bold text-primary">75% al día</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: "75%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-on-surface-variant flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            Abono reciente #FP-842
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+$200.00</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {mockTab === "prestamos" && (
                    <motion.div
                      key="prestamos"
                      role="tabpanel"
                      id="hero-tabpanel-prestamos"
                      aria-labelledby="hero-tab-prestamos"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="space-y-2"
                    >
                      {borrowers.map((b) => (
                        <div
                          key={b.name}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/40 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <ContactAvatar name={b.name} size={30} className="rounded-full shrink-0" />
                            <div>
                              <p className="font-semibold text-on-surface">{b.name}</p>
                              <p className="text-[11px] text-on-surface-variant">{b.detail}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-on-surface">{b.capital}</p>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${b.late ? "badge-atrasado" : "badge-al-dia"}`}>
                              {b.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {mockTab === "recibo" && (
                    <motion.div
                      key="recibo"
                      role="tabpanel"
                      id="hero-tabpanel-recibo"
                      aria-labelledby="hero-tab-recibo"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="p-3.5 rounded-xl bg-surface-container-lowest border border-dashed border-surface-container-high text-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-surface-container-low pb-2">
                        <div className="flex items-center gap-2">
                          <FinPalLogo size={22} className="w-5 h-5 shrink-0" />
                          <span className="font-bold text-on-surface">Recibo Digital #FP-842</span>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                          Cobrado
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Deudor:</span>
                          <span className="font-semibold text-on-surface">Carlos Ramírez</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-on-surface-variant">Concepto:</span>
                          <span className="font-semibold text-on-surface">Préstamo personal (Abono mensual)</span>
                        </div>
                        <div className="flex justify-between font-bold text-xs pt-1 border-t border-surface-container-low">
                          <span className="text-on-surface">Total cobrado:</span>
                          <span className="text-primary font-extrabold">$200.00</span>
                        </div>
                      </div>
                      <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-surface-container-low">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check className="w-3 h-3" /> Listo para compartir o imprimir
                        </span>
                        <span className="font-mono">Folio verificado</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mini pie de maqueta */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-surface-container-high/40">
                  <span>Espacio de trabajo: <b>Principal</b></span>
                  <span className="font-semibold text-primary">Sincronizado</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
