"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CustomTooltip } from "../reportes-tooltips";
import type { ChartType } from "../types";

export interface CobroMensualData {
  periodo: string;
  capital: number;
  interes: number;
  total: number;
}

export function WidgetChartHistorico({
  cobrosMensuales,
  mounted,
}: {
  cobrosMensuales: CobroMensualData[];
  mounted: boolean;
}) {
  const [chartType, setChartType] = useState<ChartType>("area");

  return (
    <div className="bg-surface-container-lowest h-full rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs flex flex-col min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-surface-container-low min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 className="w-4 h-4 text-primary shrink-0" />
            <h2 className="font-heading text-base font-bold text-on-surface truncate">
              Evolución Histórica de Cobros
            </h2>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
            Desglose de capital pagado vs. intereses percibidos en cada período.
          </p>
        </div>

        {/* Toggle Área / Barras */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartType("area")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              chartType === "area"
                ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Área continua
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              chartType === "bar"
                ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Barras agrupadas
          </button>
        </div>
      </div>

      <div className="w-full h-72 sm:h-80 pt-2">
        {!mounted ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">
            Cargando gráfico analítico...
          </div>
        ) : cobrosMensuales.length === 1 && cobrosMensuales[0].total === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/40 rounded-xl border border-dashed border-surface-container-high">
            <BarChart3 className="w-8 h-8 text-on-surface-variant/50 mb-2" />
            <p className="text-xs font-semibold text-on-surface">No hay cobros registrados en este período</p>
            <p className="text-[11px] text-on-surface-variant mt-0.5 max-w-sm">
              Al registrar cobros en el sistema, verás la curva de capital pagado e intereses en este panel.
            </p>
          </div>
        ) : chartType === "area" ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cobrosMensuales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorInteres" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="periodo"
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-on-surface-variant"
                tickLine={false}
                axisLine={{ opacity: 0.2 }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-on-surface-variant"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `Bs.${v}`}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ pointerEvents: "none", zIndex: 100 }}
                allowEscapeViewBox={{ x: true, y: true }}
                offset={12}
              />
              <Area
                type="monotone"
                dataKey="capital"
                name="Capital Pagado"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCapital)"
              />
              <Area
                type="monotone"
                dataKey="interes"
                name="Intereses Cobrados"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorInteres)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cobrosMensuales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="periodo"
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-on-surface-variant"
                tickLine={false}
                axisLine={{ opacity: 0.2 }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "currentColor" }}
                className="text-on-surface-variant"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `Bs.${v}`}
              />
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ pointerEvents: "none", zIndex: 100 }}
                allowEscapeViewBox={{ x: true, y: true }}
                offset={12}
              />
              <Bar dataKey="capital" name="Capital Pagado" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="interes" name="Intereses Cobrados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 mt-3 pt-3 border-t border-surface-container-low text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          <span className="text-on-surface">Capital Pagado</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 dark:bg-amber-400" />
          <span className="text-on-surface">Interés Percibido</span>
        </div>
      </div>
    </div>
  );
}
