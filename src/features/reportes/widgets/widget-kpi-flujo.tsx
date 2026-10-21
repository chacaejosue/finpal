"use client";

import { Activity, ArrowDownLeft, ArrowUpRight, Scale, Landmark, WalletCards } from "lucide-react";
import { money } from "@/lib/dashboard-context";

export interface WidgetKpiFlujoMetrics {
  totalIngresos: number;
  totalIngresosDirectos: number;
  totalInteresCobrado: number;
  totalGastos: number;
  gastosCount: number;
  resultadoNeto: number;
  totalLiquidez: number;
  activeAccountsCount: number;
}

export function WidgetKpiFlujo({
  metrics,
  colSpan = 12,
}: {
  metrics: WidgetKpiFlujoMetrics;
  colSpan?: 12 | 6;
}) {
  const isHalf = colSpan === 6;

  return (
    <div className="space-y-2.5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-bold text-on-surface min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">
            {isHalf ? "Flujo Operativo & Resultados" : "Flujo Operativo & Resultados (Ingresos vs Gastos)"}
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md shrink-0 self-start sm:self-auto">
          {metrics.resultadoNeto >= 0 ? "Superávit neto global" : "Déficit en el período"}
        </span>
      </div>

      <div
        className={
          isHalf
            ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
        }
      >
        {/* Card 1: Ingresos Totales */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider truncate">
              Ingresos Totales
            </span>
            <div className="w-9 h-9 rounded-xl kpi-icon-emerald flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 min-w-0">
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight truncate">
              {money(metrics.totalIngresos)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1 truncate">
              <span className="truncate">{money(metrics.totalIngresosDirectos)} directos</span>
              <span className="text-on-surface-variant font-normal">·</span>
              <span className="truncate">{money(metrics.totalInteresCobrado)} intereses</span>
            </p>
          </div>
        </div>

        {/* Card 2: Gastos Registrados */}
        <div className="bg-surface-container-lowest print:bg-slate-50 rounded-2xl p-4 border border-surface-container-high/70 print:border-slate-300 shadow-2xs hover:border-rose-400/50 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0 print-avoid-break">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider truncate">
              Gastos Registrados
            </span>
            <div className="w-9 h-9 rounded-xl kpi-icon-rose flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 min-w-0">
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight truncate">
              {money(metrics.totalGastos)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-on-surface-variant mt-1 font-medium truncate">
              {metrics.gastosCount} {metrics.gastosCount === 1 ? "gasto registrado" : "gastos registrados"}
            </p>
          </div>
        </div>

        {/* Card 3: Resultado / Margen Neto */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs hover:border-blue-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider truncate">
              Resultado Neto
            </span>
            <div className="w-9 h-9 rounded-xl kpi-icon-blue flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 min-w-0">
            <div
              className={`font-mono text-xl sm:text-2xl font-extrabold tracking-tight truncate ${
                metrics.resultadoNeto >= 0 ? "text-primary" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {metrics.resultadoNeto >= 0 ? "+" : ""}
              {money(metrics.resultadoNeto)}
            </div>
            <p className="text-[10px] sm:text-[11px] mt-1 font-medium flex items-center gap-1 truncate">
              {metrics.resultadoNeto >= 0 ? (
                <span className="text-primary font-bold truncate">Superávit operativo</span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-bold truncate">Déficit en el período</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Liquidez Disponible */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs hover:border-teal-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider truncate">
              Liquidez Disponible
            </span>
            <div className="w-9 h-9 rounded-xl kpi-icon-teal flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 min-w-0">
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight truncate">
              {money(metrics.totalLiquidez)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-on-surface-variant mt-1 flex items-center gap-1.5 font-medium truncate">
              <WalletCards className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{metrics.activeAccountsCount} cuentas con saldo</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
