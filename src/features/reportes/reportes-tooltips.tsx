"use client";

import { useState, useRef, useEffect } from "react";
import { money } from "@/lib/dashboard-context";

// ─── Tooltip Personalizado para Recharts (Adaptable a tema claro/oscuro) ──
export interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    stroke?: string;
    fill?: string;
    color?: string;
  }>;
  label?: string | number;
  coordinate?: { x: number; y: number };
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
}

export function CustomTooltip({
  active,
  payload,
  label,
  coordinate,
  viewBox,
}: CustomTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [viewportFlip, setViewportFlip] = useState(false);

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.right > (window.innerWidth - 12)) {
        setViewportFlip(true);
      } else if (rect.left < 12) {
        setViewportFlip(false);
      }
    }
  }, [coordinate?.x]);

  if (!active || !payload || !payload.length) return null;

  const chartWidth = viewBox?.width ?? 320;
  const chartX = viewBox?.x ?? 0;
  const isNearRight = Boolean(
    viewportFlip || (coordinate && (coordinate.x > chartX + chartWidth * 0.48))
  );

  return (
    <div
      ref={tooltipRef}
      style={{
        transform: isNearRight ? "translateX(calc(-100% - 28px))" : undefined,
      }}
      className="bg-surface-container-lowest border border-surface-container-high/90 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[160px] max-w-[260px] pointer-events-none select-none transition-transform duration-75"
    >
      <p className="font-heading font-extrabold text-on-surface text-sm border-b border-surface-container-low pb-1">
        {label}
      </p>
      {payload.map((entry, index: number) => (
        <div key={`item-${index}`} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.stroke || entry.fill || entry.color }}
            />
            <span className="text-on-surface-variant font-medium">{entry.name}:</span>
          </div>
          <span className="font-mono font-bold text-on-surface">
            {money(entry.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Tooltip Personalizado para la Proyección de Flujo Neto ─────────────────
export interface ProyeccionPayloadItem {
  payload?: {
    dia?: number;
    diaLabel?: string;
    periodo?: string;
    flujoDia?: number;
    acumulado?: number;
    cobrado?: number;
    programado?: number;
    total?: number;
    esHoy?: boolean;
    esPasado?: boolean;
    esFuturo?: boolean;
    detalles?: Array<{ nombre: string; deudor: string; monto: number }>;
  };
}

export interface ProyeccionTooltipProps {
  active?: boolean;
  payload?: ProyeccionPayloadItem[];
  label?: string | number;
  coordinate?: { x: number; y: number };
  viewBox?: { x?: number; y?: number; width?: number; height?: number };
}

export function ProyeccionTooltip({
  active,
  payload,
  label,
  coordinate,
  viewBox,
}: ProyeccionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [viewportFlip, setViewportFlip] = useState(false);

  useEffect(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      if (rect.right > (window.innerWidth - 12)) {
        setViewportFlip(true);
      } else if (rect.left < 12) {
        setViewportFlip(false);
      }
    }
  }, [coordinate?.x]);

  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  const titulo = item.periodo || `Día ${item.dia ?? label}`;

  // Si el cursor se desplaza a la mitad derecha del gráfico (o se acerca al margen derecho),
  // invertimos el popup hacia la izquierda del cursor para que nunca se desborde ni se corte de la pantalla.
  const chartWidth = viewBox?.width ?? 320;
  const chartX = viewBox?.x ?? 0;
  const isNearRight = Boolean(
    viewportFlip || (coordinate && (coordinate.x > chartX + chartWidth * 0.48))
  );

  return (
    <div
      ref={tooltipRef}
      style={{
        transform: isNearRight ? "translateX(calc(-100% - 28px))" : undefined,
      }}
      className="bg-surface-container-lowest border border-surface-container-high/90 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[200px] max-w-[280px] pointer-events-none select-none transition-transform duration-75"
    >
      <div className="flex items-center justify-between border-b border-surface-container-low pb-1">
        <span className="font-heading font-bold text-on-surface text-sm">
          {titulo}
        </span>
        {item.esHoy && (
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded border border-primary/20">
            Hoy
          </span>
        )}
      </div>

      <div className="pt-0.5 space-y-1 text-xs">
        {item.flujoDia !== undefined && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant font-medium">Cobro del día:</span>
            <span className="font-mono font-bold text-on-surface">
              {money(item.flujoDia)}
            </span>
          </div>
        )}

        {item.total !== undefined && item.periodo && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant font-medium">Flujo estimado:</span>
            <span className="font-mono font-bold text-primary">
              {money(item.total)}
            </span>
          </div>
        )}

        {item.acumulado !== undefined && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant font-medium">Acumulado mes:</span>
            <span className="font-mono font-bold text-primary">
              {money(item.acumulado)}
            </span>
          </div>
        )}

        {item.detalles && item.detalles.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-surface-container-low">
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Vencimientos del día:
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {item.detalles.map((d, idx) => (
                <div key={idx} className="text-[11px] flex items-center justify-between gap-2">
                  <span className="text-on-surface truncate font-medium">
                    {d.deudor || d.nombre}
                  </span>
                  <span className="font-mono text-primary font-semibold shrink-0">
                    {money(d.monto)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
