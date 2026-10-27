"use client";

import { ShieldCheck, TrendingUp, WalletCards, Scale, Info } from "lucide-react";
import { money } from "@/lib/dashboard-context";
import type { TopDebtorItem } from "./widget-top-deudores";

export interface SmartInsightsProps {
  metrics: {
    totalSaldoPendiente: number;
    interesMensualEstimado: number;
    totalLiquidez: number;
    totalIngresos: number;
    totalGastos: number;
    resultadoNeto: number;
  };
  topDebtors: TopDebtorItem[];
  colSpan?: 12 | 6;
}

export function WidgetSmartInsights({ metrics, topDebtors, colSpan = 12 }: SmartInsightsProps) {
  const isHalf = colSpan === 6;

  return (
    <div className="space-y-2.5 min-w-0">
      <div
        className={
          isHalf
            ? "grid grid-cols-1 sm:grid-cols-2 gap-3.5 min-w-0"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0"
        }
      >
        {/* Insight 1: Concentración de Cartera */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl kpi-icon-emerald flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider truncate">
              Concentración de Riesgo
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {topDebtors.length > 0 && metrics.totalSaldoPendiente > 0 ? (
                (() => {
                  const maxSaldo = topDebtors[0].saldo;
                  const tiedDebtors = topDebtors.filter(
                    (d) => Math.abs(d.saldo - maxSaldo) < 0.01
                  );
                  const isTie = tiedDebtors.length >= 2;
                  const pctEach = (
                    (maxSaldo / metrics.totalSaldoPendiente) *
                    100
                  ).toFixed(0);

                  if (isTie) {
                    if (tiedDebtors.length === 2) {
                      return pctEach === "50" ? (
                        <>
                          Cartera equilibrada al 50%:{" "}
                          <strong>{tiedDebtors[0].nombre}</strong> y{" "}
                          <strong>{tiedDebtors[1].nombre}</strong> concentran el{" "}
                          <strong>50%</strong> cada uno ({money(maxSaldo)}).
                        </>
                      ) : (
                        <>
                          Empate en riesgo:{" "}
                          <strong>{tiedDebtors[0].nombre}</strong> y{" "}
                          <strong>{tiedDebtors[1].nombre}</strong> concentran el{" "}
                          <strong>{pctEach}%</strong> cada uno ({money(maxSaldo)}).
                        </>
                      );
                    }

                    return (
                      <>
                        Cartera equitativamente distribuida entre los{" "}
                        <strong>{tiedDebtors.length} deudores principales</strong> con{" "}
                        <strong>{pctEach}%</strong> cada uno ({money(maxSaldo)}).
                      </>
                    );
                  }

                  return (
                    <>
                      El deudor principal (<strong>{topDebtors[0].nombre}</strong>) concentra el{" "}
                      <strong>{pctEach}%</strong> del saldo pendiente ({money(maxSaldo)}).
                    </>
                  );
                })()
              ) : (
                "Cartera sin saldos pendientes acumulados. Sin concentración registrada."
              )}
            </p>
          </div>
        </div>

        {/* Insight 2: Margen de Interés Mensual */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl kpi-icon-amber flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider truncate">
              Flujo Estimado Mensual
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Los préstamos activos devengan una proyección de{" "}
              <strong>{money(metrics.interesMensualEstimado)}</strong> cada mes en intereses.
            </p>
          </div>
        </div>

        {/* Insight 3: Ratio de Cobertura */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl kpi-icon-blue flex items-center justify-center shrink-0 mt-0.5">
            <WalletCards className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider truncate">
              Liquidez vs Cartera
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Cuentas con <strong>{money(metrics.totalLiquidez)}</strong> líquidos registrados en el espacio actual.
            </p>
          </div>
        </div>

        {/* Insight 4: Balance Operativo (Ingresos vs Gastos) */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            metrics.resultadoNeto >= 0
              ? "kpi-icon-emerald"
              : "kpi-icon-rose"
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider truncate">
              Balance Operativo
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Ingresos de <strong>{money(metrics.totalIngresos)}</strong> frente a <strong>{money(metrics.totalGastos)}</strong> en gastos (balance:{" "}
              <strong className={metrics.resultadoNeto >= 0 ? "text-primary" : "text-error"}>
                {metrics.resultadoNeto >= 0 ? "+" : ""}{money(metrics.resultadoNeto)}
              </strong>).
            </p>
          </div>
        </div>
      </div>

      {/* Aviso legal de Deslinde sobre Indicadores Automatizados / IA */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low/60 border border-surface-container-high/50 text-[11px] text-on-surface-variant">
        <Info className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>
          <strong>Aviso legal:</strong> Los indicadores de <em>Smart Insights</em> son estimaciones matemáticas automatizadas sobre tus registros y no constituyen asesoramiento financiero, contable, legal ni calificación crediticia profesional.
        </span>
      </div>
    </div>
  );
}
