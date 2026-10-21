"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
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
import { money } from "@/lib/dashboard-context";
import { ProyeccionTooltip } from "../reportes-tooltips";

export interface FlujoNetoDataSummary {
  totalFlujoEsperado: number;
  interesProyectado: number;
  capitalDevuelto: number;
  capitalCobradoMes: number;
  interesCobradoMes: number;
}

export interface TimelineDiaData {
  dia: number;
  diaLabel: string;
  flujoDia: number;
  acumulado: number;
  esHoy: boolean;
  esPasado: boolean;
  esFuturo: boolean;
  detalles: Array<{ nombre: string; deudor: string; monto: number }>;
}

export interface ProyeccionSemestreData {
  mesNombre: string;
  periodo: string;
  total: number;
  interes: number;
}

export function WidgetFlujoNeto({
  flujoNetoData,
  timelineProyeccionMes,
  proyeccionSemestral,
  mesActualNombre,
  targetYear,
  proyeccionMesOffset,
  setProyeccionMesOffset,
  interesMensualEstimado,
  mounted,
}: {
  flujoNetoData: FlujoNetoDataSummary;
  timelineProyeccionMes: TimelineDiaData[];
  proyeccionSemestral: ProyeccionSemestreData[];
  mesActualNombre: string;
  targetYear: number;
  proyeccionMesOffset: number;
  setProyeccionMesOffset: React.Dispatch<React.SetStateAction<number>>;
  interesMensualEstimado: number;
  mounted: boolean;
}) {
  const [tipoProyeccion, setTipoProyeccion] = useState<"mes" | "semestre">("mes");

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col justify-between h-full min-w-0">
      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-surface-container-low mb-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-mono truncate">
              Flujo Neto Esperado
            </span>
            {tipoProyeccion === "mes" ? (
              <div className="inline-flex items-center bg-surface-container-low px-1.5 py-0.5 rounded-lg border border-surface-container-high/70 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setProyeccionMesOffset((prev) => prev - 1)}
                  className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                  title="Mes anterior"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-on-surface px-1.5 min-w-[95px] text-center select-none font-mono">
                  {mesActualNombre} {targetYear}
                </span>
                <button
                  type="button"
                  onClick={() => setProyeccionMesOffset((prev) => prev + 1)}
                  className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-colors"
                  title="Mes siguiente"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                {proyeccionMesOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setProyeccionMesOffset(0)}
                    className="text-[9px] font-bold badge-emerald px-1.5 py-0.5 ml-0.5 rounded transition-all"
                    title="Volver al mes actual"
                  >
                    Hoy
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[11px] font-bold text-on-surface-variant font-mono bg-surface-container-low px-2 py-0.5 rounded-md border border-surface-container-high/60 shrink-0">
                Próx. 6 Meses
              </span>
            )}
          </div>

          <div className="flex items-center bg-surface-container-high/60 p-0.5 rounded-lg border border-surface-container-high shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTipoProyeccion("mes")}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                tipoProyeccion === "mes"
                  ? "bg-primary text-on-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Día a Día
            </button>
            <button
              type="button"
              onClick={() => setTipoProyeccion("semestre")}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                tipoProyeccion === "semestre"
                  ? "bg-primary text-on-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              6 Meses
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-2 min-w-0">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-heading text-xl sm:text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight truncate">
              {money(flujoNetoData.totalFlujoEsperado)}
            </span>
            <span className="text-xs font-semibold text-primary inline-flex items-center gap-0.5 shrink-0">
              ↑ Cobros programados
            </span>
          </div>
          <span className="text-[10px] font-bold badge-emerald px-2 py-0.5 rounded-full inline-flex items-center shrink-0">
            {tipoProyeccion === "mes" ? "Proyección Mes" : "Pronóstico 6M"}
          </span>
        </div>

        <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
          {tipoProyeccion === "mes"
            ? `Intereses programados (${money(flujoNetoData.interesProyectado)}) según saldo de créditos activos más capital devuelto (${money(flujoNetoData.capitalDevuelto)}).`
            : `Pronóstico de flujo devengado semestral en base al interés contractual activo (${money(interesMensualEstimado)}/mes).`}
        </p>

        {/* Barra de progreso de recaudación del mes actual */}
        {tipoProyeccion === "mes" && flujoNetoData.totalFlujoEsperado > 0 && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-on-surface-variant mb-1">
              <span>
                Cobrado a la fecha: <b className="text-on-surface font-semibold">{money(flujoNetoData.capitalCobradoMes + flujoNetoData.interesCobradoMes)}</b>
              </span>
              <span className="font-mono text-primary font-bold">
                {Math.min(100, Math.round(((flujoNetoData.capitalCobradoMes + flujoNetoData.interesCobradoMes) / flujoNetoData.totalFlujoEsperado) * 100))}%
              </span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round(((flujoNetoData.capitalCobradoMes + flujoNetoData.interesCobradoMes) / flujoNetoData.totalFlujoEsperado) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Gráfico Analítico de Proyección Realista */}
        <div className="mt-3 h-28 w-full">
          {!mounted ? (
            <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">
              Cargando proyección...
            </div>
          ) : flujoNetoData.totalFlujoEsperado === 0 && tipoProyeccion === "mes" ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 rounded-xl bg-surface-container-low/40 border border-dashed border-surface-container-high">
              <TrendingUp className="w-5 h-5 text-on-surface-variant/40 mb-1" />
              <span className="text-xs font-semibold text-on-surface">Sin cobros programados este mes</span>
              <span className="text-[10px] text-on-surface-variant">
                Los préstamos activos con interés o fecha de cobro se graficarán automáticamente.
              </span>
            </div>
          ) : tipoProyeccion === "mes" ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timelineProyeccionMes}
                margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="chartGradReportes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 9, fill: "currentColor" }}
                  className="text-on-surface-variant"
                  tickLine={false}
                  axisLine={{ opacity: 0.2 }}
                  interval={4}
                  tickFormatter={(v) => `D${v}`}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "currentColor" }}
                  className="text-on-surface-variant"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  content={<ProyeccionTooltip />}
                  wrapperStyle={{ pointerEvents: "none", zIndex: 100 }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  offset={14}
                  cursor={{ stroke: "rgba(5, 150, 105, 0.35)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  name="Flujo Acumulado"
                  stroke="#059669"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#chartGradReportes)"
                  dot={(props: { cx?: number; cy?: number; index?: number; payload: { flujoDia: number; esHoy?: boolean } }) => {
                    if (props.payload.flujoDia > 0 || props.payload.esHoy) {
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={props.cx}
                          cy={props.cy}
                          r={props.payload.esHoy ? 3.5 : 2.5}
                          fill={props.payload.esHoy ? "#059669" : "#f59e0b"}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      );
                    }
                    return <circle key={`empty-${props.index}`} cx={0} cy={0} r={0} />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={proyeccionSemestral}
                margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis
                  dataKey="mesNombre"
                  tick={{ fontSize: 10, fill: "currentColor" }}
                  className="text-on-surface-variant"
                  tickLine={false}
                  axisLine={{ opacity: 0.2 }}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "currentColor" }}
                  className="text-on-surface-variant"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  content={<ProyeccionTooltip />}
                  wrapperStyle={{ pointerEvents: "none", zIndex: 100 }}
                  allowEscapeViewBox={{ x: true, y: true }}
                  offset={14}
                  cursor={{ fill: "rgba(5, 150, 105, 0.08)" }}
                />
                <Bar
                  dataKey="total"
                  name="Flujo Proyectado"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs text-on-surface-variant min-w-0">
        <span className="truncate">
          Capital Devuelto: <b className="text-on-surface font-semibold">{money(flujoNetoData.capitalDevuelto)}</b>
        </span>
        <span className="truncate">
          Interés Programado: <b className="text-primary font-bold">{money(flujoNetoData.interesProyectado)}</b>
        </span>
      </div>
    </div>
  );
}
