"use client";

import { Users } from "lucide-react";
import { money } from "@/lib/dashboard-context";

export interface TopDebtorItem {
  nombre: string;
  saldo: number;
  prestamos: number;
  tieneMora?: boolean;
}

export function WidgetTopDeudores({
  topDebtors,
  totalSaldoPendiente,
}: {
  topDebtors: TopDebtorItem[];
  totalSaldoPendiente: number;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs h-full flex flex-col justify-between min-w-0">
      <div className="flex items-center justify-between pb-3 border-b border-surface-container-low mb-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <h2 className="font-heading text-base font-bold text-on-surface truncate">
              Top 5 Deudores por Saldo Pendiente
            </h2>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
            Concentración del riesgo de capital adeudado por contacto.
          </p>
        </div>
      </div>

      <div className="space-y-3.5 pt-1 min-w-0">
        {topDebtors.length === 0 ? (
          <div className="text-center py-8 text-xs text-on-surface-variant">
            No hay saldos pendientes en el período seleccionado. ¡Excelente salud de cartera!
          </div>
        ) : (
          topDebtors.map((d, index) => {
            const maxBalance = topDebtors[0]?.saldo || 1;
            const ratio = Math.min(100, (d.saldo / maxBalance) * 100);
            const isTiedWithPrevious =
              index > 0 && Math.abs(d.saldo - topDebtors[index - 1].saldo) < 0.01;
            const isTiedWithNext =
              index < topDebtors.length - 1 &&
              Math.abs(d.saldo - topDebtors[index + 1].saldo) < 0.01;
            const isTied = isTiedWithPrevious || isTiedWithNext;
            const isTiedWithTop =
              isTied && Math.abs(d.saldo - topDebtors[0].saldo) < 0.01;
            const pctOfTotal =
              totalSaldoPendiente > 0
                ? ((d.saldo / totalSaldoPendiente) * 100).toFixed(0)
                : "0";

            let rankDisplay = `${index + 1}`;
            if (isTiedWithPrevious) {
              const firstTiedIndex = topDebtors.findIndex(
                (item) => Math.abs(item.saldo - d.saldo) < 0.01
              );
              rankDisplay = `${firstTiedIndex + 1}=`;
            } else if (isTiedWithNext) {
              rankDisplay = `${index + 1}=`;
            }

            return (
              <div key={d.nombre} className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                        isTiedWithTop
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                      title={
                        isTied
                          ? "Posición compartida por saldo idéntico"
                          : `Puesto #${index + 1}`
                      }
                    >
                      {rankDisplay}
                    </span>
                    <span className="text-on-surface truncate font-bold">{d.nombre}</span>
                    <span className="text-[10px] text-on-surface-variant font-normal shrink-0 hidden sm:inline">
                      ({d.prestamos} {d.prestamos === 1 ? "préstamo" : "préstamos"})
                    </span>
                    {isTied && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium shrink-0"
                        title="Empate en saldo. Desempate prioritario por morosidad o antigüedad del préstamo."
                      >
                        Empate {pctOfTotal}%
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs font-extrabold text-on-surface shrink-0 text-right">
                    {money(d.saldo)}
                  </span>
                </div>
                {/* Barra visual de proporción */}
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
