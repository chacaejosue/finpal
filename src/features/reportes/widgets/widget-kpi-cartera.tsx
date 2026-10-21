"use client";

import { Coins, Percent, TrendingUp, AlertOctagon } from "lucide-react";
import { money, type Prestamo } from "@/lib/dashboard-context";

export interface WidgetKpiCarteraMetrics {
  deudoresUnicos: number;
  totalCapitalColocado: number;
  totalSaldoPendiente: number;
  totalCapitalPagado: number;
  recoveryRate: number;
  totalInteresCobrado: number;
  interesMensualEstimado: number;
  capitalEnMora: number;
  moraRate: number;
  moraCount: number;
}

export function WidgetKpiCartera({
  metrics,
  filteredPrestamos,
  colSpan = 12,
}: {
  metrics: WidgetKpiCarteraMetrics;
  filteredPrestamos: Prestamo[];
  colSpan?: 12 | 6;
}) {
  const isHalf = colSpan === 6;

  return (
    <div className="space-y-2.5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs font-bold text-on-surface min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Coins className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">Rendimiento de Cartera & Préstamos</span>
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md shrink-0 self-start sm:self-auto">
          {metrics.deudoresUnicos} deudores · {filteredPrestamos.length} créditos
        </span>
      </div>

      <div
        className={
          isHalf
            ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5"
        }
      >
        {/* Card 1: Cartera Colocada */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs hover:border-blue-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider truncate">
              Cartera Colocada
            </span>
            <div className="w-9 h-9 rounded-xl kpi-icon-blue flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 min-w-0">
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight truncate">
              {money(metrics.totalCapitalColocado)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-on-surface-variant mt-1 font-medium truncate">
              Saldo activo: <span className="font-mono font-bold text-on-surface">{money(metrics.totalSaldoPendiente)}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Capital Devuelto con Progress Bar */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider block truncate">
                Capital Devuelto
              </span>
              <span className="text-[10px] text-on-surface-variant font-normal block truncate">
                Recuperación
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl kpi-icon-emerald flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-xl sm:text-2xl font-extrabold text-primary tracking-tight truncate">
                {metrics.recoveryRate.toFixed(1)}%
              </span>
              <span className="text-[10px] text-on-surface-variant font-semibold truncate">
                {money(metrics.totalCapitalPagado)}
              </span>
            </div>
            {/* Mini barra visual de progreso */}
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, metrics.recoveryRate))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Rendimiento Intereses */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs hover:border-amber-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider truncate">
              Intereses Percibidos
            </span>
            <div className="w-9 h-9 rounded-xl kpi-icon-amber flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 min-w-0">
            <div className="font-mono text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight truncate">
              {money(metrics.totalInteresCobrado)}
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-1 flex items-center gap-1 truncate">
              <span className="truncate">+{money(metrics.interesMensualEstimado)}</span>
              <span className="text-[10px] text-on-surface-variant font-normal shrink-0">est. mes</span>
            </p>
          </div>
        </div>

        {/* Card 4: Cartera en Mora / Riesgo */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs hover:border-rose-400/50 hover:shadow-sm transition-all duration-200 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider truncate">
              Cartera en Mora
            </span>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                metrics.capitalEnMora > 0
                  ? "kpi-icon-rose"
                  : "bg-surface-container text-on-surface-variant border border-surface-container-high/60"
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 min-w-0">
            <div
              className={`font-mono text-xl sm:text-2xl font-extrabold tracking-tight truncate ${
                metrics.capitalEnMora > 0 ? "text-rose-600 dark:text-rose-400" : "text-on-surface"
              }`}
            >
              {money(metrics.capitalEnMora)}
            </div>
            <p className="text-[10px] sm:text-[11px] mt-1 font-medium truncate">
              {metrics.capitalEnMora > 0 ? (
                <span className="font-bold text-rose-600 dark:text-rose-400 truncate">
                  {metrics.moraRate.toFixed(1)}% ({metrics.moraCount} {metrics.moraCount === 1 ? "préstamo" : "préstamos"})
                </span>
              ) : (
                <span className="text-primary font-bold truncate">0% · Cartera al día</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
