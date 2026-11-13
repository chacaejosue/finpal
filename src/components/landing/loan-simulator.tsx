"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, ArrowRight, Calculator, Check, Scale } from "lucide-react";
import { useLandingLegal } from "./landing-legal-provider";

export function LoanSimulator() {
  const { openLegal } = useLandingLegal();
  const [simMonto, setSimMonto] = useState<number>(1000);
  const [simTasa, setSimTasa] = useState<number>(3);
  const [simPlazo, setSimPlazo] = useState<number>(6);
  const [simModalidad, setSimModalidad] = useState<"solo_interes" | "frances">("solo_interes");

  const simResultado = useMemo(() => {
    const P = Math.max(1, simMonto);
    const r = Math.max(0.1, simTasa) / 100;
    const n = Math.max(1, simPlazo);

    if (simModalidad === "solo_interes") {
      const interesMensual = P * r;
      const interesTotal = interesMensual * n;
      const totalRecuperar = P + interesTotal;
      return {
        cuota: interesMensual,
        cuotaLabel: "Interés mensual a cobrar",
        interesTotal,
        totalRecuperar,
        abonoCapital: 0,
      };
    }

    const factor = Math.pow(1 + r, n);
    const cuotaFrancesa = (P * (r * factor)) / (factor - 1);
    const totalRecuperar = cuotaFrancesa * n;
    const interesTotal = totalRecuperar - P;
    return {
      cuota: cuotaFrancesa,
      cuotaLabel: "Cuota fija mensual (Capital + Interés)",
      interesTotal,
      totalRecuperar,
      abonoCapital: P / n,
    };
  }, [simMonto, simTasa, simPlazo, simModalidad]);

  const registerHref = `/registrarse?monto=${simMonto}&tasa=${simTasa}&plazo=${simPlazo}&modalidad=${simModalidad}`;

  return (
    <motion.section
      className="w-full py-14 sm:py-16 bg-surface-container-low/40 border-b border-surface-container-high/40 scroll-mt-20"
      id="simulador"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full badge-emerald text-xs font-semibold mb-2">
            <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Simulador en vivo</span>
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Proyecta tu cobro en segundos
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5">
            Ajusta monto, tasa y plazo para ver tu ganancia al instante.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl p-5 sm:p-7 shadow-lg grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Controles de Simulación */}
          <div className="md:col-span-7 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-xl" role="group" aria-label="Modalidad de cálculo">
              <button
                type="button"
                aria-pressed={simModalidad === "solo_interes"}
                onClick={() => setSimModalidad("solo_interes")}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                  simModalidad === "solo_interes"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Solo Interés Mensual
              </button>
              <button
                type="button"
                aria-pressed={simModalidad === "frances"}
                onClick={() => setSimModalidad("frances")}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                  simModalidad === "frances"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Cuota Fija (Francés)
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-semibold mb-1.5">
                <label htmlFor="sim-monto-range" className="text-on-surface">
                  Capital prestado:
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-primary font-bold" aria-hidden="true">$</span>
                  <input
                    id="sim-monto-number"
                    type="number"
                    min={50}
                    max={100000}
                    step={50}
                    value={simMonto}
                    aria-label="Capital prestado en monto exacto"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val)) setSimMonto(Math.max(50, Math.min(100000, val)));
                    }}
                    className="w-24 text-right font-heading text-primary font-bold text-sm bg-surface-container-low/70 border border-surface-container-high/70 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>
              <input
                id="sim-monto-range"
                type="range"
                min="100"
                max="10000"
                step="50"
                value={Math.min(10000, simMonto)}
                aria-valuetext={`${simMonto.toLocaleString("en-US")} dólares`}
                onChange={(e) => setSimMonto(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
              />
              {/* Presets rápidos de monto */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[500, 1000, 2500, 5000].map((preset) => (
                  <motion.button
                    key={preset}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSimMonto(preset)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                      simMonto === preset
                        ? "bg-primary text-on-primary font-bold"
                        : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    ${preset.toLocaleString("en-US")}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold mb-1.5">
                <label htmlFor="sim-tasa-range" className="text-on-surface">
                  Tasa de interés mensual:
                </label>
                <div className="flex items-center gap-2">
                  {simTasa <= 3 ? (
                    <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Tope legal Bolivia (≤ 3% mes)
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      <AlertTriangle className="w-3 h-3" />
                      &gt; 3% mes (Excede límite legal)
                    </span>
                  )}
                  <span className="font-heading text-primary font-extrabold text-sm">{simTasa}% mes</span>
                </div>
              </div>
              <input
                id="sim-tasa-range"
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={simTasa}
                aria-valuetext={`${simTasa} por ciento mensual`}
                onChange={(e) => setSimTasa(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-surface-container-high rounded-lg cursor-pointer"
              />

              {/* Aviso legal sintético y conciso (Bolivia Art. 409) */}
              <AnimatePresence>
                {simTasa > 3 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -4 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -4 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden mt-2.5"
                  >
                    <div className="rounded-xl p-2.5 bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Scale className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-[11px] leading-snug">
                          <span className="font-bold">Límite legal en Bolivia:</span> El Art. 409 del Código Civil fija como tope máx. el <b>3% mensual</b>. FinPal solo calcula; tasas mayores son responsabilidad del usuario (
                          <button
                            type="button"
                            onClick={() => openLegal("terminos")}
                            className="underline font-bold hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer"
                          >
                            Términos §2
                          </button>
                          ).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSimTasa(3)}
                        className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 transition-colors cursor-pointer"
                      >
                        Fijar al 3%
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <span className="block text-xs font-semibold text-on-surface mb-1.5">Plazo:</span>
              <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Plazo en meses">
                {[3, 6, 12, 24].map((meses) => (
                  <motion.button
                    key={meses}
                    type="button"
                    aria-pressed={simPlazo === meses}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSimPlazo(meses)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      simPlazo === meses
                        ? "bg-primary text-on-primary font-bold"
                        : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {meses} m
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="md:col-span-5 bg-surface-container-low p-4 sm:p-5 rounded-2xl border border-surface-container-high/60 space-y-3">
            <div className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/40">
              <p className="text-[11px] text-on-surface-variant font-medium">{simResultado.cuotaLabel}</p>
              <p className="font-heading text-2xl font-extrabold text-on-surface mt-0.5">
                ${simResultado.cuota.toFixed(2)}
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              {simModalidad === "frances" && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Capital promedio/mes:</span>
                  <span className="font-semibold text-on-surface">
                    ${simResultado.abonoCapital.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Interés total a ganar:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +${simResultado.interesTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-surface-container-high/40">
                <span className="text-on-surface">Total a recuperar:</span>
                <span className="text-primary">${simResultado.totalRecuperar.toFixed(2)}</span>
              </div>
            </div>

            {/* Barra visual dinámica de proporción capital vs interés */}
            <div className="pt-1 space-y-1">
              <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden flex">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(simMonto / simResultado.totalRecuperar) * 100}%` }}
                />
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(simResultado.interesTotal / simResultado.totalRecuperar) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-on-surface-variant font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Cap: ${simMonto.toLocaleString("en-US")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Int: +${simResultado.interesTotal.toFixed(0)}
                </span>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={registerHref}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all cursor-pointer text-center mt-1"
              >
                <span>Registrar este préstamo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
