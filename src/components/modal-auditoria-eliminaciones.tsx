"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  History,
  RotateCcw,
  Trash2,
  ArrowLeftRight,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Landmark,
  HandCoins,
} from "lucide-react";
import { money } from "@/lib/dashboard-context";
import { formatDateEs } from "@/lib/format-date";
import {
  getAuditoriaEliminaciones,
  type RegistroAuditoriaEliminacion,
} from "@/app/(dashboard)/movimientos/actions";

interface ModalAuditoriaEliminacionesProps {
  isOpen: boolean;
  onClose: () => void;
  espacioId: string;
}

interface DetalleAuditoriaSnapshot {
  tipo?: string;
  ajuste_sentido?: string | null;
  monto?: number;
  monto_total?: number;
  monto_principal?: number;
  monto_interes?: number;
  cuenta_dinero_id?: string;
  cuenta_nombre?: string | null;
  prestamo_id?: string;
  prestamo_nombre?: string | null;
  pago_prestamo_id?: string;
  transfer_group_id?: string;
  ocurrido_en?: string;
  recibido_en?: string;
  descripcion?: string | null;
}

export function ModalAuditoriaEliminaciones({
  isOpen,
  onClose,
  espacioId,
}: ModalAuditoriaEliminacionesProps) {
  const [registros, setRegistros] = useState<RegistroAuditoriaEliminacion[]>([]);
  const [loading, setLoading] = useState(false);

  const cargarAuditoria = useCallback(async () => {
    if (!espacioId) return;
    setLoading(true);
    try {
      const data = await getAuditoriaEliminaciones(espacioId, 50);
      setRegistros(data);
    } catch (err) {
      console.error("Error al cargar la bitácora de auditoría:", err);
    } finally {
      setLoading(false);
    }
  }, [espacioId]);

  useEffect(() => {
    if (isOpen) {
      cargarAuditoria();
    }
  }, [isOpen, cargarAuditoria]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera del Modal */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <History className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface">
                  Bitácora de eliminaciones y reversiones
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Historial de cobros deshechos y movimientos eliminados para control contable.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={cargarAuditoria}
                disabled={loading}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-40"
                title="Actualizar bitácora"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido / Listado */}
          <div className="overflow-y-auto pr-1 flex-1 space-y-2.5 min-h-[220px]">
            {loading && registros.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-2.5">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <span className="text-xs font-medium">Consultando registros de auditoría...</span>
              </div>
            ) : registros.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-2 px-4">
                <div className="w-11 h-11 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant/60">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-on-surface">Sin eliminaciones registradas</p>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  No se han registrado cobros anulados ni movimientos eliminados recientemente en este espacio de trabajo.
                </p>
              </div>
            ) : (
              registros.map((item) => {
                let detalle: DetalleAuditoriaSnapshot = {};
                try {
                  if (item.valor_anterior) {
                    detalle = JSON.parse(item.valor_anterior);
                  }
                } catch {
                  detalle = {};
                }

                const esCobro = item.campo_modificado === "anulacion_cobro";
                const esTransferencia = item.campo_modificado === "eliminacion_transferencia";
                const montoDisplay = Number(detalle.monto_total ?? detalle.monto ?? 0);
                const fechaOperacion = detalle.recibido_en || detalle.ocurrido_en;

                return (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 rounded-xl border border-surface-container-high/60 bg-surface-container-lowest hover:border-surface-container-high transition-colors space-y-2 text-xs"
                  >
                    {/* Fila superior: Tipo de acción y Fecha/Hora del borrado */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {esCobro ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                            <RotateCcw className="w-3 h-3" /> Cobro revertido
                          </span>
                        ) : esTransferencia ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                            <ArrowLeftRight className="w-3 h-3" /> Transferencia anulada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                            <Trash2 className="w-3 h-3" /> Movimiento eliminado
                          </span>
                        )}

                        <span className="text-[10px] text-on-surface-variant font-mono">
                          {formatDateEs(item.created_at)} ·{" "}
                          {new Date(item.created_at).toLocaleTimeString("es", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        {money(montoDisplay)}
                      </div>
                    </div>

                    {/* Fila media: Desglose contable (Interés revertido y capital restaurado) */}
                    {esCobro && (
                      <div className="p-2.5 rounded-lg bg-surface-container-low/70 border border-surface-container-high/40 flex flex-wrap items-center gap-2">
                        {typeof detalle.monto_interes === "number" && detalle.monto_interes > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                            Interés descontado: {money(Number(detalle.monto_interes))}
                          </span>
                        )}
                        {typeof detalle.monto_principal === "number" && detalle.monto_principal > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-on-surface-variant bg-surface-container border border-surface-container-high/60">
                            Capital restaurado al préstamo: {money(Number(detalle.monto_principal))}
                          </span>
                        )}
                        {detalle.prestamo_nombre && (
                          <span className="text-[11px] text-on-surface font-medium flex items-center gap-1">
                            <HandCoins className="w-3 h-3 text-primary" />
                            {detalle.prestamo_nombre}
                          </span>
                        )}
                        {detalle.cuenta_nombre && (
                          <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                            <Landmark className="w-3 h-3 text-on-surface-variant/70" />
                            {detalle.cuenta_nombre}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Concepto original si existe */}
                    {detalle.descripcion && (
                      <p className="text-[11px] text-on-surface truncate">
                        <strong className="text-on-surface-variant">Concepto:</strong>{" "}
                        {detalle.descripcion}
                      </p>
                    )}

                    {/* Fila inferior: Usuario que ejecutó la eliminación y motivo */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-container-low text-[11px] text-on-surface-variant">
                      <span>
                        Ejecutado por:{" "}
                        <strong className="text-on-surface">
                          {item.perfiles?.nombre_mostrado || "Usuario"}
                        </strong>
                        {fechaOperacion && ` (Fecha del movimiento: ${formatDateEs(fechaOperacion)})`}
                      </span>
                      {item.motivo && (
                        <span className="italic truncate max-w-xs text-right hidden sm:inline">
                          {item.motivo}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie del modal */}
          <div className="pt-2 border-t border-surface-container-low flex items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] text-on-surface-variant font-medium">
              {registros.length === 1
                ? "1 registro auditado"
                : `${registros.length} registros auditados`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
