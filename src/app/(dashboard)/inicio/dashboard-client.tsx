"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowRight,
  BadgeCheck,
  HandCoins,
  Loader2,
  Percent,
  Plus,
  ReceiptText,
  WalletCards,
  AlertCircle,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Scale,
  ArrowLeftRight,
  Palette,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  FileText,
  Copy,
  Search,
  Sliders,
  History,
  Sparkles,
  ChevronUp,
  Globe,
  Clock,
  LayoutGrid,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";
import {
  useDashboard,
  money,
  loanBalance,
  monthlyInterest,
  rel,
  type Contacto,
  type Cuenta,
  type Prestamo,
  type Pago,
  type Movimiento,
} from "@/lib/dashboard-context";
import { fixSpanishEncoding } from "@/lib/clean-text";
import { ContactAvatar } from "@/components/contact-avatar";
import { useEspacio } from "@/lib/espacio-context";
import { actualizarEstadoPrestamo } from "@/app/(dashboard)/prestamos/actions";
import { formatDateEs, formatMonthYear } from "@/lib/format-date";
import { ReportesBiDashboard } from "@/features/reportes/reportes-bi-dashboard";
import { SlideToConfirm, DashboardRouteSkeleton } from "@/components/dashboard-shell";
import {
  actualizarCuenta,
  getAuditoriaEntidad,
  eliminarODesactivarCuenta,
  reactivarCuenta,
  getCuentasArchivadasConSaldo,
} from "@/app/(dashboard)/cuentas/actions";
import { actualizarZonaHorariaEspacio } from "@/app/(dashboard)/espacios/actions";
import { eliminarMiCuentaDefinitivamente } from "@/app/(dashboard)/configuracion/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";


export type PageName =
  | "inicio"
  | "contactos"
  | "prestamos"
  | "pagos"
  | "cuentas"
  | "movimientos"
  | "reportes"
  | "configuracion";

// ─── Componente Conmutador de Vistas Principales ─────────────────────────────

export default function DashboardClient({
  page = "inicio",
}: {
  page?: PageName;
  userEmail?: string;
}) {
  const {
    cuentas,
    prestamos,
    contactos,
    movimientos,
    pagos,
    totals,
    loading,
    error,
    openModal,
    loadData,
    preferencias,
    guardarPreferencias,
    setSuccessNotice,
  } = useDashboard();
  const { espacioId, zonaHoraria, setZonaHoraria } = useEspacio();
  const [notaModal, setNotaModal] = useState<{ titulo: string; subtitulo?: string; texto: string } | null>(null);

  const handleVerNota = (titulo: string, subtitulo?: string, texto?: string | null) => {
    if (texto && texto.trim()) {
      setNotaModal({ titulo, subtitulo, texto: texto.trim() });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
        <DashboardRouteSkeleton path={`/${page}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-error-container text-on-error-container border border-error/20">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        key={page}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-7xl mx-auto w-full flex flex-col gap-6"
      >
        {page === "inicio" && (
          <DashboardView
            cuentas={cuentas}
            prestamos={prestamos}
            movimientos={movimientos}
            totals={totals}
            openModal={(m) => openModal(m)}
            onVerNota={handleVerNota}
          />
        )}
        {page === "contactos" && (
          <ContactosView
            contactos={contactos}
            prestamos={prestamos}
            openModal={() => openModal("contact")}
            onVerNota={handleVerNota}
          />
        )}
        {page === "prestamos" && (
          <PrestamosView
            prestamos={prestamos}
            openModal={() => openModal("loan")}
            onVerNota={handleVerNota}
            onStatusChange={async (prestamoId, estado) => {
              if (!espacioId) return;
              const result = await actualizarEstadoPrestamo(prestamoId, espacioId, estado);
              if (result.error) {
                setSuccessNotice(result.error);
                return;
              }
              await loadData();
            }}
          />
        )}
        {page === "pagos" && (
          <PagosView
            pagos={pagos}
            openModal={() => openModal("payment")}
            onVerNota={handleVerNota}
          />
        )}
        {page === "cuentas" && (
          <CuentasView
            cuentas={cuentas}
            espacioId={espacioId ?? ""}
            openModal={() => openModal("account")}
            loadData={loadData}
            setSuccessNotice={setSuccessNotice}
          />
        )}
        {page === "movimientos" && (
          <MovimientosView
            movimientos={movimientos}
            openModal={() => openModal("movement")}
            onVerNota={handleVerNota}
          />
        )}
        {page === "reportes" && (
          <ReportesBiDashboard
            totals={totals}
            prestamos={prestamos}
            pagos={pagos}
            cuentas={cuentas}
            movimientos={movimientos}
            contactos={contactos}
            preferencias={preferencias}
          />
        )}
        {page === "configuracion" && (
          <ConfiguracionView
            key={`${preferencias.colorAcento}-${preferencias.tasaInteresPredeterminada}-${zonaHoraria}`}
            preferencias={preferencias}
            guardarPreferencias={guardarPreferencias}
            espacioId={espacioId ?? ""}
            zonaHoraria={zonaHoraria}
            setZonaHoraria={setZonaHoraria}
            setSuccessNotice={setSuccessNotice}
          />
        )}
      </motion.div>

      {notaModal && (
        <ModalDetalleNota
          titulo={notaModal.titulo}
          subtitulo={notaModal.subtitulo}
          texto={notaModal.texto}
          onClose={() => setNotaModal(null)}
        />
      )}
    </>
  );
}


// ─── Configuración de Globos/Badges para Tipos de Movimiento ─────────────────

interface TipoMovimientoBadge {
  label: string;
  badgeClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getTipoMovimientoBadge(tipo: string, ajusteSentido?: string | null): TipoMovimientoBadge {
  switch (tipo) {
    case "ingreso":
      return {
        label: "Ingreso",
        badgeClass: "badge-ingreso",
        Icon: ArrowDownLeft,
      };
    case "gasto":
      return {
        label: "Gasto",
        badgeClass: "badge-gasto",
        Icon: ArrowUpRight,
      };
    case "entrega_prestamo":
      return {
        label: "Préstamo entregado",
        badgeClass: "badge-entrega",
        Icon: HandCoins,
      };
    case "pago_prestamo":
      return {
        label: "Cobro de préstamo",
        badgeClass: "badge-cobro",
        Icon: CheckCircle2,
      };
    case "transferencia_entrada":
      return {
        label: "Transferencia ↓",
        badgeClass: "badge-entrada",
        Icon: ArrowDownLeft,
      };
    case "transferencia_salida":
      return {
        label: "Transferencia ↑",
        badgeClass: "badge-salida",
        Icon: ArrowUpRight,
      };
    case "ajuste":
      return {
        label: ajusteSentido ? `Ajuste (${ajusteSentido})` : "Ajuste",
        badgeClass: "badge-ajuste",
        Icon: Scale,
      };
    default:
      return {
        label: tipo.charAt(0).toUpperCase() + tipo.slice(1).replace("_", " "),
        badgeClass: "badge-neutral",
        Icon: ArrowLeftRight,
      };
  }
}

// ─── Modal para Detalle de Notas Flotante ──────────────────────────────────

export function ModalDetalleNota({
  titulo,
  subtitulo,
  texto,
  onClose,
}: {
  titulo: string;
  subtitulo?: string;
  texto: string;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-bold text-on-surface truncate">{titulo}</h2>
              {subtitulo && (
                <p className="text-xs text-on-surface-variant truncate">{subtitulo}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 max-h-[50vh]">
          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-surface-container-high/50 text-sm text-on-surface whitespace-pre-wrap break-words leading-relaxed font-sans select-text">
            {texto}
          </div>
        </div>

        <div className="pt-2 border-t border-surface-container-low flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopiar}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
          >
            {copiado ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-on-surface-variant" />
                <span>Copiar nota</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Personalización del Dashboard ──────────────────────────────────

type WidgetKey = "kpis" | "prestamos" | "movimientos" | "cuentas";

interface WidgetItem {
  id: WidgetKey;
  label: string;
  description: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
  { id: "kpis", label: "Métricas generales (KPIs)", description: "Total en cuentas, Por cobrar, Saldado e Intereses", visible: true },
  { id: "prestamos", label: "Deudores y préstamos recientes", description: "Tabla y tarjetas con estado de abonos y vencimientos", visible: true },
  { id: "movimientos", label: "Movimientos recientes", description: "Últimas transacciones registradas en el espacio", visible: true },
  { id: "cuentas", label: "Resumen de cuentas de dinero", description: "Visualización rápida de tus cuentas y fondos", visible: false },
];

function ModalPersonalizarDashboard({
  widgets,
  onSave,
  onClose,
}: {
  widgets: WidgetItem[];
  onSave: (newWidgets: WidgetItem[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<WidgetItem[]>(widgets);

  const toggleVisible = (id: WidgetKey) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item))
    );
  };

  const move = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    setItems(copy);
  };

  const handleApply = () => {
    onSave(items);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-on-surface">Personalizar panel</h2>
              <p className="text-xs text-on-surface-variant">Elige qué tarjetas ver y su orden en tu inicio.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                item.visible
                  ? "bg-surface-container-lowest border-surface-container-high/80 shadow-2xs"
                  : "bg-surface-container-low/40 border-dashed border-surface-container-high/50 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  id={`widget-${item.id}`}
                  checked={item.visible}
                  onChange={() => toggleVisible(item.id)}
                  className="w-4 h-4 rounded text-primary border-surface-container-high focus:ring-primary cursor-pointer"
                />
                <label htmlFor={`widget-${item.id}`} className="cursor-pointer min-w-0">
                  <span className="font-semibold text-xs text-on-surface block truncate">{item.label}</span>
                  <span className="text-[11px] text-on-surface-variant block truncate">{item.description}</span>
                </label>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(index, "up")}
                  disabled={index === 0}
                  className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="Mover arriba"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, "down")}
                  disabled={index === items.length - 1}
                  className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                  title="Mover abajo"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-surface-container-low flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setItems((prev) => prev.map((w) => ({ ...w, visible: true })))}
              className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
            >
              Mostrar todos
            </button>
            <span className="text-on-surface-variant/40">·</span>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.map((w) => ({ ...w, visible: false })))}
              className="text-[11px] text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
            >
              Limpiar panel
            </button>
            <span className="text-on-surface-variant/40">·</span>
            <button
              type="button"
              onClick={() => setItems(DEFAULT_WIDGETS)}
              className="text-[11px] text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
            >
              Por defecto
            </button>
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componentes de Vistas por Página ─────────────────────────────────────────

function DashboardView({
  cuentas,
  prestamos,
  movimientos,
  totals,
  openModal,
  onVerNota,
}: {
  cuentas: Cuenta[];
  prestamos: Prestamo[];
  movimientos: Movimiento[];
  totals: ReturnType<typeof Object.assign>;
  openModal: (m: "loan" | "payment") => void;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  const [widgets, setWidgets] = useState<WidgetItem[]>(() => {
    try {
      const saved = localStorage.getItem("finpal_dashboard_widgets_v1");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WIDGETS;
  });
  const [modalPersonalizar, setModalPersonalizar] = useState(false);

  const saveWidgets = (newWidgets: WidgetItem[]) => {
    setWidgets(newWidgets);
    try {
      localStorage.setItem("finpal_dashboard_widgets_v1", JSON.stringify(newWidgets));
    } catch {}
  };

  const upcoming = prestamos.filter((p) => p.estado !== "pagado").slice(0, 5);
  const visibleWidgets = widgets.filter((w) => w.visible);

  return (
    <div className="space-y-6">
      {/* Cabecera del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-1">
            <span className="inline-flex items-center gap-1.5 text-primary bg-secondary-container/40 px-2.5 py-0.5 rounded-full border border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Panel de control financiero
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">Panel de control</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Resumen consolidado de tus finanzas y cartera de préstamos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setModalPersonalizar(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold text-xs transition-all shadow-2xs cursor-pointer"
            title="Personalizar tarjetas que se muestran en el panel"
          >
            <Sliders className="w-4 h-4 text-primary" />
            <span>Personalizar panel</span>
          </button>
          <button
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold text-xs transition-all shadow-2xs cursor-pointer"
            type="button"
            onClick={() => openModal("payment")}
          >
            <ReceiptText className="w-4 h-4 text-primary" />
            <span>Registrar cobro</span>
          </button>
          <button
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-xs cursor-pointer"
            type="button"
            onClick={() => openModal("loan")}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo préstamo</span>
          </button>
        </div>
      </div>

      {/* Si el usuario desactivó todas las tarjetas, mostrar canvas limpio con opción de agregar */}
      {visibleWidgets.length === 0 ? (
        <div className="bg-surface-container-lowest border-2 border-dashed border-surface-container-high/80 rounded-3xl p-8 sm:p-14 text-center max-w-xl mx-auto my-6 space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-2xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-heading text-lg sm:text-xl font-bold text-on-surface">Tu panel está despejado</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              Diseña tu propio inicio agregando únicamente las tarjetas y reportes que desees ver día a día.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalPersonalizar(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Añadir tarjetas al panel</span>
          </button>
        </div>
      ) : (
        /* Renderizado dinámico de widgets según el orden y visibilidad configurados */
        widgets.filter((w) => w.visible).map((w) => {
          if (w.id === "kpis") {
            return (
              <div key={w.id} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {[
                  { label: "Total en cuentas", value: totals.available, icon: WalletCards, colorClass: "kpi-icon-emerald", sub: "Saldo disponible" },
                  { label: "Por cobrar", value: totals.pending, icon: HandCoins, colorClass: "kpi-icon-amber", sub: `${totals.activeLoansCount} pré${totals.activeLoansCount === 1 ? 'stamo activo' : 'stamos activos'}` },
                  { label: "Ya cobrado", value: totals.collected, icon: BadgeCheck, colorClass: "kpi-icon-teal", sub: `${totals.paidLoansCount} saldado${totals.paidLoansCount !== 1 ? 's' : ''}` },
                  { label: "Interés cobrado", value: totals.interestPaid, icon: Percent, colorClass: "kpi-icon-blue", sub: "Acumulado real" },
                ].map((kpi, i) => {
                  const Ic = kpi.icon;
                  return (
                    <motion.div
                      className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 border border-surface-container-high/70 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
                      key={kpi.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono truncate">{kpi.label}</span>
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${kpi.colorClass} flex items-center justify-center shrink-0`}><Ic className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                      </div>
                      <div className="mt-2 sm:mt-3">
                        <div className="font-heading text-lg sm:text-2xl font-extrabold text-on-surface tracking-tight truncate">{money(kpi.value)}</div>
                        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-surface-container-low text-[10px] sm:text-[11px] text-on-surface-variant font-medium truncate">{kpi.sub}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          }

          if (w.id === "prestamos") {
            return (
              <div key={w.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
                  <div className="flex items-center gap-2.5">
                    <WalletCards className="w-5 h-5 text-primary" />
                    <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface">
                      Deudores y Préstamos Recientes
                    </h2>
                  </div>
                  <Link
                    href="/prestamos"
                    className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-mono text-xs font-semibold border border-surface-container-high/40 hover:bg-surface-container-high transition-colors"
                  >
                    Ver todos ({prestamos.length})
                  </Link>
                </div>

                {prestamos.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-6">No hay préstamos registrados aún.</p>
                ) : (
                  <>
                    {/* Vista Móvil */}
                    <div className="sm:hidden space-y-3">
                      {(upcoming.length > 0 ? upcoming : prestamos.slice(0, 5)).map((p) => {
                        const contactoNombre = rel(p.contactos)?.nombre ?? "—";
                        const balance = loanBalance(p);
                        const isLate = p.estado === "atrasado";
                        const isPaid = p.estado === "pagado";
                        return (
                          <div
                            key={p.id}
                            className="bg-surface-container-low/50 border border-surface-container-high/60 rounded-xl p-3.5 space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <ContactAvatar
                                  name={contactoNombre}
                                  size={34}
                                  className="rounded-full shadow-2xs shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-xs sm:text-sm text-on-surface truncate leading-tight">{contactoNombre}</p>
                                  <p className="text-[11px] text-on-surface-variant truncate">{p.nombre}</p>
                                  {(p.fecha_inicio || p.created_at) && (
                                    <p className="inline-flex items-center gap-1 text-[10px] text-on-surface-variant/80 mt-0.5">
                                      <Calendar className="w-2.5 h-2.5 text-outline shrink-0" />
                                      <span>Inició: {formatDateEs(p.fecha_inicio || p.created_at)}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {p.notas && (
                                  <button
                                    type="button"
                                    onClick={() => onVerNota("Notas del préstamo", `${contactoNombre} · ${p.nombre}`, p.notas)}
                                    className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                    title="Ver nota completa"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-primary" />
                                  </button>
                                )}
                                {isLate ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold badge-atrasado">
                                    Con atraso
                                  </span>
                                ) : isPaid ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold badge-saldado">
                                    Saldado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold badge-al-dia">
                                    Al día
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-high/50 text-[11px]">
                              <div>
                                <span className="text-on-surface-variant text-[10px] block uppercase font-medium">Por cobrar</span>
                                <span className="font-mono font-bold text-on-surface text-xs whitespace-nowrap">
                                  {money(balance > 0 ? balance : Number(p.monto_principal))}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-on-surface-variant text-[10px] block uppercase font-medium">Vencimiento</span>
                                <span className={`font-medium ${isLate ? "text-error font-bold" : "text-on-surface"}`}>
                                  {p.vence_hoy
                                    ? "Hoy"
                                    : p.fecha_proximo_pago
                                    ? formatDateEs(p.fecha_proximo_pago)
                                    : `Día ${p.dia_pago}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Vista Desktop / Tablet */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left text-sm min-w-[580px]">
                        <thead>
                          <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                            <th className="py-3 px-3.5 rounded-l-lg">Contacto</th>
                            <th className="py-3 px-3.5">Capital</th>
                            <th className="py-3 px-3.5">Interés</th>
                            <th className="py-3 px-3.5">Próximo Pago</th>
                            <th className="py-3 px-3.5 rounded-r-lg text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="text-on-surface divide-y divide-surface-container-low">
                          {(upcoming.length > 0 ? upcoming : prestamos.slice(0, 5)).map((p) => {
                            const contactoNombre = rel(p.contactos)?.nombre ?? "—";
                            const balance = loanBalance(p);
                            const isLate = p.estado === "atrasado";
                            const isPaid = p.estado === "pagado";
                            return (
                              <tr
                                key={p.id}
                                className="hover:bg-surface-container-low/40 transition-colors"
                              >
                                <td className="py-3.5 px-3.5 flex items-center gap-3">
                                  <ContactAvatar
                                    name={contactoNombre}
                                    size={36}
                                    className="rounded-full shadow-2xs shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="font-semibold text-sm leading-snug truncate">{contactoNombre}</p>
                                      {p.notas && (
                                        <button
                                          type="button"
                                          onClick={() => onVerNota("Notas del préstamo", `${contactoNombre} · ${p.nombre}`, p.notas)}
                                          className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                                          title="Ver nota completa"
                                        >
                                          <FileText className="w-3.5 h-3.5 text-primary" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-on-surface-variant truncate">{p.nombre}</p>
                                    {(p.fecha_inicio || p.created_at) && (
                                      <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant/85 font-normal mt-0.5 whitespace-nowrap">
                                        <Calendar className="w-3 h-3 text-outline shrink-0" />
                                        <span>Inició: {formatDateEs(p.fecha_inicio || p.created_at)}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 px-3.5 font-mono font-semibold text-sm whitespace-nowrap">
                                  {money(balance > 0 ? balance : Number(p.monto_principal))}
                                </td>
                                <td className="py-3.5 px-3.5 font-mono text-xs text-primary font-medium whitespace-nowrap">
                                  {p.cobra_interes ? (
                                    <span>+{p.tasa_interes_mensual}% mes ({money(monthlyInterest(p))})</span>
                                  ) : (
                                    <span className="text-on-surface-variant font-sans">Sin interés</span>
                                  )}
                                </td>
                                <td
                                  className={`py-3.5 px-3.5 text-xs ${
                                    isLate ? "text-error font-semibold" : "text-on-surface-variant"
                                  }`}
                                >
                                  {p.vence_hoy
                                    ? "Hoy (Día de cobro)"
                                    : p.fecha_proximo_pago
                                    ? formatDateEs(p.fecha_proximo_pago)
                                    : `Día ${p.dia_pago}`}
                                </td>
                                <td className="py-3.5 px-3.5 text-right">
                                  {isLate ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-atrasado">
                                      Con atraso
                                    </span>
                                  ) : isPaid ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-saldado">
                                      Saldado
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-al-dia">
                                      Al día
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          }

          if (w.id === "movimientos" && movimientos.length > 0) {
            return (
              <div key={w.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
                  <h2 className="font-heading text-base font-bold text-on-surface">Movimientos recientes</h2>
                  <Link href="/movimientos" className="text-xs font-bold text-primary hover:underline">Ver todos</Link>
                </div>
                <div className="space-y-2">
                  {movimientos.slice(0, 5).map((m) => {
                    const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
                      || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
                    const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
                    const BadgeIcon = badge.Icon;
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-surface-container-low/50 last:border-0">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl border shrink-0 ${badge.badgeClass}`}>
                            <BadgeIcon className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-semibold text-on-surface truncate">{fixSpanishEncoding(m.descripcion || badge.label)}</p>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${badge.badgeClass}`}>
                                {badge.label}
                              </span>
                              {m.descripcion && m.descripcion.length > 25 && (
                                <button
                                  type="button"
                                  onClick={() => onVerNota("Detalle de movimiento", badge.label, m.descripcion)}
                                  className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                                >
                                  Ver más
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-on-surface-variant truncate">{formatDateEs(m.ocurrido_en)} · {rel(m.cuentas_dinero)?.nombre}</p>
                          </div>
                        </div>
                        <span className={`font-mono text-xs font-bold shrink-0 whitespace-nowrap ${isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"}`}>
                          {isPositive ? "+" : "−"}{money(Number(m.monto))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (w.id === "cuentas" && cuentas.length > 0) {
            return (
              <div key={w.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
                  <h2 className="font-heading text-base font-bold text-on-surface">Cuentas de dinero</h2>
                  <Link href="/cuentas" className="text-xs font-bold text-primary hover:underline">Ver todas</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cuentas.slice(0, 3).map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl border border-surface-container-high/60 bg-surface-container-low/40 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-on-surface-variant">{c.tipo}</span>
                        <p className="font-bold text-sm text-on-surface">{c.nombre}</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-primary">{money(c.saldo)}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return null;
        })
      )}

      {/* Modal para personalizar el panel */}
      {modalPersonalizar && (
        <ModalPersonalizarDashboard
          widgets={widgets}
          onSave={saveWidgets}
          onClose={() => setModalPersonalizar(false)}
        />
      )}
    </div>
  );
}

function ContactosView({
  contactos,
  prestamos,
  openModal,
  onVerNota,
}: {
  contactos: Contacto[];
  prestamos: Prestamo[];
  openModal: () => void;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60"
      >
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Contactos & Deudores</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Directorio de personas y seguimiento del estado de deuda.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Nuevo contacto</span>
        </button>
      </motion.div>
      {/* Vista Móvil (Tarjetas de contactos) */}
      <div className="sm:hidden space-y-2.5">
        {contactos.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
            Sin contactos aún. Crea el primero.
          </div>
        ) : (
          contactos.map((c, i) => {
            const allLoans = prestamos.filter((l) => rel(l.contactos)?.id === c.id);
            const activeLoans = allLoans.filter((l) => l.estado === "activo" || l.estado === "atrasado");
            const paidLoans = allLoans.filter((l) => l.estado === "pagado");
            const balance = activeLoans.reduce((sum, l) => sum + loanBalance(l), 0);
            const isLate = activeLoans.some((l) => l.estado === "atrasado");
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: Math.min(i * 0.03, 0.25) }}
                className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ContactAvatar name={c.nombre} size={38} className="rounded-full shadow-xs shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate">{c.nombre}</h4>
                      {c.telefono && (
                        <a href={`tel:${c.telefono}`} className="text-xs text-primary font-medium block truncate hover:underline">
                          {c.telefono}
                        </a>
                      )}
                      {c.email && <span className="text-[11px] text-on-surface-variant block truncate">{c.email}</span>}
                    </div>
                  </div>
                  <div>
                    {activeLoans.length > 0 ? isLate ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-atrasado inline-flex items-center">Con atraso</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-al-dia inline-flex items-center">Al día</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-saldado inline-flex items-center">Sin deuda</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-low text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Préstamos</span>
                    <span className="font-semibold text-on-surface">
                      {allLoans.length} {allLoans.length === 1 ? "préstamo" : "préstamos"}
                      {paidLoans.length > 0 && <span className="text-[10px] text-on-surface-variant font-normal"> ({paidLoans.length} saldados)</span>}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-on-surface-variant block">Total por cobrar</span>
                    <span className="font-mono font-bold text-sm text-primary whitespace-nowrap">{money(balance)}</span>
                  </div>
                </div>

                {c.notas && (
                  <div className="pt-2 border-t border-surface-container-low flex justify-start">
                    <button
                      type="button"
                      onClick={() => onVerNota("Notas del contacto", c.nombre, c.notas)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[11px] font-medium border border-surface-container-high/60 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Ver nota completa</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Vista Desktop / Tablet (Tabla) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.04 }}
        className="hidden sm:block bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-x-auto shadow-2xs"
      >
        <table className="w-full text-left text-sm min-w-[620px]">
          <thead>
            <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-lg">Persona</th>
              <th className="py-3 px-4">Teléfono</th>
              <th className="py-3 px-4">Préstamos</th>
              <th className="py-3 px-4">Por cobrar</th>
              <th className="py-3 px-4 rounded-r-lg text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {contactos.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-xs text-on-surface-variant">Sin contactos aún. Crea el primero.</td></tr>
            ) : contactos.map((c) => {
              const allLoans = prestamos.filter((l) => rel(l.contactos)?.id === c.id);
              const activeLoans = allLoans.filter((l) => l.estado === "activo" || l.estado === "atrasado");
              const paidLoans = allLoans.filter((l) => l.estado === "pagado");
              const balance = activeLoans.reduce((sum, l) => sum + loanBalance(l), 0);
              const isLate = activeLoans.some((l) => l.estado === "atrasado");
              return (
                <tr key={c.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <ContactAvatar name={c.nombre} size={36} className="rounded-full shadow-xs shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm leading-tight">{c.nombre}</span>
                          {c.notas && (
                            <button
                              type="button"
                              onClick={() => onVerNota("Notas del contacto", c.nombre, c.notas)}
                              className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                              title="Ver notas de este contacto"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary" />
                            </button>
                          )}
                        </div>
                        {c.email && <span className="text-[11px] text-on-surface-variant block">{c.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-on-surface-variant">{c.telefono || "—"}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold">{allLoans.length}</span>
                    {paidLoans.length > 0 && (
                      <span className="ml-1.5 text-[10px] text-on-surface-variant">({paidLoans.length} saldados)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-sm whitespace-nowrap">
                    {money(balance)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {activeLoans.length > 0 ? isLate ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-atrasado inline-flex items-center">Con atraso</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-al-dia inline-flex items-center">Al día</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-saldado inline-flex items-center">Sin deuda activa</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

function EstadoPrestamoSelect({
  estado,
  nombre,
  onChange,
}: {
  estado: "activo" | "pagado" | "atrasado" | "cancelado";
  nombre: string;
  onChange: (nuevoEstado: "activo" | "pagado" | "atrasado" | "cancelado") => void;
}) {
  return (
    <div className="has-custom-chevron relative inline-flex items-center">
      <select
        value={estado}
        onChange={(event) => onChange(event.target.value as "activo" | "pagado" | "atrasado" | "cancelado")}
        className={`no-bg-chevron appearance-none w-[128px] pl-3.5 pr-8.5 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs ${
          estado === "atrasado" ? "badge-atrasado" :
          estado === "pagado" ? "badge-saldado" :
          estado === "cancelado" ? "badge-neutral" :
          "badge-al-dia"
        }`}
        aria-label={`Estado de ${nombre}`}
      >
        <option value="activo" className="bg-surface text-on-surface">Activo</option>
        <option value="atrasado" className="bg-surface text-on-surface">Atrasado</option>
        <option value="pagado" className="bg-surface text-on-surface">Pagado</option>
        <option value="cancelado" className="bg-surface text-on-surface">Cancelado</option>
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-3.5 pointer-events-none text-current opacity-70" />
    </div>
  );
}

function PrestamosView({
  prestamos,
  openModal,
  onStatusChange,
  onVerNota,
}: {
  prestamos: Prestamo[];
  openModal: () => void;
  onStatusChange: (prestamoId: string, estado: "activo" | "pagado" | "atrasado" | "cancelado") => Promise<void>;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  const [tab, setTab] = useState<"activos" | "pagados">("activos");
  const activos = prestamos.filter((p) => p.estado === "activo" || p.estado === "atrasado");
  const pagados = prestamos.filter((p) => p.estado === "pagado" || p.estado === "cancelado");
  const vencenHoy = activos.filter((p) => p.vence_hoy);
  const displayed = tab === "activos" ? activos : pagados;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60"
      >
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Préstamos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Registro de préstamos con cálculo mensual de intereses.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Nuevo préstamo</span>
        </button>
      </motion.div>

      {/* Tabs activos / saldados */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.03 }}
        className="grid grid-cols-2 sm:flex sm:items-center gap-1 bg-surface-container-low p-1 rounded-xl w-full sm:w-fit"
      >
        <button
          type="button"
          onClick={() => setTab("activos")}
          className={`px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
            tab === "activos" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Por cobrar
          {activos.length > 0 && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              tab === "activos" ? "bg-white/20" : "bg-surface-container text-on-surface-variant"
            }`}>{activos.length}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("pagados")}
          className={`px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
            tab === "pagados" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Saldados
          {pagados.length > 0 && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              tab === "pagados" ? "bg-white/20" : "bg-surface-container text-on-surface-variant"
            }`}>{pagados.length}</span>
          )}
        </button>
      </motion.div>
      {vencenHoy.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: 0.05 }}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
        >
          <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            <strong>{vencenHoy.length} {vencenHoy.length === 1 ? "préstamo vence" : "préstamos vencen"} hoy.</strong>{" "}
            Es el día de abono esperado; si no registras un cobro, mañana aparecerá automáticamente como atrasado.
          </p>
        </motion.div>
      )}

      {/* Vista Móvil (Tarjetas táctiles sin scroll horizontal forzado) */}
      <div className="sm:hidden space-y-3">
        {displayed.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
            {tab === "activos" ? "No hay préstamos activos pendientes." : "No hay préstamos saldados aún."}
          </div>
        ) : (
          displayed.map((l, i) => {
            const nombre = rel(l.contactos)?.nombre ?? "—";
            const isPaid = l.estado === "pagado" || l.estado === "cancelado";
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: Math.min(i * 0.03, 0.25) }}
                className={`bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-2xs space-y-3 ${
                  isPaid ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ContactAvatar name={nombre} size={36} className="rounded-full shadow-xs shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate">{nombre}</h4>
                      <p className="text-xs text-on-surface-variant font-medium truncate">{l.nombre}</p>
                      {(l.fecha_inicio || l.created_at) && (
                        <p className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant/85 mt-0.5">
                          <Calendar className="w-3 h-3 text-outline shrink-0" />
                          <span>Inició: {formatDateEs(l.fecha_inicio || l.created_at)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-on-surface-variant font-medium block">
                      {tab === "activos" ? "Por cobrar" : "Capital pagado"}
                    </span>
                    <span className="font-mono text-base font-bold text-primary whitespace-nowrap">
                      {isPaid ? money(Number(l.monto_capital_pagado)) : money(loanBalance(l))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-low text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Capital inicial</span>
                    <span className="font-mono font-medium text-on-surface whitespace-nowrap">{money(Number(l.monto_principal))}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Interés mensual</span>
                    <span className="font-mono font-medium text-on-surface">
                      {l.cobra_interes ? `${l.tasa_interes_mensual}% (${money(monthlyInterest(l))})` : "Sin interés"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Último mes cubierto</span>
                    <span className="font-semibold text-on-surface text-xs">
                      {l.ultimo_mes_cubierto ? (
                        <span className="text-primary font-bold">{l.ultimo_mes_cubierto}</span>
                      ) : (
                        <span className="text-on-surface-variant italic">Sin cobros previos</span>
                      )}
                    </span>
                    {l.ultimo_pago && (
                      <span className="text-[10px] text-on-surface-variant block">
                        Cobrado el {formatDateEs(l.ultimo_pago.recibido_en)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Próximo vencimiento</span>
                    <span className={`font-semibold ${l.vence_hoy ? "text-amber-600 font-bold" : l.meses_atrasados > 0 ? "text-error font-bold" : "text-on-surface"}`}>
                      {l.vence_hoy ? "¡Vence Hoy!" : l.fecha_proximo_pago ? formatDateEs(l.fecha_proximo_pago) : "Al día"}
                    </span>
                    {l.meses_atrasados > 0 && (
                      <span className="text-[10px] text-error font-bold block">
                        ⚠️ {l.meses_atrasados} cuota{l.meses_atrasados > 1 ? "s" : ""} atrasada{l.meses_atrasados > 1 ? "s" : ""}{l.dias_atraso > 0 ? ` (${l.dias_atraso} días)` : ""}
                      </span>
                    )}
                  </div>
                </div>

                {l.notas && (
                  <div className="pt-2 border-t border-surface-container-low flex justify-start">
                    <button
                      type="button"
                      onClick={() => onVerNota("Notas del préstamo", `${nombre} · ${l.nombre}`, l.notas)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[11px] font-medium border border-surface-container-high/60 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Ver nota completa</span>
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-surface-container-low flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-on-surface-variant">Estado:</span>
                  <EstadoPrestamoSelect
                    estado={l.estado}
                    nombre={l.nombre}
                    onChange={(nuevoEstado) => onStatusChange(l.id, nuevoEstado)}
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Vista Desktop / Tablet (Tabla) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06 }}
        className="hidden sm:block bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-x-auto shadow-2xs"
      >
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead>
            <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-lg">Persona</th>
              <th className="py-3 px-4">Préstamo</th>
              <th className="py-3 px-4">Capital inicial</th>
              <th className="py-3 px-4">{tab === "activos" ? "Por cobrar" : "Capital pagado"}</th>
              <th className="py-3 px-4">Interés mensual</th>
              <th className="py-3 px-4">Último mes cubierto</th>
              <th className="py-3 px-4">Próximo vencimiento</th>
              <th className="py-3 px-4 rounded-r-lg text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {displayed.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-xs text-on-surface-variant">
                {tab === "activos" ? "No hay préstamos activos pendientes." : "No hay préstamos saldados aún."}
              </td></tr>
            ) : displayed.map((l) => {
              const nombre = rel(l.contactos)?.nombre ?? "—";
              const isPaid = l.estado === "pagado" || l.estado === "cancelado";
              return (
                <tr key={l.id} className={`hover:bg-surface-container-low/40 transition-colors ${
                  isPaid ? "opacity-70" : ""
                }`}>
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <ContactAvatar name={nombre} size={32} className="rounded-full shadow-xs shrink-0" />
                      <span className="font-semibold text-sm">{nombre}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-middle text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                      <span>{l.nombre}</span>
                      {l.notas && (
                        <button
                          type="button"
                          onClick={() => onVerNota("Notas del préstamo", `${nombre} · ${l.nombre}`, l.notas)}
                          className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                          title="Ver nota completa"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </button>
                      )}
                    </div>
                    {(l.fecha_inicio || l.created_at) && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant/85 font-normal mt-0.5 whitespace-nowrap">
                        <Calendar className="w-3 h-3 text-outline shrink-0" />
                        <span>Inició: {formatDateEs(l.fecha_inicio || l.created_at)}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-middle font-mono font-medium text-xs whitespace-nowrap">{money(Number(l.monto_principal))}</td>
                  <td className="py-3.5 px-4 align-middle font-mono font-semibold text-sm whitespace-nowrap">
                    {isPaid
                      ? <span className="text-emerald-600">{money(Number(l.monto_capital_pagado))}</span>
                      : money(loanBalance(l))}
                  </td>
                  <td className="py-3.5 px-4 align-middle font-mono text-xs text-primary font-semibold whitespace-nowrap">
                    {l.cobra_interes
                      ? <span>{l.tasa_interes_mensual}% ({money(monthlyInterest(l))})<span className="block text-[10px] text-on-surface-variant font-normal mt-0.5">Cobrado: {money(l.interes_pagado_total)}</span></span>
                      : <span className="text-on-surface-variant font-sans">Sin interés</span>}
                  </td>
                  <td className="py-3.5 px-4 align-middle text-xs">
                    {l.ultimo_mes_cubierto ? (
                      <div>
                        <span className="font-bold text-primary">{l.ultimo_mes_cubierto}</span>
                        {l.ultimo_pago && (
                          <span className="block text-[10px] text-on-surface-variant mt-0.5">
                            Cobrado: {formatDateEs(l.ultimo_pago.recibido_en)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-on-surface-variant italic">Sin cobros previos</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-middle text-xs font-medium text-on-surface-variant">
                    <span className={l.vence_hoy ? "text-amber-600 font-bold" : l.meses_atrasados > 0 ? "text-error font-bold" : "text-on-surface"}>
                      {l.vence_hoy ? "Hoy · día de abono" : l.fecha_proximo_pago ? formatDateEs(l.fecha_proximo_pago) : "Sin pendientes"}
                    </span>
                    {l.meses_atrasados > 0 && (
                      <span className="block text-[10px] text-error font-bold mt-0.5">
                        ⚠️ {l.meses_atrasados} periodo{l.meses_atrasados === 1 ? "" : "s"} atrasado{l.meses_atrasados === 1 ? "" : "s"}{l.dias_atraso > 0 ? ` (${l.dias_atraso} días)` : ""}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-middle text-left">
                    <EstadoPrestamoSelect
                      estado={l.estado}
                      nombre={l.nombre}
                      onChange={(nuevoEstado) => onStatusChange(l.id, nuevoEstado)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

function PagosView({
  pagos,
  openModal,
  onVerNota,
}: {
  pagos: Pago[];
  openModal: () => void;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60"
      >
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cobros recibidos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Registro del dinero que realmente recibiste de tus préstamos.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Registrar cobro</span>
        </button>
      </motion.div>
      {/* Vista Móvil (Tarjetas de cobros) */}
      <div className="sm:hidden space-y-2.5">
        {pagos.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
            Sin cobros registrados aún.
          </div>
        ) : (
          pagos.map((p, i) => {
            const prestamo = rel(p.prestamos);
            const contacto = rel(prestamo?.contactos);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, delay: Math.min(i * 0.03, 0.25) }}
                className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-on-surface truncate">{contacto?.nombre ?? "—"}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{prestamo?.nombre ?? "—"}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Cuota: {p.fecha_esperada ? formatMonthYear(p.fecha_esperada) : "—"}
                      </span>
                      {p.fecha_esperada && p.recibido_en > p.fecha_esperada && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 px-1.5 py-0.5 rounded">
                          Cobrado con retraso
                        </span>
                      )}
                      {p.fecha_esperada && p.recibido_en < p.fecha_esperada && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                          Cobrado anticipado
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-bold text-primary block whitespace-nowrap">+{money(Number(p.monto_total))}</span>
                    <span className="text-[10px] text-on-surface-variant">Cobrado: {formatDateEs(p.recibido_en)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-low text-[11px] text-on-surface-variant">
                  <span>Capital: <strong className="text-on-surface font-mono whitespace-nowrap">{money(Number(p.monto_principal))}</strong> · Interés: <strong className="text-on-surface font-mono whitespace-nowrap">{money(Number(p.monto_interes))}</strong></span>
                  <span className="font-medium text-on-surface bg-surface-container-low px-2 py-0.5 rounded-md border border-surface-container-high/40">{rel(p.cuentas_dinero)?.nombre ?? "—"}</span>
                </div>

                {p.notas && (
                  <div className="pt-2 border-t border-surface-container-low flex justify-start">
                    <button
                      type="button"
                      onClick={() => onVerNota("Notas del cobro", `${contacto?.nombre ?? "—"} · ${formatDateEs(p.recibido_en)}`, p.notas)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface text-[11px] font-medium border border-surface-container-high/60 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span>Ver nota completa</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Vista Desktop / Tablet (Tabla) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06 }}
        className="hidden sm:block bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-x-auto shadow-2xs"
      >
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead>
            <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-lg">Cuota / Período</th>
              <th className="py-3 px-4">Fecha de cobro</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Préstamo</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Capital</th>
              <th className="py-3 px-4">Interés</th>
              <th className="py-3 px-4 rounded-r-lg">Cuenta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {pagos.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-xs text-on-surface-variant">Sin cobros registrados aún.</td></tr>
            ) : pagos.map((p) => {
              const prestamo = rel(p.prestamos);
              const contacto = rel(prestamo?.contactos);
              return (
                <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4 text-xs font-semibold text-on-surface">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary">{p.fecha_esperada ? formatMonthYear(p.fecha_esperada) : "—"}</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">({formatDateEs(p.fecha_esperada)})</span>
                    </div>
                    {p.fecha_esperada && p.recibido_en > p.fecha_esperada && (
                      <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 px-1.5 py-0.2 rounded mt-0.5">
                        Cobrado con retraso
                      </span>
                    )}
                    {p.fecha_esperada && p.recibido_en < p.fecha_esperada && (
                      <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 px-1.5 py-0.2 rounded mt-0.5">
                        Cobrado anticipado
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-on-surface font-medium">{formatDateEs(p.recibido_en)}</td>
                  <td className="py-3.5 px-4 font-semibold text-sm">{contacto?.nombre ?? "—"}</td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <span>{prestamo?.nombre ?? "—"}</span>
                      {p.notas && (
                        <button
                          type="button"
                          onClick={() => onVerNota("Notas del cobro", `${contacto?.nombre ?? "—"} · ${formatDateEs(p.recibido_en)}`, p.notas)}
                          className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                          title="Ver nota completa"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-sm text-primary whitespace-nowrap">{money(Number(p.monto_total))}</td>
                  <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">{money(Number(p.monto_principal))}</td>
                  <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">{money(Number(p.monto_interes))}</td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{rel(p.cuentas_dinero)?.nombre ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

interface AccountTheme {
  id: string;
  name: string;
  description: string;
  dot: string;
  cardCls: string;
  badgeCls: string;
  balanceCls: string;
}

const ACCOUNT_CARD_THEMES: AccountTheme[] = [
  {
    id: "turquoise",
    name: "Turquesa Al Día",
    description: "Estilo insignia con la frescura y liquidez de FinPal",
    dot: "#00a896",
    cardCls: "bg-teal-100/90 border-teal-300 hover:border-teal-400 dark:bg-teal-950/50 dark:border-teal-700/60 dark:hover:border-teal-600 shadow-2xs transition-colors",
    badgeCls: "badge-turquesa",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "emerald",
    name: "Esmeralda Vivo",
    description: "Rendimientos estables, capital y crecimiento continuo",
    dot: "#059669",
    cardCls: "bg-emerald-100/90 border-emerald-300 hover:border-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-700/60 dark:hover:border-emerald-600 shadow-2xs transition-colors",
    badgeCls: "badge-emerald",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "ocean",
    name: "Azul Océano",
    description: "Solidez bancaria, cuentas de nómina e instituciones",
    dot: "#2563eb",
    cardCls: "bg-blue-100/90 border-blue-300 hover:border-blue-400 dark:bg-blue-950/50 dark:border-blue-700/60 dark:hover:border-blue-600 shadow-2xs transition-colors",
    badgeCls: "badge-blue",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "violet",
    name: "Violeta Real",
    description: "Fondos de inversión, reservas y metas patrimoniales",
    dot: "#7c3aed",
    cardCls: "bg-violet-100/90 border-violet-300 hover:border-violet-400 dark:bg-violet-950/50 dark:border-violet-700/60 dark:hover:border-violet-600 shadow-2xs transition-colors",
    badgeCls: "badge-violet",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "amber",
    name: "Ámbar Cálido",
    description: "Fondos de emergencia, ahorro líquido y reserva diaria",
    dot: "#d97706",
    cardCls: "bg-amber-100/90 border-amber-300 hover:border-amber-400 dark:bg-amber-950/50 dark:border-amber-700/60 dark:hover:border-amber-600 shadow-2xs transition-colors",
    badgeCls: "badge-amber",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "rose",
    name: "Coral Carmesí",
    description: "Gastos activos, billeteras QR y consumo personal",
    dot: "#e11d48",
    cardCls: "bg-rose-100/90 border-rose-300 hover:border-rose-400 dark:bg-rose-950/50 dark:border-rose-700/60 dark:hover:border-rose-600 shadow-2xs transition-colors",
    badgeCls: "badge-rose",
    balanceCls: "text-slate-800 dark:text-white",
  },
];

function AccountCardItem({
  c,
  index,
  tipoLabel,
  themeId,
  onEdit,
  onDelete,
  isArchived = false,
  onReactivate,
}: {
  c: Cuenta;
  index: number;
  tipoLabel: string;
  themeId: string;
  onEdit?: (cuenta: Cuenta) => void;
  onDelete?: (cuenta: Cuenta) => void;
  isArchived?: boolean;
  onReactivate?: (cuenta: Cuenta) => void;
}) {
  const normalizedId = themeId === "blue" ? "ocean" : themeId;
  const currentTheme = ACCOUNT_CARD_THEMES.find((t) => t.id === normalizedId) ?? ACCOUNT_CARD_THEMES[index % ACCOUNT_CARD_THEMES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.07, 0.35), ease: "easeOut" }}
      className={`rounded-2xl border p-5 shadow-xs transition-colors relative flex flex-col justify-between ${
        isArchived
          ? "opacity-80 hover:opacity-100 border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-900/60"
          : currentTheme.cardCls
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
              isArchived
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                : currentTheme.badgeCls
            }`}
          >
            {isArchived ? "Archivada" : tipoLabel}
          </span>
          <div className="flex items-center gap-1">
            {isArchived && onReactivate ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReactivate(c);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-600/20 transition-colors cursor-pointer"
                title="Reactivar cuenta en el espacio de trabajo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reactivar</span>
              </button>
            ) : (
              <>
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(c);
                    }}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Editar nombre o categoría de la cuenta"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c);
                    }}
                    className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Eliminar o desactivar cuenta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <p className="font-heading text-lg font-extrabold text-slate-800 dark:text-white mt-3 tracking-tight">{c.nombre}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] text-slate-600 dark:text-slate-300 block uppercase font-bold tracking-wider">Saldo disponible</span>
          <p className="font-mono text-2xl font-extrabold mt-0.5 text-slate-800 dark:text-white">{money(c.saldo)}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-800 dark:text-white border border-black/10 dark:border-white/15 font-mono">
          {c.codigo_moneda}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Modal para Editar Cuenta con Auditoría ─────────────────────────────────

function ModalEditarCuenta({
  cuenta,
  espacioId,
  onClose,
  onSuccess,
}: {
  cuenta: Cuenta;
  espacioId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"editar" | "historial">("editar");
  const [nombre, setNombre] = useState(cuenta.nombre);
  const [tipo, setTipo] = useState(cuenta.tipo);
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Array<{
    id: string;
    campo_modificado: string;
    valor_anterior: string | null;
    valor_nuevo: string | null;
    motivo: string | null;
    created_at: string;
  }>>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
    if (tab === "historial") {
      let cancel = false;
      getAuditoriaEntidad(espacioId, "cuentas_dinero", cuenta.id)
        .then((data) => {
          if (!cancel) {
            setHistorial(data as unknown as typeof historial);
            setCargandoHistorial(false);
          }
        })
        .catch(() => {
          if (!cancel) setCargandoHistorial(false);
        });
      return () => {
        cancel = true;
      };
    }
  }, [tab, espacioId, cuenta.id]);

  const handleConfirmEdit = async () => {
    if (!nombre.trim()) {
      setError("El nombre de la cuenta no puede estar vacío.");
      return false;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("nombre", nombre.trim());
    fd.append("tipo", tipo);
    if (motivo.trim()) fd.append("motivo", motivo.trim());

    const result = await actualizarCuenta(cuenta.id, espacioId, fd);
    setSubmitting(false);

    if (result.error) {
      const errs = result.error as Record<string, string[]>;
      setError(errs._global?.[0] ?? Object.values(errs).flat()[0] ?? "Error al actualizar la cuenta");
      return false;
    }

    await onSuccess();
    onClose();
    return true;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-on-surface">Editar Cuenta</h2>
              <p className="text-xs text-on-surface-variant">Modifica nombre o categoría con auditoría completa.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs de edición y auditoría */}
        <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => setTab("editar")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === "editar" ? "bg-surface-container-lowest text-on-surface shadow-xs" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Editar detalles
          </button>
          <button
            type="button"
            onClick={() => { setCargandoHistorial(true); setTab("historial"); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === "historial" ? "bg-surface-container-lowest text-on-surface shadow-xs" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial de cambios</span>
          </button>
        </div>

        {tab === "editar" ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="p-3 rounded-xl bg-surface-container-low/50 border border-surface-container-high/60 text-xs text-on-surface-variant space-y-1">
              <p className="font-semibold text-on-surface flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                Seguridad financiera garantizada
              </p>
              <p>
                Editar el nombre o categoría no altera tus saldos ni tus transacciones pasadas. Tu libro contable permanece 100% íntegro.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Nombre de la cuenta *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary"
                placeholder="Ej. Banco Nacional de Bolivia"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Tipo de cuenta *</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="efectivo">Efectivo</option>
                <option value="banco">Cuenta bancaria</option>
                <option value="billetera_movil">Billetera móvil</option>
                <option value="ahorro">Cuenta de ahorro</option>
                <option value="otra">Otra</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Motivo del cambio (opcional, para el registro de auditoría)</label>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary"
                placeholder="Ej. Corregí error tipográfico en el nombre"
              />
            </div>

            {error && (
              <p className="text-xs text-error flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            <div className="pt-2">
              <SlideToConfirm
                submitting={submitting}
                label="Desliza para guardar cambios"
                resetTrigger={cuenta.id}
                onConfirm={handleConfirmEdit}
              />
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto pr-1 flex-1 max-h-[50vh] space-y-2.5">
            {cargandoHistorial ? (
              <div className="py-8 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Cargando auditoría...</span>
              </div>
            ) : historial.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant space-y-1">
                <Clock className="w-8 h-8 mx-auto text-on-surface-variant/40" />
                <p className="font-semibold text-on-surface">Sin modificaciones registradas</p>
                <p>Todos los cambios futuros de nombre o categoría quedarán auditados aquí con fecha y hora.</p>
              </div>
            ) : (
              historial.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-surface-container-low/60 border border-surface-container-high/50 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                    <span className="font-semibold uppercase tracking-wider text-primary">Campo: {item.campo_modificado}</span>
                    <span>{formatDateEs(item.created_at)}</span>
                  </div>
                  <div className="text-on-surface">
                    <span className="line-through text-on-surface-variant opacity-75">{item.valor_anterior || "(vacío)"}</span>
                    <span className="mx-2 text-primary font-bold">→</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.valor_nuevo}</span>
                  </div>
                  {item.motivo && (
                    <p className="text-[11px] text-on-surface-variant italic pt-1 border-t border-surface-container-low">
                      Motivo: {item.motivo}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModalPersonalizarColores({
  cuentas,
  selectedAccountId,
  onSelectAccount,
  themeMap,
  onSelectTheme,
  onClose,
}: {
  cuentas: Cuenta[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  themeMap: Record<string, string>;
  onSelectTheme: (cuentaId: string, themeId: string) => void;
  onClose: () => void;
}) {
  const currentAccount = cuentas.find((c) => c.id === selectedAccountId) ?? cuentas[0];
  const activeThemeId = currentAccount ? (themeMap[currentAccount.id] ?? "turquoise") : "turquoise";
  const activeTheme = ACCOUNT_CARD_THEMES.find((t) => t.id === activeThemeId) ?? ACCOUNT_CARD_THEMES[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-on-surface">Personalizar colores de cuentas</h2>
              <p className="text-xs text-on-surface-variant">Estilos vibrantes y armónicos inspirados en la estética de FinPal.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de cuenta si hay más de 1 */}
        {cuentas.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Selecciona la cuenta a personalizar:</label>
            <div className="flex flex-wrap gap-2">
              {cuentas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectAccount(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    currentAccount?.id === c.id
                      ? "bg-primary text-on-primary border-primary shadow-xs"
                      : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant border-outline/15"
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vista previa en vivo de la tarjeta */}
        {currentAccount && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-on-surface-variant">Vista previa en tiempo real:</span>
              <span className="text-[11px] text-primary font-medium">{activeTheme.name}</span>
            </div>
            <div className={`rounded-2xl border p-4 shadow-xs transition-all ${activeTheme.cardCls}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${activeTheme.badgeCls}`}>
                  {currentAccount.tipo}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-800 dark:text-white border border-black/10 dark:border-white/15 font-mono">
                  {currentAccount.codigo_moneda}
                </span>
              </div>
              <p className="font-heading text-base font-extrabold text-slate-800 dark:text-white mt-2.5 tracking-tight">{currentAccount.nombre}</p>
              <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 flex items-baseline justify-between">
                <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase font-bold tracking-wider">Saldo disponible</span>
                <p className="font-mono text-xl font-extrabold text-slate-800 dark:text-white">{money(currentAccount.saldo)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Opciones predefinidas vibrantes */}
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-2">Elige un estilo predefinido:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ACCOUNT_CARD_THEMES.map((t) => {
              const isSelected = activeThemeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => currentAccount && onSelectTheme(currentAccount.id, t.id)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs"
                      : "border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 mt-0.5 ring-2 ring-white/80 dark:ring-black/40 shadow-xs"
                    style={{ backgroundColor: t.dot }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-on-surface block truncate">{t.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5 line-clamp-1">{t.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-surface-container-high/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

function CuentasView({
  cuentas,
  espacioId,
  openModal,
  loadData,
  setSuccessNotice,
}: {
  cuentas: Cuenta[];
  espacioId: string;
  openModal: () => void;
  loadData: () => Promise<void>;
  setSuccessNotice: (msg: string | null) => void;
}) {
  const [modalColoresOpen, setModalColoresOpen] = useState(false);
  const [cuentaAEditar, setCuentaAEditar] = useState<Cuenta | null>(null);
  const [cuentaAEliminar, setCuentaAEliminar] = useState<Cuenta | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showArchivadas, setShowArchivadas] = useState(false);
  const [cuentasArchivadas, setCuentasArchivadas] = useState<Cuenta[]>([]);
  const [loadingArchivadas, setLoadingArchivadas] = useState(false);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(cuentas[0]?.id ?? "");
  const [themeMap, setThemeMap] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    const map: Record<string, string> = {};
    cuentas.forEach((c) => {
      try {
        const saved = localStorage.getItem(`finpal_account_color_${c.id}`);
        if (saved) map[c.id] = saved;
      } catch {}
    });
    return map;
  });

  const cargarArchivadas = useCallback(async () => {
    setLoadingArchivadas(true);
    try {
      const data = await getCuentasArchivadasConSaldo(espacioId);
      setCuentasArchivadas(data);
    } catch (err) {
      console.error("Error al cargar cuentas archivadas:", err);
    } finally {
      setLoadingArchivadas(false);
    }
  }, [espacioId]);

  const toggleArchivadas = async () => {
    const nextState = !showArchivadas;
    setShowArchivadas(nextState);
    if (nextState) {
      await cargarArchivadas();
    }
  };

  const handleConfirmEliminarOArchivar = async () => {
    if (!cuentaAEliminar) return;
    setIsProcessing(true);
    try {
      const res = await eliminarODesactivarCuenta(cuentaAEliminar.id, espacioId);
      if ("error" in res && res.error) {
        alert(res.error);
      } else if ("success" in res && res.success) {
        setSuccessNotice(res.message);
        await loadData();
        if (showArchivadas) {
          await cargarArchivadas();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "desconocido";
      alert("Error al procesar la acción: " + msg);
    } finally {
      setIsProcessing(false);
      setCuentaAEliminar(null);
    }
  };

  const handleReactivarCuenta = async (cuenta: Cuenta) => {
    setIsProcessing(true);
    try {
      const res = await reactivarCuenta(cuenta.id, espacioId);
      if ("error" in res && res.error) {
        alert(res.error);
      } else if ("success" in res && res.success) {
        setSuccessNotice(res.message);
        await loadData();
        await cargarArchivadas();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "desconocido";
      alert("Error al reactivar cuenta: " + msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectTheme = (accountId: string, themeId: string) => {
    setThemeMap((prev) => ({ ...prev, [accountId]: themeId }));
    try {
      localStorage.setItem(`finpal_account_color_${accountId}`, themeId);
    } catch {}
  };

  const handleOpenColorModal = (accountId?: string) => {
    if (accountId) setSelectedAccountId(accountId);
    else if (cuentas.length > 0) setSelectedAccountId(cuentas[0].id);
    setModalColoresOpen(true);
  };

  const TIPO_LABELS: Record<string, string> = {
    efectivo: "Efectivo",
    banco: "Cuenta bancaria",
    billetera_movil: "Billetera móvil",
    ahorro: "Cuenta de ahorro",
    otra: "Otra",
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60"
      >
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cuentas de Dinero</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Efectivo, bancos, billeteras y personalización de fondo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleArchivadas}
            className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              showArchivadas
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>{showArchivadas ? "Ocultar archivadas" : "Cuentas archivadas"}</span>
          </button>
          {cuentas.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenColorModal()}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Palette className="w-4 h-4 text-primary" />
              <span>Editar colores</span>
            </button>
          )}
          <button
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer transition-colors"
            onClick={openModal}
          >
            <Plus className="w-4 h-4" />
            <span>Nueva cuenta</span>
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cuentas.length === 0 && (
          <p className="text-xs text-on-surface-variant col-span-3 text-center py-8">Sin cuentas registradas aún.</p>
        )}
        {cuentas.map((c, i) => (
          <AccountCardItem
            key={c.id}
            c={c}
            index={i}
            tipoLabel={TIPO_LABELS[c.tipo] ?? c.tipo}
            themeId={themeMap[c.id] ?? ACCOUNT_CARD_THEMES[i % ACCOUNT_CARD_THEMES.length].id}
            onEdit={(cuenta) => setCuentaAEditar(cuenta)}
            onDelete={(cuenta) => setCuentaAEliminar(cuenta)}
          />
        ))}
      </div>

      {showArchivadas && (
        <div className="mt-8 pt-6 border-t border-surface-container-high/60 space-y-4">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">Cuentas Archivadas / Inactivas</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
              {cuentasArchivadas.length}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant">
            Estas cuentas ya no se muestran en los selectores de nuevos movimientos ni préstamos, pero conservan su historial contable. Puedes reactivarlas en cualquier momento.
          </p>

          {loadingArchivadas ? (
            <div className="flex items-center justify-center py-8 text-on-surface-variant gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Cargando cuentas archivadas...</span>
            </div>
          ) : cuentasArchivadas.length === 0 ? (
            <p className="text-xs text-on-surface-variant py-4 italic">No tienes ninguna cuenta archivada.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cuentasArchivadas.map((c, i) => (
                <AccountCardItem
                  key={c.id}
                  c={c}
                  index={i}
                  tipoLabel={TIPO_LABELS[c.tipo] ?? c.tipo}
                  themeId="charcoal"
                  isArchived={true}
                  onReactivate={handleReactivarCuenta}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {modalColoresOpen && (
        <ModalPersonalizarColores
          cuentas={cuentas}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          themeMap={themeMap}
          onSelectTheme={handleSelectTheme}
          onClose={() => setModalColoresOpen(false)}
        />
      )}

      {cuentaAEditar && (
        <ModalEditarCuenta
          cuenta={cuentaAEditar}
          espacioId={espacioId}
          onClose={() => setCuentaAEditar(null)}
          onSuccess={async () => {
            setSuccessNotice("¡Cuenta actualizada correctamente!");
            await loadData();
          }}
        />
      )}

      {cuentaAEliminar && (
        <ConfirmDialog
          isOpen={true}
          title={
            cuentaAEliminar.saldo > 0
              ? `¿Deseas archivar "${cuentaAEliminar.nombre}"?`
              : `¿Eliminar o archivar "${cuentaAEliminar.nombre}"?`
          }
          description={
            <div className="space-y-3 pt-1">
              {/* Tarjeta resumen de la cuenta a ancho completo */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low/80 border border-surface-container-high/80 flex items-center justify-between shadow-2xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block font-mono">
                    {TIPO_LABELS[cuentaAEliminar.tipo] ?? cuentaAEliminar.tipo}
                  </span>
                  <span className="font-heading font-extrabold text-base text-on-surface block leading-tight">
                    {cuentaAEliminar.nombre}
                  </span>
                </div>
                <div className="text-right space-y-0.5 shrink-0 pl-3">
                  <span className="text-[10px] font-semibold text-on-surface-variant block uppercase tracking-wider font-mono">
                    Saldo actual
                  </span>
                  <span
                    className={`font-mono font-extrabold text-base block leading-tight ${
                      cuentaAEliminar.saldo > 0 ? "text-amber-600 dark:text-amber-400" : "text-on-surface"
                    }`}
                  >
                    {money(cuentaAEliminar.saldo)}
                  </span>
                </div>
              </div>

              {/* Lista con puntos resumidos */}
              <div className="space-y-2 pt-1">
                <p className="font-semibold text-xs text-on-surface">
                  {cuentaAEliminar.saldo > 0
                    ? "Tu cuenta tiene lo siguiente y cambiará su estado:"
                    : "Detalles de la acción:"}
                </p>
                <div className="space-y-2 text-xs text-on-surface-variant">
                  {cuentaAEliminar.saldo > 0 && (
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <p className="leading-relaxed">
                        <strong className="text-on-surface">Saldo de {money(cuentaAEliminar.saldo)}:</strong> el saldo se conserva registrado, pero la cuenta quedará inactiva para nuevas operaciones.
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <p className="leading-relaxed">
                      <strong className="text-on-surface">Historial contable:</strong> se mantendrán todas tus transacciones y cobros pasados intactos.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <p className="leading-relaxed">
                      <strong className="text-on-surface">Visibilidad:</strong> se ocultará de los selectores diarios para mantener tu panel ordenado.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p className="leading-relaxed">
                      <strong className="text-on-surface">Recuperable:</strong> podrás consultar su historial o reactivarla cuando quieras en <em>"Cuentas archivadas"</em>.
                    </p>
                  </div>
                  {cuentaAEliminar.saldo === 0 && (
                    <div className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <p className="leading-relaxed">
                        <strong className="text-on-surface">Sin movimientos:</strong> si nunca tuvo movimientos registrados, se borrará definitivamente del sistema.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
          useSlider={true}
          sliderLabel={
            cuentaAEliminar.saldo > 0
              ? "Desliza para archivar cuenta"
              : "Desliza para confirmar"
          }
          submitting={isProcessing}
          confirmText={cuentaAEliminar.saldo > 0 ? "Archivar cuenta" : "Confirmar acción"}
          cancelText="Cancelar y volver"
          variant={cuentaAEliminar.saldo > 0 ? "warning" : "danger"}
          onConfirm={handleConfirmEliminarOArchivar}
          onCancel={() => {
            if (!isProcessing) setCuentaAEliminar(null);
          }}
        />
      )}
    </div>
  );
}

function MovimientosView({
  movimientos,
  openModal,
  onVerNota,
}: {
  movimientos: Movimiento[];
  openModal: () => void;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "ingreso" | "gasto" | "cobro" | "transferencia" | "ajuste">("todos");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);

  const filtrados = useMemo(() => {
    return movimientos.filter((m) => {
      if (filtroTipo === "ingreso" && m.tipo !== "ingreso") return false;
      if (filtroTipo === "gasto" && m.tipo !== "gasto") return false;
      if (filtroTipo === "cobro" && m.tipo !== "pago_prestamo" && m.tipo !== "entrega_prestamo") return false;
      if (filtroTipo === "transferencia" && !m.tipo.startsWith("transferencia")) return false;
      if (filtroTipo === "ajuste" && m.tipo !== "ajuste") return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const cuentaNombre = (Array.isArray(m.cuentas_dinero)
          ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
          : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "";
        const desc = (m.descripcion ?? "").toLowerCase();
        const montoStr = String(m.monto);
        if (!desc.includes(q) && !cuentaNombre.toLowerCase().includes(q) && !montoStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [movimientos, filtroTipo, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaClamped = Math.min(pagina, totalPaginas);
  const inicio = (paginaClamped - 1) * porPagina;
  const paginados = filtrados.slice(inicio, inicio + porPagina);

  const cambiarFiltro = (nuevoTipo: typeof filtroTipo) => {
    setFiltroTipo(nuevoTipo);
    setPagina(1);
  };

  const cambiarBusqueda = (texto: string) => {
    setBusqueda(texto);
    setPagina(1);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60"
      >
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Movimientos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Todos los flujos de dinero del espacio.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Registrar movimiento</span>
        </button>
      </motion.div>

      {/* Barra de Filtros y Búsqueda */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, delay: 0.04 }}
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
      >
        {/* Pestañas de tipo */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl overflow-x-auto">
          {[
            { id: "todos", label: "Todos" },
            { id: "ingreso", label: "Ingresos" },
            { id: "gasto", label: "Gastos" },
            { id: "cobro", label: "Préstamos / Cobros" },
            { id: "transferencia", label: "Transferencias" },
            { id: "ajuste", label: "Ajustes" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => cambiarFiltro(t.id as typeof filtroTipo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filtroTipo === t.id
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
            placeholder="Buscar por concepto o cuenta..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface focus:outline-none focus:border-primary"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => cambiarBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Vista Móvil (Tarjetas de movimientos) */}
      <div className="sm:hidden space-y-2.5">
        {paginados.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
            No se encontraron movimientos con los filtros aplicados.
          </div>
        ) : (
          paginados.map((m, i) => {
            const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
              || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
            const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
            const BadgeIcon = badge.Icon;
            const cuentaNombre = (Array.isArray(m.cuentas_dinero)
              ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
              : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "—";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: Math.min(i * 0.03, 0.25) }}
                className="bg-surface-container-lowest border border-surface-container-high/70 rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${badge.badgeClass}`}>
                      <BadgeIcon className="w-2.5 h-2.5 shrink-0" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-on-surface truncate">{m.descripcion ? fixSpanishEncoding(m.descripcion) : badge.label}</p>
                    {m.descripcion && m.descripcion.length > 20 && (
                      <button
                        type="button"
                        onClick={() => onVerNota("Detalle del movimiento", badge.label, m.descripcion)}
                        className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Ver más
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant truncate">{formatDateEs(m.ocurrido_en)} · {cuentaNombre}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-mono text-xs font-bold whitespace-nowrap inline-block ${isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"}`}>
                    {isPositive ? "+" : "−"}{money(Number(m.monto))}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Vista Desktop / Tablet (Tabla) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.06 }}
        className="hidden sm:block bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-x-auto shadow-2xs"
      >
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Cuenta</th>
              <th className="py-3 px-4 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {paginados.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-xs text-on-surface-variant">No se encontraron movimientos con los filtros aplicados.</td></tr>
            ) : paginados.map((m) => {
              const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
                || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
              const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
              const BadgeIcon = badge.Icon;
              return (
                <tr key={m.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{formatDateEs(m.ocurrido_en)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${badge.badgeClass}`}>
                      <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{badge.label}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm font-medium text-on-surface">
                    <div className="flex items-center gap-1.5">
                      <span>{m.descripcion ? fixSpanishEncoding(m.descripcion) : "—"}</span>
                      {m.descripcion && m.descripcion.length > 25 && (
                        <button
                          type="button"
                          onClick={() => onVerNota("Detalle del movimiento", badge.label, m.descripcion)}
                          className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                          title="Ver detalle completo"
                        >
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                    {(Array.isArray(m.cuentas_dinero)
                      ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
                      : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "—"}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm whitespace-nowrap ${isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"}`}>
                    {isPositive ? "+" : "−"}{money(Number(m.monto))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Barra de Paginación Minimalista */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.08 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-on-surface-variant"
      >
        <div className="flex items-center gap-2">
          <span>
            Mostrando <strong className="text-on-surface">{filtrados.length === 0 ? 0 : inicio + 1}</strong>–<strong className="text-on-surface">{Math.min(inicio + porPagina, filtrados.length)}</strong> de <strong className="text-on-surface">{filtrados.length}</strong> movimientos
          </span>
          <span className="text-on-surface-variant/40">·</span>
          <select
            value={porPagina}
            onChange={(e) => {
              setPorPagina(Number(e.target.value));
              setPagina(1);
            }}
            className="bg-surface-container-low border border-surface-container-high/60 rounded-xl pl-2.5 pr-8 py-1.5 text-xs text-on-surface cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium">
            Página {paginaClamped} de {totalPaginas}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaClamped <= 1}
              className="p-1.5 rounded-lg border border-surface-container-high/70 bg-surface-container-lowest hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaClamped >= totalPaginas}
              className="p-1.5 rounded-lg border border-surface-container-high/70 bg-surface-container-lowest hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const POPULAR_TIMEZONES = [
  { value: "America/La_Paz", label: "La Paz (Bolivia · UTC-4)" },
  { value: "America/Argentina/Buenos_Aires", label: "Buenos Aires (Argentina · UTC-3)" },
  { value: "America/Santiago", label: "Santiago (Chile · UTC-3 / UTC-4)" },
  { value: "America/Lima", label: "Lima (Perú · UTC-5)" },
  { value: "America/Bogota", label: "Bogotá (Colombia · UTC-5)" },
  { value: "America/Caracas", label: "Caracas (Venezuela · UTC-4)" },
  { value: "America/Mexico_City", label: "Ciudad de México (México · UTC-6)" },
  { value: "America/Sao_Paulo", label: "São Paulo (Brasil · UTC-3)" },
  { value: "America/Madrid", label: "Madrid (España · UTC+1 / UTC+2)" },
  { value: "America/New_York", label: "Nueva York (EE.UU. · UTC-5 / UTC-4)" },
];

function ConfiguracionView({
  preferencias,
  guardarPreferencias,
  espacioId,
  zonaHoraria,
  setZonaHoraria,
  setSuccessNotice,
}: {
  preferencias: { colorAcento: string; modoOscuro: boolean; tasaInteresPredeterminada: number };
  guardarPreferencias: (colorAcento: string, modoOscuro: boolean, tasaInteresPredeterminada: number) => Promise<string | null>;
  espacioId: string;
  zonaHoraria: string;
  setZonaHoraria: (zona: string) => void;
  setSuccessNotice: (msg: string | null) => void;
}) {
  const [color, setColor] = useState(preferencias.colorAcento);
  const [tasa, setTasa] = useState(preferencias.tasaInteresPredeterminada);
  const [zona, setZona] = useState(zonaHoraria || "America/La_Paz");
  const [guardando, setGuardando] = useState(false);
  const [guardandoZona, setGuardandoZona] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mostrarModalEliminarCuenta, setMostrarModalEliminarCuenta] = useState(false);
  const [textoConfirmarEliminar, setTextoConfirmarEliminar] = useState("");
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);
  const [errorEliminarCuenta, setErrorEliminarCuenta] = useState<string | null>(null);



  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    const error = await guardarPreferencias(color, preferencias.modoOscuro, tasa);
    setGuardando(false);
    setMensaje(error ?? "Preferencias guardadas.");
  }

  async function guardarZonaHoraria(nuevaZona: string) {
    setZona(nuevaZona);
    if (!espacioId) return;
    setGuardandoZona(true);
    const res = await actualizarZonaHorariaEspacio(espacioId, nuevaZona);
    setGuardandoZona(false);
    if (!res.error) {
      setZonaHoraria(nuevaZona);
      setSuccessNotice(`¡Zona horaria actualizada a ${nuevaZona}!`);
    }
  }

  return (
    <div className="space-y-6 w-full">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="pb-4 border-b border-surface-container-high/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface">Configuración</h1>
          <p className="text-xs text-on-surface-variant mt-1">Ajustes del espacio de trabajo, región y preferencias visuales.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Card 1: Zona Horaria del Espacio */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.04 }}
          className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 shadow-2xs p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-base font-bold text-on-surface">Zona horaria del espacio</h2>
                <p className="text-xs text-on-surface-variant">
                  Evita desfases de fecha en cobros y vencimientos en horario nocturno.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Huso horario oficial
              </label>
              <select
                value={zona}
                onChange={(e) => guardarZonaHoraria(e.target.value)}
                disabled={guardandoZona}
                className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
              >
                {POPULAR_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 mt-2.5 text-[11px] text-on-surface-variant">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  Tus registros y vencimientos se calculan en base a esta zona. Los cambios se sincronizan en vivo.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
            <span>Zona activa: <b className="text-on-surface font-mono">{zona}</b></span>
            {guardandoZona && <span className="text-primary font-bold animate-pulse">Sincronizando...</span>}
          </div>
        </motion.div>

        {/* Card 2: Apariencia y Color de Acento */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.08 }}
          className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 shadow-2xs p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-base font-bold text-on-surface">Color de Acento</h2>
                <p className="text-xs text-on-surface-variant">
                  Personaliza los tonos principales de botones, badges y gráficos.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-on-surface mb-2">Paleta disponible</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  ["verde", "#006948", "Verde Esmeralda"],
                  ["azul", "#2563eb", "Azul Océano"],
                  ["violeta", "#7c3aed", "Violeta Neón"],
                  ["naranja", "#c2410c", "Naranja Ámbar"],
                  ["rosa", "#e11d48", "Rosa Carmesí"],
                ].map(([value, colorValue, label]) => {
                  const isSelected = color === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setColor(value)}
                      className={`inline-flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold capitalize cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs text-on-surface font-bold"
                          : "border-surface-container-high/80 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: colorValue }} />
                      <span className="truncate">{label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
            <span>Se aplica a todos tus espacios en tu perfil.</span>
          </div>
        </motion.div>

        {/* Card 3: Parámetros Financieros (Tasa Predeterminada) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.12 }}
          className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 shadow-2xs p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Percent className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-base font-bold text-on-surface">Parámetros de Préstamos</h2>
                <p className="text-xs text-on-surface-variant">
                  Configura valores sugeridos automáticamente al registrar préstamos.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-on-surface mb-1.5">
                Tasa de interés mensual predeterminada (% mensual)
              </label>
              <div className="relative w-full sm:w-48">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={tasa}
                  onChange={(event) => setTasa(Number(event.target.value))}
                  className="w-full h-11 pl-3 pr-10 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-sm font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant pointer-events-none">
                  % mes
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2 leading-relaxed">
                Rellena automáticamente los nuevos formularios para ahorrar tiempo; no altera créditos ya otorgados.
              </p>
              {tasa > 3 && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-on-surface leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Nota legal informativa:</strong> Verifica el límite máximo de interés convencional permitido en tu jurisdicción (por ejemplo, en Bolivia el Art. 409 del Código Civil fija un máximo del 3% mensual para préstamos civiles entre particulares).
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-container-low flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container transition-all cursor-pointer active:scale-95 disabled:opacity-60 flex items-center gap-2"
            >
              {guardando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar preferencias</span>
              )}
            </button>
            {mensaje && <p className="text-xs text-primary font-semibold truncate">{mensaje}</p>}
          </div>
        </motion.div>

        {/* Card 4: Espacios de Trabajo y Navegación */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.16 }}
          className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 shadow-2xs p-6 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <LayoutGrid className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-base font-bold text-on-surface">Gestión de Espacios</h2>
                <p className="text-xs text-on-surface-variant">
                  Organiza y separa carteras familiares, préstamos personales o de negocios.
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Cada espacio cuenta con su propia base de datos, monedas, cuentas y miembros aislados de forma independiente.
              </p>
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-xs text-on-surface-variant flex items-center justify-between">
                <span>Espacio actual ID:</span>
                <span className="font-mono text-[11px] font-bold text-on-surface truncate max-w-[200px]">{espacioId || "predeterminado"}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-container-low">
            <Link
              href="/espacios"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high/60 text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              <span>Ver todos mis espacios de trabajo</span>
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
          </div>
        </motion.div>

        {/* Card 5: Privacidad, Textos Legales y Derecho al Olvido */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.2 }}
          className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 shadow-2xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-heading text-base font-bold text-on-surface">
                  Privacidad, Marco Legal y Soberanía de Datos (Derecho al Olvido)
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Cumplimiento con protección de privacidad en Bolivia (CPE Art. 21.2), CCPA (EE. UU.) y GDPR.
                </p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed pt-1">
              Tus datos están aislados con políticas Row Level Security (RLS) y cifrado AES-256-GCM en servidor. Puedes consultar nuestros textos legales o solicitar la eliminación definitiva e irreversible de tu cuenta y todos tus espacios.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold">
              <Link href="/terminos" target="_blank" className="text-primary hover:underline">
                Términos de Servicio y Deslinde IA/Finanzas
              </Link>
              <span className="text-outline-variant">•</span>
              <Link href="/privacidad" target="_blank" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => {
                setTextoConfirmarEliminar("");
                setErrorEliminarCuenta(null);
                setMostrarModalEliminarCuenta(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-error/40 bg-error-container/30 hover:bg-error-container/60 text-error text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar mi cuenta y datos</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Modal de Confirmación de Derecho al Olvido / Eliminación Total */}
      {mostrarModalEliminarCuenta && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !eliminandoCuenta && setMostrarModalEliminarCuenta(false)}
        >
          <div
            className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-bold text-on-surface">
                    Eliminar cuenta definitivamente
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Acción irreversible (Derecho al Olvido)
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={eliminandoCuenta}
                onClick={() => setMostrarModalEliminarCuenta(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Se borrarán de forma permanente todos tus espacios de trabajo, contactos, préstamos, cobros, cuentas de dinero y tu usuario de acceso. Te recomendamos exportar antes tus reportes en CSV o PDF.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-on-surface">
                Escribe <span className="font-mono text-error font-bold">ELIMINAR MI CUENTA</span> para confirmar:
              </label>
              <input
                type="text"
                value={textoConfirmarEliminar}
                onChange={(e) => setTextoConfirmarEliminar(e.target.value)}
                placeholder="ELIMINAR MI CUENTA"
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-error/30"
              />
            </div>

            {errorEliminarCuenta && (
              <p className="text-xs font-semibold text-error">{errorEliminarCuenta}</p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={eliminandoCuenta}
                onClick={() => setMostrarModalEliminarCuenta(false)}
                className="px-4 py-2 rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  eliminandoCuenta ||
                  textoConfirmarEliminar.trim().toUpperCase() !== "ELIMINAR MI CUENTA"
                }
                onClick={async () => {
                  setEliminandoCuenta(true);
                  setErrorEliminarCuenta(null);
                  const res = await eliminarMiCuentaDefinitivamente(textoConfirmarEliminar);
                  if (res?.error) {
                    setErrorEliminarCuenta(res.error);
                    setEliminandoCuenta(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-error text-on-error text-xs font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {eliminandoCuenta ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Borrar todo definitivamente</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
