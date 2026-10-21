"use client";

import { PieChart as PieIcon } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { money } from "@/lib/dashboard-context";

export interface PortfolioHealthItem {
  name: string;
  value: number;
  count: number;
  pct: number;
  color: string;
}

export function WidgetChartSalud({
  portfolioHealth,
  moraRate,
  mounted,
}: {
  portfolioHealth: PortfolioHealthItem[];
  moraRate: number;
  mounted: boolean;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs flex flex-col justify-between h-full min-w-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2 pb-2 border-b border-surface-container-low min-w-0">
          <PieIcon className="w-4 h-4 text-primary shrink-0" />
          <h2 className="font-heading text-base font-bold text-on-surface truncate">
            Composición de Cartera
          </h2>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1 truncate">
          Distribución de capital colocado según estado de cobro.
        </p>
      </div>

      <div className="w-full h-56 relative flex items-center justify-center my-auto">
        {!mounted ? (
          <div className="text-xs text-on-surface-variant">Cargando gráfico...</div>
        ) : portfolioHealth.length === 0 ? (
          <div className="text-xs text-on-surface-variant">No hay préstamos para mostrar</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={portfolioHealth}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {portfolioHealth.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val) => money(Number(val))}
                contentStyle={{
                  backgroundColor: "var(--color-surface-container-lowest, #fff)",
                  borderRadius: "0.75rem",
                  borderColor: "var(--color-surface-container-high, #e5e7eb)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-on-surface, #1f2937)",
                }}
                itemStyle={{
                  color: "var(--color-on-surface, #1f2937)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Donut Center Label */}
        {portfolioHealth.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Cumplimiento
            </span>
            <span className="font-heading text-lg font-extrabold text-on-surface leading-tight">
              {(100 - moraRate).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-surface-container-low min-w-0">
        {portfolioHealth.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-2 text-xs min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-on-surface truncate">{item.name}</span>
              <span className="text-[10px] text-on-surface-variant font-semibold shrink-0">({item.count})</span>
            </div>
            <div className="font-mono font-bold text-on-surface shrink-0 text-right">
              {money(item.value)}{" "}
              <span className="text-[10px] font-normal text-on-surface-variant">
                ({item.pct.toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
