"use client";

import { Landmark, WalletCards } from "lucide-react";
import { money } from "@/lib/dashboard-context";

export interface AccountLiquidityItem {
  nombre: string;
  tipo: string;
  saldo: number;
  color?: string;
}

const PALETA_CUENTAS = [
  "#006948", // Esmeralda FinPal
  "#0284c7", // Azul Océano
  "#7c3aed", // Violeta Profundo
  "#f59e0b", // Ámbar Cálido
  "#0d9488", // Teal / Turquesa
  "#e11d48", // Carmesí / Rosa
  "#4f46e5", // Índigo
  "#ea580c", // Naranja Quemado
  "#0891b2", // Cian
  "#65a30d", // Lima Intenso
  "#c026d3", // Fucsia
  "#059669", // Verde Menta
  "#9333ea", // Púrpura
  "#d97706", // Ocre / Dorado
  "#2563eb", // Azul Real
  "#db2777", // Rosa Vivo
];

function getAccountColor(index: number): string {
  if (index < PALETA_CUENTAS.length) {
    return PALETA_CUENTAS[index];
  }
  const hue = Math.round((index * 137.508) % 360);
  return `hsl(${hue}, 70%, 45%)`;
}

export function WidgetLiquidezCuentas({
  liquidityByAccount,
  totalLiquidez,
}: {
  liquidityByAccount: AccountLiquidityItem[];
  totalLiquidez: number;
}) {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs h-full flex flex-col justify-between min-w-0">
      <div className="flex items-center justify-between pb-3 border-b border-surface-container-low mb-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Landmark className="w-4 h-4 text-primary shrink-0" />
            <h2 className="font-heading text-base font-bold text-on-surface truncate">
              Distribución de Liquidez por Cuenta
            </h2>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
            Ubicación del efectivo y fondos disponibles en bancos o billeteras.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-1 min-w-0">
        {liquidityByAccount.length === 0 ? (
          <div className="text-center py-8 text-xs text-on-surface-variant">
            No hay cuentas activas registradas.
          </div>
        ) : (
          liquidityByAccount.map((c, index) => {
            const totalLiq = totalLiquidez || 1;
            const pct = totalLiq > 0 ? (c.saldo / totalLiq) * 100 : 0;
            const barColor = c.color || getAccountColor(index);
            return (
              <div key={c.nombre} className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform hover:scale-110"
                      style={{ backgroundColor: barColor }}
                      aria-hidden="true"
                    />
                    <WalletCards className="w-3.5 h-3.5 shrink-0" style={{ color: barColor }} />
                    <span className="text-on-surface font-bold truncate">{c.nombre}</span>
                    <span className="text-[10px] text-on-surface-variant capitalize font-normal shrink-0 hidden sm:inline">
                      · {c.tipo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-extrabold text-on-surface text-right">
                      {money(c.saldo)}
                    </span>
                    <span
                      className="text-[10px] font-bold w-9 text-right font-mono"
                      style={{ color: barColor }}
                    >
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                {/* Barra visual de progreso con color distintivo por cuenta */}
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                    }}
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
