"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Banknote, Landmark, WalletCards } from "lucide-react";
import { ContactAvatar } from "@/components/contact-avatar";
import { borrowers } from "./landing-data";

type StatusFilter = "todos" | "al_dia" | "atraso";

export function LiveBoardPreview() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const mesActualLanding = useMemo(() => {
    try {
      const hoy = new Date();
      const txt = hoy.toLocaleDateString("es-ES", { month: "long" });
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    } catch {
      return "este mes";
    }
  }, []);

  const filteredBorrowers = useMemo(() => {
    if (statusFilter === "al_dia") return borrowers.filter((b) => !b.late);
    if (statusFilter === "atraso") return borrowers.filter((b) => b.late);
    return borrowers;
  }, [statusFilter]);

  return (
    <motion.section
      className="w-full py-14 sm:py-16 scroll-mt-20"
      id="vista-sistema"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3 border-b border-surface-container-high/40 pb-5">
          <div>
            <span className="font-mono text-primary font-bold text-xs uppercase tracking-wider">
              Vista previa interactiva
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-on-surface mt-1">
              Tu balance en un vistazo
            </h2>
          </div>
          <Link
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            href="/registrarse"
          >
            <span>Probar con tus datos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tabla interactiva con filtro por estado */}
          <div className="lg:col-span-8 bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-container-low mb-3">
              <div className="flex items-center gap-2">
                <WalletCards className="w-4 h-4 text-primary shrink-0" />
                <h3 className="font-heading text-sm sm:text-base font-bold text-on-surface">
                  Préstamos y Cobros Recientes
                </h3>
              </div>

              <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-surface-container-low border border-surface-container-high/40 text-[11px] font-semibold" role="group" aria-label="Filtrar préstamos por estado">
                {(
                  [
                    { key: "todos", label: `Todos (${borrowers.length})` },
                    { key: "al_dia", label: "Al día" },
                    { key: "atraso", label: "Con atraso" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={statusFilter === item.key}
                    onClick={() => setStatusFilter(item.key)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      statusFilter === item.key
                        ? "bg-surface-container-lowest text-primary font-bold shadow-2xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm min-w-[460px]">
                <thead>
                  <tr className="bg-surface-container-low/60 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Contacto</th>
                    <th className="py-2.5 px-3">Capital</th>
                    <th className="py-2.5 px-3">Interés</th>
                    <th className="py-2.5 px-3">Cobro</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {filteredBorrowers.map((borrower) => (
                    <tr key={borrower.name} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="py-3 px-3 flex items-center gap-2.5">
                        <ContactAvatar name={borrower.name} size={32} className="rounded-full shrink-0" />
                        <div>
                          <p className="font-semibold text-xs leading-tight">{borrower.name}</p>
                          <p className="text-[11px] text-on-surface-variant">{borrower.detail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-xs">{borrower.capital}</td>
                      <td className="py-3 px-3 font-mono text-xs text-primary">{borrower.interest}</td>
                      <td className={`py-3 px-3 text-xs ${borrower.late ? "text-error font-semibold" : "text-on-surface-variant"}`}>
                        {borrower.date}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${borrower.late ? "badge-atrasado" : "badge-al-dia"}`}>
                          {borrower.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lado derecho: Flujo y Cuentas */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-xs">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase font-mono" suppressHydrationWarning>
                Cobros de {mesActualLanding}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading text-2xl font-extrabold text-on-surface">$2,154.50</span>
                <span className="text-xs font-semibold text-primary">↑ Programado</span>
              </div>

              <div className="mt-3 h-12 w-full" aria-hidden="true">
                <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 300 70">
                  <path
                    d="M 0,55 Q 30,50 60,35 T 120,40 T 180,25 T 240,15 T 300,5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-on-surface pb-1 border-b border-surface-container-low">
                <span>Cuentas de dinero</span>
                <span className="text-[11px] font-mono text-primary font-normal">Impacto directo</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low/60">
                  <span className="flex items-center gap-2 text-on-surface font-medium">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Efectivo
                  </span>
                  <span className="font-mono font-bold">$380.00</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low/60">
                  <span className="flex items-center gap-2 text-on-surface font-medium">
                    <Landmark className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" /> Banco Principal
                  </span>
                  <span className="font-mono font-bold">$2,840.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
