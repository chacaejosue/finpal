"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  List,
  Trash2,
  Archive,
  RotateCcw,
  UsersRound,
  Landmark,
  QrCode,
  PiggyBank,
  CreditCard,
  Wallet,
  BarChart3,
  TrendingUp,
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
import { BudgetRuleWidget } from "@/components/budget-rule-widget";
import { useEspacio } from "@/lib/espacio-context";
import { actualizarEstadoPrestamo, anularPrestamo } from "@/app/(dashboard)/prestamos/actions";
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
import {
  actualizarZonaHorariaEspacio,
  actualizarMonedaEspacio,
  actualizarNombreEspacio,
} from "@/app/(dashboard)/espacios/actions";
import { eliminarMiCuentaDefinitivamente } from "@/app/(dashboard)/configuracion/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  ModalReciboCobro,
  ModalSimuladorPrestamo,
  ModalKardexPrestamo,
  ModalFichaContacto,
} from "@/components/finpal-modals";
import { getContactosArchivados, reactivarContacto } from "@/app/(dashboard)/contactos/actions";
import { anularPago } from "@/app/(dashboard)/pagos/actions";
import { eliminarMovimiento } from "@/app/(dashboard)/movimientos/actions";
import { ModalAuditoriaEliminaciones } from "@/components/modal-auditoria-eliminaciones";
import { Calculator, Eye, FolderOpen, Tag, UserCheck } from "lucide-react";


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
  const {
    espacioId,
    espacioNombre,
    setEspacio,
    zonaHoraria,
    setZonaHoraria,
    codigoMoneda,
    setCodigoMoneda,
  } = useEspacio();
  const [notaModal, setNotaModal] = useState<{ titulo: string; subtitulo?: string; texto: string } | null>(null);
  const [reciboPago, setReciboPago] = useState<Pago | null>(null);
  const [simuladorOpen, setSimuladorOpen] = useState(false);
  const [kardexPrestamoId, setKardexPrestamoId] = useState<string | null>(null);
  const [fichaContacto, setFichaContacto] = useState<{ contacto: Contacto; tab: "ficha" | "editar" } | null>(null);

  const activeKardexPrestamo = useMemo(
    () => (kardexPrestamoId ? prestamos.find((p) => p.id === kardexPrestamoId) ?? null : null),
    [kardexPrestamoId, prestamos]
  );

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
            openModal={(m, preset) => openModal(m, preset)}
            onOpenSimulador={() => setSimuladorOpen(true)}
            onOpenKardex={(id) => setKardexPrestamoId(id)}
            onVerNota={handleVerNota}
          />
        )}
        {page === "contactos" && (
          <ContactosView
            contactos={contactos}
            prestamos={prestamos}
            openModal={() => openModal("contact")}
            openLoanForContact={(contactId) => openModal("loan", { contactId })}
            onOpenFicha={(contacto, tab) => setFichaContacto({ contacto, tab })}
            espacioId={espacioId ?? ""}
            loadData={loadData}
            setSuccessNotice={setSuccessNotice}
            onVerNota={handleVerNota}
          />
        )}
        {page === "prestamos" && (
          <PrestamosView
            prestamos={prestamos}
            pagos={pagos}
            espacioId={espacioId ?? ""}
            loadData={loadData}
            setSuccessNotice={setSuccessNotice}
            openModal={() => openModal("loan")}
            onCobrarPrestamo={(loanId) => openModal("payment", { loanId })}
            onOpenSimulador={() => setSimuladorOpen(true)}
            onOpenKardex={(loanId) => setKardexPrestamoId(loanId)}
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
            onVerRecibo={(pago) => setReciboPago(pago)}
            espacioId={espacioId ?? ""}
            loadData={loadData}
            setSuccessNotice={setSuccessNotice}
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
            espacioId={espacioId ?? ""}
            loadData={loadData}
            setSuccessNotice={setSuccessNotice}
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
            key={`${preferencias.colorAcento}-${preferencias.tasaInteresPredeterminada}-${zonaHoraria}-${codigoMoneda}`}
            preferencias={preferencias}
            guardarPreferencias={guardarPreferencias}
            espacioId={espacioId ?? ""}
            espacioNombre={espacioNombre}
            setEspacioNombre={(nuevoNombre) => {
              if (espacioId) setEspacio(espacioId, nuevoNombre, zonaHoraria, codigoMoneda);
            }}
            zonaHoraria={zonaHoraria}
            setZonaHoraria={setZonaHoraria}
            codigoMoneda={codigoMoneda}
            setCodigoMoneda={setCodigoMoneda}
            setSuccessNotice={setSuccessNotice}
          />
        )}
      </motion.div>

      <AnimatePresence>
        {notaModal && (
          <ModalDetalleNota
            titulo={notaModal.titulo}
            subtitulo={notaModal.subtitulo}
            texto={notaModal.texto}
            onClose={() => setNotaModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reciboPago && (
          <ModalReciboCobro
            pago={reciboPago}
            prestamo={
              prestamos.find((pr) => pr.id === reciboPago.prestamo_id) ??
              prestamos.find((pr) => pr.nombre === rel(reciboPago.prestamos)?.nombre) ??
              null
            }
            espacioNombre={espacioNombre}
            onClose={() => setReciboPago(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {simuladorOpen && (
          <ModalSimuladorPrestamo
            tasaPredeterminada={preferencias.tasaInteresPredeterminada}
            onClose={() => setSimuladorOpen(false)}
            onUsarEnPrestamo={(preset) => {
              setSimuladorOpen(false);
              openModal("loan", preset);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeKardexPrestamo && (
          <ModalKardexPrestamo
            prestamo={activeKardexPrestamo}
            pagos={pagos}
            cuentas={cuentas}
            espacioId={espacioId ?? ""}
            onClose={() => setKardexPrestamoId(null)}
            onCobrar={(loanId, fechaEsperada) => {
              setKardexPrestamoId(null);
              openModal("payment", { loanId, fechaEsperada });
            }}
            onVerRecibo={(pago) => setReciboPago(pago)}
            onSuccess={async (msg) => {
              setSuccessNotice(msg);
              await loadData();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fichaContacto && (
          <ModalFichaContacto
            contacto={contactos.find((c) => c.id === fichaContacto.contacto.id) ?? fichaContacto.contacto}
            prestamos={prestamos}
            pagos={pagos}
            espacioId={espacioId ?? ""}
            initialTab={fichaContacto.tab}
            onClose={() => setFichaContacto(null)}
            onNuevoPrestamo={(contactId) => {
              setFichaContacto(null);
              openModal("loan", { contactId });
            }}
            onCobrarPrestamo={(loanId) => {
              setFichaContacto(null);
              openModal("payment", { loanId });
            }}
            onAbrirPrestamo={(loan) => {
              setFichaContacto(null);
              setKardexPrestamoId(loan.id);
            }}
            onSuccess={async (msg) => {
              setSuccessNotice(msg);
              await loadData();
            }}
          />
        )}
      </AnimatePresence>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
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
      </motion.div>
    </motion.div>
  );
}

// ─── Modal de Personalización del Dashboard ──────────────────────────────────

type WidgetKey = "kpis" | "prestamos" | "movimientos" | "cuentas" | "regla_presupuesto";

interface WidgetItem {
  id: WidgetKey;
  label: string;
  description: string;
  visible: boolean;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
  { id: "kpis", label: "Métricas generales (KPIs)", description: "Total en cuentas, Por cobrar, Saldado e Intereses", visible: true },
  { id: "regla_presupuesto", label: "Regla de finanzas (50/30/20 ó 60/20/20)", description: "Distribución de ingresos en necesidades, deseos y ahorro", visible: true },
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
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
      </motion.div>
    </motion.div>
  );
}

// ─── Componentes de Vistas por Página ─────────────────────────────────────────

function DashboardView({
  cuentas,
  prestamos,
  movimientos,
  totals,
  openModal,
  onOpenSimulador,
  onOpenKardex,
  onVerNota,
}: {
  cuentas: Cuenta[];
  prestamos: Prestamo[];
  movimientos: Movimiento[];
  totals: ReturnType<typeof Object.assign>;
  openModal: (m: "loan" | "payment", preset?: { loanId?: string; contactId?: string }) => void;
  onOpenSimulador: () => void;
  onOpenKardex: (loanId: string) => void;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  const [widgets, setWidgets] = useState<WidgetItem[]>(() => {
    try {
      const saved = localStorage.getItem("finpal_dashboard_widgets_v1");
      if (saved) {
        const parsed: WidgetItem[] = JSON.parse(saved);
        const missing = DEFAULT_WIDGETS.filter((dw) => !parsed.some((pw) => pw.id === dw.id));
        if (missing.length > 0) {
          return [...parsed, ...missing];
        }
        return parsed;
      }
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

  const upcoming = prestamos.filter((p) => p.estado !== "pagado").slice(0, 6);
  const prestamosToShow = upcoming.length > 0 ? upcoming : prestamos.slice(0, 6);
  const visibleWidgets = widgets.filter((w) => w.visible);

  return (
    <div className="space-y-6">
      {/* Cabecera del Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-container-high/60"
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-1">
            <span className="inline-flex items-center gap-1.5 text-primary bg-secondary-container/40 px-2.5 py-0.5 rounded-full border border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Panel de control financiero
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">Panel de control</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Resumen en vivo de tu liquidez, cartera y cobros programados.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenSimulador}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold text-xs transition-all shadow-2xs cursor-pointer"
            title="Simular préstamo e intereses antes de otorgarlo"
          >
            <Calculator className="w-4 h-4 text-primary" />
            <span>Simulador</span>
          </button>
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
      </motion.div>

      {/* Si el usuario desactivó todas las tarjetas, mostrar canvas limpio */}
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
        /* Renderizado dinámico de widgets */
        widgets.filter((w) => w.visible).map((w) => {
          if (w.id === "kpis") {
            return (
              <div key={w.id} className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {[
                  {
                    label: "Total en cuentas",
                    value: totals.available,
                    icon: WalletCards,
                    colorClass: "kpi-icon-emerald",
                    sub: "Liquidez disponible",
                  },
                  {
                    label: "Por cobrar",
                    value: totals.pending,
                    icon: HandCoins,
                    colorClass: "kpi-icon-amber",
                    sub: `${totals.activeLoansCount} ${totals.activeLoansCount === 1 ? 'préstamo activo' : 'préstamos activos'}`,
                  },
                  {
                    label: "Ya cobrado",
                    value: totals.collected,
                    icon: BadgeCheck,
                    colorClass: "kpi-icon-teal",
                    sub: `${totals.paidLoansCount} saldado${totals.paidLoansCount !== 1 ? 's' : ''}`,
                  },
                  {
                    label: "Interés cobrado",
                    value: totals.interestPaid,
                    icon: Percent,
                    colorClass: "kpi-icon-blue",
                    sub: "Rendimiento acumulado",
                  },
                ].map((kpi, i) => {
                  const Ic = kpi.icon;
                  return (
                    <motion.div
                      className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow"
                      key={kpi.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono truncate">
                          {kpi.label}
                        </span>
                        <div className={`w-8 h-8 rounded-xl ${kpi.colorClass} flex items-center justify-center shrink-0`}>
                          <Ic className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="font-heading text-lg sm:text-2xl font-extrabold text-on-surface tracking-tight truncate">
                          {money(kpi.value)}
                        </div>
                        <div className="mt-2 pt-2 border-t border-surface-container-low text-[10px] sm:text-[11px] text-on-surface-variant font-medium truncate">
                          {kpi.sub}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          }

          if (w.id === "regla_presupuesto") {
            return (
              <BudgetRuleWidget
                key={w.id}
                movimientos={movimientos}
              />
            );
          }

          if (w.id === "prestamos") {
            return (
              <div key={w.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <WalletCards className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface">
                        Deudores y préstamos prioritarios
                      </h2>
                      <p className="text-xs text-on-surface-variant hidden sm:block">
                        Préstamos activos más cercanos a vencimiento o en estado de cobro.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/prestamos"
                    className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-surface-container-high/50 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Ver todos</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-surface-container-lowest text-[10px] font-mono font-bold">
                      {prestamos.length}
                    </span>
                  </Link>
                </div>

                {prestamos.length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-8">No hay préstamos registrados aún.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {prestamosToShow.map((p, i) => {
                      const contactoNombre = rel(p.contactos)?.nombre ?? "—";
                      const balance = loanBalance(p);
                      const principal = Number(p.monto_principal) || 0;
                      const pagado = Math.max(0, principal - balance);
                      const pctAmortizado = principal > 0 ? Math.min(100, Math.round((pagado / principal) * 100)) : 0;
                      const isLate = p.estado === "atrasado";
                      const isPaid = p.estado === "pagado";
                      const monthlyInt = monthlyInterest(p);

                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: Math.min(i * 0.04, 0.2) }}
                          className="bg-surface-container-low/40 hover:bg-surface-container-low/80 border border-surface-container-high/70 hover:border-primary/40 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
                        >
                          <div>
                            {/* Header del préstamo */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <ContactAvatar
                                  name={contactoNombre}
                                  size={36}
                                  className="rounded-full shadow-2xs shrink-0"
                                />
                                <div className="min-w-0">
                                  <h4 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                                    {contactoNombre}
                                  </h4>
                                  <p className="text-xs text-on-surface-variant truncate">{p.nombre}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
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

                            {/* Barra visual de amortización */}
                            <div className="space-y-1 mb-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-on-surface-variant font-medium">Amortizado</span>
                                <span className="font-mono font-semibold text-on-surface">{pctAmortizado}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isPaid ? "bg-teal-500" : isLate ? "bg-rose-500" : "bg-primary"
                                  }`}
                                  style={{ width: `${pctAmortizado}%` }}
                                />
                              </div>
                            </div>

                            {/* Cifras clave y micro-píldoras */}
                            <div className="space-y-2 mb-3">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[10px] uppercase font-semibold text-on-surface-variant">Saldo por cobrar</span>
                                <span className="font-mono font-extrabold text-base text-primary">
                                  {money(balance > 0 ? balance : principal)}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="tech-pill font-mono">Orig: {money(principal)}</span>
                                {p.cobra_interes ? (
                                  <span className="tech-pill font-mono">+{p.tasa_interes_mensual}%</span>
                                ) : (
                                  <span className="tech-pill">Sin int.</span>
                                )}
                                <span className={`tech-pill ${
                                  p.vence_hoy
                                    ? "border-amber-500/50 text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10"
                                    : isLate
                                    ? "border-rose-500/50 text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10"
                                    : ""
                                }`}>
                                  {p.vence_hoy
                                    ? "¡Vence hoy!"
                                    : isLate
                                    ? `${p.meses_atrasados > 0 ? `${p.meses_atrasados} ${p.meses_atrasados === 1 ? "cuota atrasada" : "cuotas atrasadas"}` : "Con atraso"} (${p.dias_atraso} ${p.dias_atraso === 1 ? "día" : "días"})`
                                    : p.fecha_proximo_pago
                                    ? `Vence: ${formatDateEs(p.fecha_proximo_pago)}`
                                    : `Día ${p.dia_pago}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Botones de acción */}
                          <div className="pt-2 border-t border-surface-container-high/40 flex items-center justify-between gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => onOpenKardex(p.id)}
                              className="text-on-surface-variant hover:text-primary font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>Expediente</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => openModal("payment", { loanId: p.id })}
                                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <ReceiptText className="w-3.5 h-3.5" />
                                <span>Cobrar</span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (w.id === "movimientos" && movimientos.length > 0) {
            return (
              <div key={w.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface">Movimientos recientes</h2>
                      <p className="text-xs text-on-surface-variant hidden sm:block">Últimos ingresos, gastos y cobros registrados.</p>
                    </div>
                  </div>
                  <Link href="/movimientos" className="text-xs font-bold text-primary hover:underline">
                    Ver todos
                  </Link>
                </div>
                <div className="space-y-2">
                  {movimientos.slice(0, 5).map((m) => {
                    const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
                      || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
                    const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
                    const cuentaNombre = (Array.isArray(m.cuentas_dinero)
                      ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
                      : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "—";
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low/40 hover:bg-surface-container-low/80 border border-surface-container-high/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                            isPositive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                          }`}>
                            {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-on-surface truncate">{fixSpanishEncoding(m.descripcion || badge.label)}</p>
                              <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${badge.badgeClass}`}>
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
                            <p className="text-[11px] text-on-surface-variant truncate">
                              {formatDateEs(m.ocurrido_en)} · {cuentaNombre}
                            </p>
                          </div>
                        </div>
                        <span className={`font-mono text-xs sm:text-sm font-bold shrink-0 whitespace-nowrap ${
                          isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"
                        }`}>
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
              <div key={w.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
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
  openLoanForContact,
  onOpenFicha,
  espacioId,
  loadData,
  setSuccessNotice,
  onVerNota,
}: {
  contactos: Contacto[];
  prestamos: Prestamo[];
  openModal: () => void;
  openLoanForContact: (contactId: string) => void;
  onOpenFicha: (contacto: Contacto, tab: "ficha" | "editar") => void;
  espacioId: string;
  loadData: () => Promise<void>;
  setSuccessNotice: (msg: string | null) => void;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "con_deuda" | "atrasados" | "sin_deuda">("todos");
  const [showArchivados, setShowArchivados] = useState(false);
  const [contactosArchivados, setContactosArchivados] = useState<Contacto[]>([]);
  const [loadingArchivados, setLoadingArchivados] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "compact">(() => {
    if (typeof window === "undefined") return "grid";
    try {
      return (localStorage.getItem("finpal_contactos_view") as "grid" | "compact") || "grid";
    } catch {
      return "grid";
    }
  });

  const cargarArchivados = useCallback(async () => {
    if (!espacioId) return;
    setLoadingArchivados(true);
    try {
      const data = await getContactosArchivados(espacioId);
      setContactosArchivados(data as Contacto[]);
    } finally {
      setLoadingArchivados(false);
    }
  }, [espacioId]);

  const toggleArchivados = async () => {
    const next = !showArchivados;
    setShowArchivados(next);
    if (next) await cargarArchivados();
  };

  const handleReactivar = async (contacto: Contacto) => {
    const res = await reactivarContacto(contacto.id, espacioId);
    if ("error" in res && res.error) {
      setSuccessNotice(res.error);
      return;
    }
    setSuccessNotice(`¡Contacto "${contacto.nombre}" reactivado!`);
    await loadData();
    await cargarArchivados();
  };

  const contactosFiltrados = useMemo(() => {
    return contactos.filter((c) => {
      const allLoans = prestamos.filter((l) => rel(l.contactos)?.id === c.id);
      const activeLoans = allLoans.filter((l) => l.estado === "activo" || l.estado === "atrasado");
      const isLate = activeLoans.some((l) => l.estado === "atrasado");

      if (filtroEstado === "con_deuda" && activeLoans.length === 0) return false;
      if (filtroEstado === "atrasados" && !isLate) return false;
      if (filtroEstado === "sin_deuda" && activeLoans.length > 0) return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const matchNombre = c.nombre.toLowerCase().includes(q);
        const matchTel = (c.telefono ?? "").toLowerCase().includes(q);
        const matchEmail = (c.email ?? "").toLowerCase().includes(q);
        if (!matchNombre && !matchTel && !matchEmail) return false;
      }
      return true;
    });
  }, [contactos, prestamos, filtroEstado, busqueda]);

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
          <p className="text-xs text-on-surface-variant mt-0.5">Directorio de personas, historial crediticio, deudas activas y contacto directo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleArchivados}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              showArchivados
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>{showArchivados ? "Ocultar archivados" : "Archivados"}</span>
          </button>
          <button className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
            <Plus className="w-4 h-4" /><span>Nuevo contacto</span>
          </button>
        </div>
      </motion.div>

      {/* Barra de Filtros, Búsqueda y Selector de Modo */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl overflow-x-auto">
          {[
            { id: "todos", label: `Todos (${contactos.length})` },
            { id: "con_deuda", label: "Con deuda activa" },
            { id: "atrasados", label: "Con atraso" },
            { id: "sin_deuda", label: "Sin deuda" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroEstado(f.id as typeof filtroEstado)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filtroEstado === f.id
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, teléfono o correo..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Conmutador de visualización */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                try { localStorage.setItem("finpal_contactos_view", "grid"); } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista de cuadrícula de tarjetas de contactos"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("compact");
                try { localStorage.setItem("finpal_contactos_view", "compact"); } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista en lista compacta"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista vacía */}
      {contactosFiltrados.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-8 sm:p-12 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
            <UsersRound className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-on-surface">
            {contactos.length === 0 ? "Sin contactos registrados aún" : "No se encontraron contactos"}
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {contactos.length === 0
              ? "Registra personas con las que compartes gastos, préstamos o cobros para llevar un registro claro."
              : "Intenta cambiar el criterio de búsqueda o el filtro de estado."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* VISTA 1: Cuadrícula de Tarjetas Tech Minimalistas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contactosFiltrados.map((c, i) => {
            const allLoans = prestamos.filter((l) => rel(l.contactos)?.id === c.id);
            const activeLoans = allLoans.filter((l) => l.estado === "activo" || l.estado === "atrasado");
            const paidLoans = allLoans.filter((l) => l.estado === "pagado");
            const balance = activeLoans.reduce((sum, l) => sum + loanBalance(l), 0);
            const isLate = activeLoans.some((l) => l.estado === "atrasado");

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.16 } }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.25) }}
                className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 group"
              >
                {/* Cabecera del Contacto */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ContactAvatar name={c.nombre} size={40} className="rounded-full shadow-2xs shrink-0" />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onOpenFicha(c, "ficha")}
                        className="font-bold text-sm text-on-surface hover:text-primary truncate block transition-colors text-left cursor-pointer"
                        title="Ver ficha 360°"
                      >
                        {c.nombre}
                      </button>
                      {c.telefono ? (
                        <a
                          href={`tel:${c.telefono}`}
                          className="text-[11px] text-on-surface-variant hover:text-primary transition-colors block truncate font-mono"
                          title="Llamar contacto"
                        >
                          {c.telefono}
                        </a>
                      ) : (
                        <span className="text-[11px] text-on-surface-variant/60 italic block">Sin teléfono</span>
                      )}
                    </div>
                  </div>

                  {/* Estado / Reputación con punto estilo Safari */}
                  <div className="shrink-0">
                    {activeLoans.length > 0 ? (
                      isLate ? (
                        <span className="badge-atrasado px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                          <span className="safari-dot-red" />
                          Atrasado
                        </span>
                      ) : (
                        <span className="badge-al-dia px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                          <span className="safari-dot-green" />
                          Al día
                        </span>
                      )
                    ) : (
                      <span className="badge-saldado px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                        <span className="safari-dot-blue" />
                        Sin deuda
                      </span>
                    )}
                  </div>
                </div>

                {/* Resumen Deuda Activa */}
                <div className="space-y-1.5 py-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                      Deuda Activa
                    </span>
                    <span className={`font-mono text-lg font-extrabold ${balance > 0 ? "text-primary" : "text-on-surface-variant/60"}`}>
                      {money(balance)}
                    </span>
                  </div>

                  {/* Micro-píldoras monocromáticas estilo Tech Stack (como la referencia) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="tech-pill">
                      {allLoans.length} préstamo{allLoans.length === 1 ? "" : "s"}
                    </span>
                    {paidLoans.length > 0 && (
                      <span className="tech-pill text-emerald-600 dark:text-emerald-400">
                        {paidLoans.length} saldado{paidLoans.length === 1 ? "" : "s"}
                      </span>
                    )}
                    {c.email && (
                      <span className="tech-pill max-w-[140px] truncate" title={c.email}>
                        {c.email}
                      </span>
                    )}
                    {c.notas && (
                      <button
                        type="button"
                        onClick={() => onVerNota("Notas del contacto", c.nombre, c.notas)}
                        className="tech-pill hover:border-primary/40 cursor-pointer"
                        title="Ver notas"
                      >
                        <FileText className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate max-w-[110px]">{c.notas}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas Minimalistas (estilo Links GitHub / Tech) */}
                <div className="pt-2.5 border-t border-surface-container-high/50 flex items-center justify-between gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onOpenFicha(c, "ficha")}
                    className="text-on-surface-variant hover:text-primary font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Ver ficha 360° e historial de operaciones"
                  >
                    <span>Ficha 360°</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenFicha(c, "editar")}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                      title="Editar datos del contacto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openLoanForContact(c.id)}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all border border-primary/20 shadow-2xs active:scale-95"
                      title="Otorgar nuevo préstamo a este contacto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Préstamo</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: Lista Compacta Tech */
        <div className="space-y-2.5">
          {contactosFiltrados.map((c, i) => {
            const allLoans = prestamos.filter((l) => rel(l.contactos)?.id === c.id);
            const activeLoans = allLoans.filter((l) => l.estado === "activo" || l.estado === "atrasado");
            const paidLoans = allLoans.filter((l) => l.estado === "pagado");
            const balance = activeLoans.reduce((sum, l) => sum + loanBalance(l), 0);
            const isLate = activeLoans.some((l) => l.estado === "atrasado");

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -1, transition: { duration: 0.14 } }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                className="bg-surface-container-lowest border border-surface-container-high/80 rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Persona y datos */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <ContactAvatar name={c.nombre} size={36} className="rounded-full shadow-2xs shrink-0" />
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenFicha(c, "ficha")}
                      className="font-bold text-sm text-on-surface hover:text-primary truncate block transition-colors text-left cursor-pointer"
                    >
                      {c.nombre}
                    </button>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
                      <span>{c.telefono || "Sin tel."}</span>
                      {c.notas && (
                        <button
                          type="button"
                          onClick={() => onVerNota("Notas del contacto", c.nombre, c.notas)}
                          className="text-primary hover:underline font-sans cursor-pointer text-[11px]"
                        >
                          Nota
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Píldoras informativas */}
                <div className="flex flex-wrap items-center gap-1.5 flex-1 md:justify-center">
                  <span className="tech-pill">{allLoans.length} préstamos</span>
                  {paidLoans.length > 0 && <span className="tech-pill text-emerald-600 dark:text-emerald-400">{paidLoans.length} saldados</span>}
                </div>

                {/* Saldo y Estado */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-primary block">
                      {money(balance)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
                      Deuda activa
                    </span>
                  </div>

                  <div className="shrink-0">
                    {activeLoans.length > 0 ? (
                      isLate ? (
                        <span className="badge-atrasado px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                          <span className="safari-dot-red" />
                          Atrasado
                        </span>
                      ) : (
                        <span className="badge-al-dia px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                          <span className="safari-dot-green" />
                          Al día
                        </span>
                      )
                    ) : (
                      <span className="badge-saldado px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                        <span className="safari-dot-blue" />
                        Sin deuda
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenFicha(c, "ficha")}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Ver ficha 360°"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenFicha(c, "editar")}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                      title="Editar contacto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openLoanForContact(c.id)}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all border border-primary/20 shadow-2xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Préstamo</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}    </div>
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
  const dotCls =
    estado === "atrasado"
      ? "safari-dot-red"
      : estado === "pagado"
      ? "safari-dot-blue"
      : estado === "cancelado"
      ? "w-1.5 h-1.5 rounded-full bg-slate-400"
      : "safari-dot-green";

  return (
    <div className="has-custom-chevron relative inline-flex items-center shrink-0">
      <span className={`absolute left-2.5 pointer-events-none ${dotCls}`} />
      <select
        value={estado}
        onChange={(event) => onChange(event.target.value as "activo" | "pagado" | "atrasado" | "cancelado")}
        className={`no-bg-chevron appearance-none w-[124px] pl-5.5 pr-6 py-1 rounded-md text-[11px] font-semibold border cursor-pointer transition-all focus:outline-none focus:ring-1 focus:ring-primary/30 shadow-2xs ${
          estado === "atrasado" ? "badge-atrasado" :
          estado === "pagado" ? "badge-saldado" :
          estado === "cancelado" ? "badge-neutral" :
          "badge-al-dia"
        }`}
        aria-label={`Estado de ${nombre}`}
      >
        <option value="activo" className="bg-surface text-on-surface">Al día</option>
        <option value="atrasado" className="bg-surface text-on-surface">Atrasado</option>
        <option value="pagado" className="bg-surface text-on-surface">Saldado</option>
        <option value="cancelado" className="bg-surface text-on-surface">Cancelado</option>
      </select>
      <ChevronDown className="w-3 h-3 absolute right-2 pointer-events-none text-current opacity-70" />
    </div>
  );
}

function PrestamosView({
  prestamos,
  pagos,
  espacioId,
  loadData,
  setSuccessNotice,
  openModal,
  onCobrarPrestamo,
  onOpenSimulador,
  onOpenKardex,
  onStatusChange,
  onVerNota,
}: {
  prestamos: Prestamo[];
  pagos: Pago[];
  espacioId: string;
  loadData: () => Promise<void>;
  setSuccessNotice: (msg: string | null) => void;
  openModal: () => void;
  onCobrarPrestamo: (loanId: string) => void;
  onOpenSimulador: () => void;
  onOpenKardex: (loanId: string) => void;
  onStatusChange: (prestamoId: string, estado: "activo" | "pagado" | "atrasado" | "cancelado") => Promise<void>;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  const [tab, setTab] = useState<"activos" | "pagados">("activos");
  const [busqueda, setBusqueda] = useState("");
  const [subFiltro, setSubFiltro] = useState<"todos" | "al_dia" | "atrasados" | "vencen_hoy">("todos");
  const [prestamoAAnular, setPrestamoAAnular] = useState<Prestamo | null>(null);
  const [isAnulandoPrestamo, setIsAnulandoPrestamo] = useState(false);

  const handleConfirmAnularPrestamo = async () => {
    if (!prestamoAAnular || !espacioId) return;
    setIsAnulandoPrestamo(true);
    try {
      const res = await anularPrestamo(prestamoAAnular.id, espacioId);
      if ("error" in res && res.error) {
        setSuccessNotice(res.error);
      } else if ("success" in res && res.success) {
        setSuccessNotice(res.message);
        await loadData();
      }
    } finally {
      setIsAnulandoPrestamo(false);
      setPrestamoAAnular(null);
    }
  };
  const [viewMode, setViewMode] = useState<"grid" | "compact">(() => {
    if (typeof window === "undefined") return "grid";
    try {
      return (localStorage.getItem("finpal_prestamos_view") as "grid" | "compact") || "grid";
    } catch {
      return "grid";
    }
  });

  const activos = prestamos.filter((p) => p.estado === "activo" || p.estado === "atrasado");
  const pagados = prestamos.filter((p) => p.estado === "pagado" || p.estado === "cancelado");
  const vencenHoy = activos.filter((p) => p.vence_hoy);
  const baseDisplayed = tab === "activos" ? activos : pagados;

  const metricasCartera = useMemo(() => {
    let capitalEnCalle = 0;
    let capitalHistoricoTotal = 0;
    let capitalEnMora = 0;
    let atrasadosCount = 0;
    let activosCount = 0;
    let interesCobradoTotal = 0;

    for (const p of prestamos) {
      const balance = loanBalance(p);
      const principal = Number(p.monto_principal) || 0;
      capitalHistoricoTotal += principal;
      interesCobradoTotal += Number(p.interes_pagado_total) || 0;

      if (p.estado !== "pagado" && p.estado !== "cancelado") {
        capitalEnCalle += balance;
        activosCount++;
        if (p.estado === "atrasado" || p.meses_atrasados > 0) {
          capitalEnMora += balance;
          atrasadosCount++;
        }
      }
    }

    return {
      capitalEnCalle,
      capitalHistoricoTotal,
      capitalEnMora,
      atrasadosCount,
      activosCount,
      interesCobradoTotal,
    };
  }, [prestamos]);

  const displayed = useMemo(() => {
    return baseDisplayed.filter((l) => {
      if (tab === "activos") {
        if (subFiltro === "al_dia" && l.estado !== "activo") return false;
        if (subFiltro === "atrasados" && l.estado !== "atrasado") return false;
        if (subFiltro === "vencen_hoy" && !l.vence_hoy) return false;
      }
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const contactoNombre = (rel(l.contactos)?.nombre ?? "").toLowerCase();
        const prestamoNombre = l.nombre.toLowerCase();
        if (!contactoNombre.includes(q) && !prestamoNombre.includes(q)) return false;
      }
      return true;
    });
  }, [baseDisplayed, tab, subFiltro, busqueda]);

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
          <p className="text-xs text-on-surface-variant mt-0.5">Cartera de créditos, amortizaciones, simulador y expedientes activos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenSimulador}
            className="px-3.5 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Calculator className="w-4 h-4 text-primary" />
            <span>Simulador</span>
          </button>
          <button className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
            <Plus className="w-4 h-4" /><span>Nuevo préstamo</span>
          </button>
        </div>
      </motion.div>

      {/* Resumen rápido de cartera: Total prestado, activo, mora e intereses */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.02 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4"
      >
        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono">
              Total Prestado Activo
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <HandCoins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-heading text-lg sm:text-2xl font-extrabold text-primary tracking-tight">
              {money(metricasCartera.capitalEnCalle)}
            </div>
            <div className="mt-1 text-[11px] text-on-surface-variant">
              {metricasCartera.activosCount} {metricasCartera.activosCount === 1 ? "préstamo activo" : "préstamos activos"} en curso
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono">
              Colocado Histórico
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="font-heading text-lg sm:text-2xl font-extrabold text-on-surface tracking-tight">
              {money(metricasCartera.capitalHistoricoTotal)}
            </div>
            <div className="mt-1 text-[11px] text-on-surface-variant">
              {prestamos.length} {prestamos.length === 1 ? "préstamo histórico" : "préstamos históricos"} otorgados
            </div>
          </div>
        </div>

        <div className={`bg-surface-container-lowest border rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between ${
          metricasCartera.atrasadosCount > 0 ? "border-rose-500/40 bg-rose-500/[0.02]" : "border-surface-container-high/70"
        }`}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono">
              En Mora / Retraso
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              metricasCartera.atrasadosCount > 0 ? "bg-rose-500/15 text-rose-600 dark:text-rose-400" : "bg-surface-container text-on-surface-variant"
            }`}>
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`font-heading text-lg sm:text-2xl font-extrabold tracking-tight ${
              metricasCartera.atrasadosCount > 0 ? "text-rose-600 dark:text-rose-400" : "text-on-surface"
            }`}>
              {money(metricasCartera.capitalEnMora)}
            </div>
            <div className="mt-1 text-[11px] text-on-surface-variant">
              {metricasCartera.atrasadosCount > 0
                ? `${metricasCartera.atrasadosCount} ${metricasCartera.atrasadosCount === 1 ? "préstamo con atraso" : "préstamos con atraso"}`
                : "Cartera 100% al día"}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono">
              Interés Cobrado
            </span>
            <Link
              href="/reportes"
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
              title="Ver análisis visual y gráficos de cartera"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gráficos</span>
            </Link>
          </div>
          <div className="mt-2">
            <div className="font-heading text-lg sm:text-2xl font-extrabold text-on-surface tracking-tight">
              {money(metricasCartera.interesCobradoTotal)}
            </div>
            <div className="mt-1 text-[11px] text-on-surface-variant">
              Rendimiento acumulado
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs activos / saldados + Buscador + Conmutador de vista */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, delay: 0.03 }}
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 bg-surface-container-low p-1 rounded-xl w-full sm:w-fit">
            <button
              type="button"
              onClick={() => setTab("activos")}
              className={`px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
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
              className={`px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
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
          </div>

          {tab === "activos" && (
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl overflow-x-auto">
              {[
                { id: "todos", label: "Todos" },
                { id: "al_dia", label: "Al día" },
                { id: "atrasados", label: "Con atraso" },
                { id: "vencen_hoy", label: "Vencen hoy" },
              ].map((sf) => (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => setSubFiltro(sf.id as typeof subFiltro)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    subFiltro === sf.id
                      ? "bg-surface-container-lowest text-on-surface shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {sf.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar deudor o concepto..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de modo: Cuadrícula visual vs Lista compacta */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                try { localStorage.setItem("finpal_prestamos_view", "grid"); } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista en tarjetas ricas e interactivas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("compact");
                try { localStorage.setItem("finpal_prestamos_view", "compact"); } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista compacta en lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {vencenHoy.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, delay: 0.05 }}
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-900 dark:text-amber-200"
        >
          <Calendar className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs">
            <strong>{vencenHoy.length} {vencenHoy.length === 1 ? "préstamo vence" : "préstamos vencen"} hoy.</strong>{" "}
            Es el día de abono esperado; si no registras un cobro hoy, mañana aparecerá automáticamente como atrasado.
          </p>
        </motion.div>
      )}

      {/* Lista vacía */}
      {displayed.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-8 sm:p-12 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
            <HandCoins className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-on-surface">
            {tab === "activos" ? "Sin préstamos activos por cobrar" : "Sin préstamos saldados"}
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {tab === "activos"
              ? "No hay saldos pendientes en esta vista. Puedes otorgar un nuevo préstamo o cambiar los filtros."
              : "Los préstamos totalmente liquidados aparecerán aquí como historial."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* VISTA 1: Cuadrícula de Tarjetas Tech Minimalistas */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.map((l, i) => {
            const nombre = rel(l.contactos)?.nombre ?? "—";
            const isPaid = l.estado === "pagado" || l.estado === "cancelado";
            const saldo = loanBalance(l);
            const principal = Number(l.monto_principal);
            const pagadoCap = Number(l.monto_capital_pagado);
            const pctAmortizado = principal > 0 ? Math.min(100, Math.round((pagadoCap / principal) * 100)) : 0;

            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.16 } }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.25) }}
                className={`bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 group ${
                  isPaid ? "opacity-75" : ""
                }`}
              >
                {/* Cabecera de la tarjeta: Contacto + Estado */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ContactAvatar name={nombre} size={40} className="rounded-full shadow-2xs shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {nombre}
                      </h4>
                      <button
                        type="button"
                        onClick={() => onOpenKardex(l.id)}
                        className="text-xs text-on-surface-variant font-medium truncate block hover:text-primary hover:underline transition-colors text-left"
                        title="Abrir expediente del préstamo"
                      >
                        {l.nombre}
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <EstadoPrestamoSelect
                      estado={l.estado}
                      nombre={l.nombre}
                      onChange={(nuevoEstado) => onStatusChange(l.id, nuevoEstado)}
                    />
                  </div>
                </div>

                {/* Saldo y Amortización Visual Compacta */}
                <div className="space-y-1.5 py-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                      {tab === "activos" ? "Saldo por cobrar" : "Capital saldado"}
                    </span>
                    <span className="font-mono text-lg sm:text-xl font-extrabold text-primary">
                      {isPaid ? money(pagadoCap) : money(saldo)}
                    </span>
                  </div>

                  {/* Micro-barra de amortización */}
                  <div className="h-1.5 w-full bg-surface-container-high/60 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${pctAmortizado}%` }}
                    />
                  </div>

                  {/* Micro-píldoras monocromáticas de stack / tech (como la referencia) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="tech-pill font-mono">{pctAmortizado}% amortizado</span>
                    <span className="tech-pill font-mono">Orig: {money(principal)}</span>
                    {l.cobra_interes ? (
                      <span className="tech-pill font-mono">{l.tasa_interes_mensual}% mensual</span>
                    ) : (
                      <span className="tech-pill">Sin interés</span>
                    )}
                    <span className={`tech-pill ${
                      l.vence_hoy
                        ? "border-amber-500/50 text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10"
                        : l.meses_atrasados > 0
                        ? "border-rose-500/50 text-rose-600 dark:text-rose-400 font-semibold bg-rose-500/10"
                        : ""
                    }`}>
                      {l.vence_hoy
                        ? "¡Vence hoy!"
                        : l.meses_atrasados > 0
                        ? `${l.meses_atrasados} ${l.meses_atrasados === 1 ? "cuota atrasada" : "cuotas atrasadas"} (${l.dias_atraso} ${l.dias_atraso === 1 ? "día" : "días"})`
                        : l.fecha_proximo_pago
                        ? `Vence: ${formatDateEs(l.fecha_proximo_pago)}`
                        : "Al día"}
                    </span>
                    {l.notas && (
                      <button
                        type="button"
                        onClick={() => onVerNota("Notas del préstamo", `${nombre} · ${l.nombre}`, l.notas)}
                        className="tech-pill hover:border-primary/40 cursor-pointer"
                        title="Ver notas"
                      >
                        <FileText className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate max-w-[100px]">{l.notas}</span>
                      </button>
                    )}
                  </div>

                  {/* Desglose explícito de fechas vencidas para eliminar necesidad de calcular */}
                  {l.meses_atrasados > 0 && (() => {
                    const vencidas = (l.periodos_sugeridos ?? []).filter((p) => p.estado === "vencido");
                    if (vencidas.length === 0) return null;
                    return (
                      <div className="mt-1.5 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 dark:text-rose-400">
                          <span className="truncate">Debe {vencidas.length} {vencidas.length === 1 ? "cuota" : "cuotas"}:</span>
                          {l.cobra_interes && (
                            <span className="font-mono font-extrabold shrink-0">
                              {money(monthlyInterest(l) * l.meses_atrasados)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {vencidas.map((v) => (
                            <span
                              key={v.fecha}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container-lowest/90 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                              title={`Venció el ${formatDateEs(v.fecha)} (${v.dias_diferencia} días atrasada)`}
                            >
                              <span>{v.mes_nombre} ({formatDateEs(v.fecha)})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Botones de acción minimalistas (estilo Links GitHub / Tech) */}
                <div className="pt-2.5 border-t border-surface-container-high/50 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenKardex(l.id)}
                      className="text-on-surface-variant hover:text-primary font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Ver extracto, simulación y expediente completo"
                    >
                      <span>Expediente</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrestamoAAnular(l)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Eliminar y revertir préstamo (devuelve capital a la cuenta)"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => onCobrarPrestamo(l.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-95 ml-auto"
                      title="Registrar cobro de cuota o capital"
                    >
                      <ReceiptText className="w-3.5 h-3.5" />
                      <span>Cobrar</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: Lista Compacta Tech */
        <div className="space-y-2.5">
          {displayed.map((l, i) => {
            const nombre = rel(l.contactos)?.nombre ?? "—";
            const isPaid = l.estado === "pagado" || l.estado === "cancelado";
            const saldo = loanBalance(l);
            const principal = Number(l.monto_principal);
            const pagadoCap = Number(l.monto_capital_pagado);
            const pctAmortizado = principal > 0 ? Math.min(100, Math.round((pagadoCap / principal) * 100)) : 0;

            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -1, transition: { duration: 0.14 } }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                className={`bg-surface-container-lowest border border-surface-container-high/80 rounded-xl p-3.5 sm:px-4 sm:py-3 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isPaid ? "opacity-75" : ""
                }`}
              >
                {/* Info del deudor */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <ContactAvatar name={nombre} size={36} className="rounded-full shadow-2xs shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-on-surface truncate">{nombre}</h4>
                      <span className="text-xs text-on-surface-variant font-medium truncate">· {l.nombre}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/80">
                      <span>Inició: {formatDateEs(l.fecha_inicio || l.created_at)}</span>
                      {l.notas && (
                        <button
                          type="button"
                          onClick={() => onVerNota("Notas del préstamo", `${nombre} · ${l.nombre}`, l.notas)}
                          className="text-primary hover:underline cursor-pointer font-medium"
                        >
                          Nota
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Barra de progreso y saldo */}
                <div className="flex-1 max-w-sm space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      {isPaid ? "Capital saldado:" : "Por cobrar:"}
                    </span>
                    <span className="font-mono font-bold text-primary">{isPaid ? money(pagadoCap) : money(saldo)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-high/60 rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${pctAmortizado}%` }} />
                  </div>
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="tech-pill font-mono">{pctAmortizado}%</span>
                    <span className="tech-pill font-mono">Orig: {money(principal)}</span>
                    {l.cobra_interes && <span className="tech-pill font-mono">{l.tasa_interes_mensual}%</span>}
                  </div>
                </div>

                {/* Vencimiento y Estado */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right min-w-[130px] hidden sm:block">
                    <span className={`text-xs block font-semibold ${
                      l.vence_hoy ? "text-amber-600 font-bold" : l.meses_atrasados > 0 ? "text-error font-bold" : "text-on-surface"
                    }`}>
                      {l.vence_hoy
                        ? "¡Vence Hoy!"
                        : l.meses_atrasados > 0
                        ? `${l.meses_atrasados} ${l.meses_atrasados === 1 ? "cuota atrasada" : "cuotas atrasadas"} (${l.dias_atraso}d)`
                        : l.fecha_proximo_pago
                        ? formatDateEs(l.fecha_proximo_pago)
                        : "Al día"}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block">
                      {l.meses_atrasados > 0 && l.periodos_sugeridos && l.periodos_sugeridos.some((p) => p.estado === "vencido") ? (
                        <span className="text-error font-semibold">
                          Debe: {l.periodos_sugeridos.filter((p) => p.estado === "vencido").map((p) => p.mes_nombre.split(" ")[0]).join(", ")}
                        </span>
                      ) : l.cobra_interes ? (
                        `${l.tasa_interes_mensual}% int.`
                      ) : (
                        "Sin interés"
                      )}
                    </span>
                  </div>

                  <EstadoPrestamoSelect
                    estado={l.estado}
                    nombre={l.nombre}
                    onChange={(nuevoEstado) => onStatusChange(l.id, nuevoEstado)}
                  />
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-surface-container-low">
                  <button
                    type="button"
                    onClick={() => onOpenKardex(l.id)}
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Ver expediente del préstamo"
                  >
                    <ArrowUpRight className="w-4 h-4 text-primary" />
                    <span className="hidden lg:inline">Expediente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrestamoAAnular(l)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                    title="Eliminar y revertir préstamo"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={() => onCobrarPrestamo(l.id)}
                      className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-all shadow-xs active:scale-95"
                      title="Registrar cobro"
                    >
                      <ReceiptText className="w-3.5 h-3.5" />
                      <span>Cobrar</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {prestamoAAnular && (() => {
        const deudorNombre = rel(prestamoAAnular.contactos)?.nombre ?? "Deudor";
        const cobrosCount = pagos.filter(
          (pg) => pg.prestamo_id === prestamoAAnular.id || rel(pg.prestamos)?.id === prestamoAAnular.id
        ).length;
        return (
          <ConfirmDialog
            isOpen={true}
            title="¿Eliminar y revertir este préstamo?"
            description={
              <div className="space-y-2.5 text-xs text-on-surface-variant">
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/70 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-on-surface block">
                      {deudorNombre} · {prestamoAAnular.nombre}
                    </span>
                    <span className="text-[11px]">
                      Inició el {formatDateEs(prestamoAAnular.fecha_inicio)}
                    </span>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                    {money(Number(prestamoAAnular.monto_principal))}
                  </span>
                </div>
                <p className="leading-relaxed">
                  Se eliminará el préstamo por completo y se devolverá el capital desembolsado (
                  <strong className="font-mono text-on-surface">
                    {money(Number(prestamoAAnular.monto_principal))}
                  </strong>
                  ) al saldo de la cuenta de origen.
                  {cobrosCount > 0
                    ? ` Además, se revertirán los ${cobrosCount} cobro(s) registrado(s) de este préstamo para dejar tus cuentas cuadradas.`
                    : ""}{" "}
                  Esta acción quedará registrada en la bitácora de auditoría.
                </p>
              </div>
            }
            useSlider={true}
            sliderLabel="Desliza para eliminar y revertir préstamo"
            submitting={isAnulandoPrestamo}
            variant="danger"
            onConfirm={handleConfirmAnularPrestamo}
            onCancel={() => !isAnulandoPrestamo && setPrestamoAAnular(null)}
          />
        );
      })()}
    </div>
  );
}

function PagosView({
  pagos,
  openModal,
  onVerRecibo,
  espacioId,
  loadData,
  setSuccessNotice,
  onVerNota,
}: {
  pagos: Pago[];
  openModal: () => void;
  onVerRecibo: (pago: Pago) => void;
  espacioId: string;
  loadData: () => Promise<void>;
  setSuccessNotice: (msg: string | null) => void;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTiempo, setFiltroTiempo] = useState<"todos" | "este_mes" | "puntuales" | "atrasados">("todos");
  const [pagoAAnular, setPagoAAnular] = useState<Pago | null>(null);
  const [isAnulando, setIsAnulando] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "compact">(() => {
    if (typeof window === "undefined") return "grid";
    try {
      return (localStorage.getItem("finpal_pagos_view") as "grid" | "compact") || "grid";
    } catch {
      return "grid";
    }
  });

  const pagosFiltrados = useMemo(() => {
    const thisMonthPrefix = new Date().toISOString().slice(0, 7);
    return pagos.filter((p) => {
      if (filtroTiempo === "este_mes" && !p.recibido_en.startsWith(thisMonthPrefix)) return false;
      if (filtroTiempo === "puntuales" && p.fecha_esperada && p.recibido_en > p.fecha_esperada) return false;
      if (filtroTiempo === "atrasados" && (!p.fecha_esperada || p.recibido_en <= p.fecha_esperada)) return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const prestamo = rel(p.prestamos);
        const contactoNombre = (rel(prestamo?.contactos)?.nombre ?? "").toLowerCase();
        const prestamoNombre = (prestamo?.nombre ?? "").toLowerCase();
        const cuentaNombre = (rel(p.cuentas_dinero)?.nombre ?? "").toLowerCase();
        const montoStr = String(p.monto_total);
        if (
          !contactoNombre.includes(q) &&
          !prestamoNombre.includes(q) &&
          !cuentaNombre.includes(q) &&
          !montoStr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [pagos, filtroTiempo, busqueda]);

  const handleConfirmAnular = async () => {
    if (!pagoAAnular || !espacioId) return;
    setIsAnulando(true);
    try {
      const res = await anularPago(pagoAAnular.id, espacioId);
      if ("error" in res && res.error) {
        setSuccessNotice(res.error);
      } else if ("success" in res && res.success) {
        setSuccessNotice(res.message);
        await loadData();
      }
    } finally {
      setIsAnulando(false);
      setPagoAAnular(null);
    }
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
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cobros recibidos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Comprobantes digitales de pago, historial de cuotas y reversión segura.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Registrar cobro</span>
        </button>
      </motion.div>

      {/* Barra de Búsqueda, Filtros y Conmutador de Vista */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl overflow-x-auto">
          {[
            { id: "todos", label: `Todos (${pagos.length})` },
            { id: "este_mes", label: "Este mes" },
            { id: "puntuales", label: "En fecha / Anticipados" },
            { id: "atrasados", label: "Con retraso" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroTiempo(f.id as typeof filtroTiempo)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                filtroTiempo === f.id
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por deudor, préstamo o cuenta..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface focus:outline-none focus:border-primary"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Conmutador de visualización */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                try { localStorage.setItem("finpal_pagos_view", "grid"); } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista de cuadrícula de recibos"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("compact");
                try { localStorage.setItem("finpal_pagos_view", "compact"); } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista en lista compacta"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista vacía */}
      {pagosFiltrados.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-8 sm:p-12 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
            <ReceiptText className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-on-surface">
            {pagos.length === 0 ? "Sin cobros registrados aún" : "No se encontraron cobros"}
          </h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {pagos.length === 0
              ? "Cada vez que cobres una cuota o abono a capital, se generará un recibo digital aquí."
              : "Intenta ajustar el filtro de tiempo o el término de búsqueda."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* VISTA 1: Cuadrícula de Cobros Tech Minimalista */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagosFiltrados.map((p, i) => {
            const prestamo = rel(p.prestamos);
            const contacto = rel(prestamo?.contactos);
            const isLate = p.fecha_esperada && p.recibido_en > p.fecha_esperada;
            const isEarly = p.fecha_esperada && p.recibido_en < p.fecha_esperada;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.16 } }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.03, 0.25) }}
                className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 group"
              >
                {/* Cabecera del Cobro */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ContactAvatar name={contacto?.nombre ?? "—"} size={40} className="rounded-full shadow-2xs shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {contacto?.nombre ?? "—"}
                      </h4>
                      <p className="text-xs text-on-surface-variant truncate font-medium">
                        {prestamo?.nombre ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Estado de puntualidad con punto estilo Safari */}
                  <div className="shrink-0">
                    {p.metodo_pago === "Registro histórico" ? (
                      <span className="badge-blue px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Previo a FinPal
                      </span>
                    ) : isLate ? (
                      <span className="badge-atrasado px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                        <span className="safari-dot-red" />
                        Con retraso
                      </span>
                    ) : isEarly ? (
                      <span className="badge-blue px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                        <span className="safari-dot-blue" />
                        Anticipado
                      </span>
                    ) : (
                      <span className="badge-al-dia px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                        <span className="safari-dot-green" />
                        En fecha
                      </span>
                    )}
                  </div>
                </div>

                {/* Monto Total Cobrado */}
                <div className="space-y-1.5 py-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">
                      Monto Cobrado
                    </span>
                    <span className="font-mono text-xl font-extrabold text-primary">
                      {money(Number(p.monto_total))}
                    </span>
                  </div>

                  {/* Micro-píldoras monocromáticas de desglose */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="tech-pill font-mono">
                      Cap: {money(Number(p.monto_principal))}
                    </span>
                    {Number(p.monto_interes) > 0 && (
                      <span className="tech-pill font-mono text-emerald-600 dark:text-emerald-400">
                        Int: {money(Number(p.monto_interes))}
                      </span>
                    )}
                    {rel(p.cuentas_dinero)?.nombre && (
                      <span className="tech-pill">
                        {rel(p.cuentas_dinero)?.nombre}
                      </span>
                    )}
                    <span className="tech-pill font-mono">
                      {formatDateEs(p.recibido_en)}
                    </span>
                    {p.notas && (
                      <button
                        type="button"
                        onClick={() => onVerNota("Notas del cobro", `${contacto?.nombre ?? "—"} · ${formatDateEs(p.recibido_en)}`, p.notas)}
                        className="tech-pill hover:border-primary/40 cursor-pointer"
                        title="Ver notas"
                      >
                        <FileText className="w-3 h-3 text-primary shrink-0" />
                        <span className="truncate max-w-[100px]">{p.notas}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Acciones Rápidas Minimalistas */}
                <div className="pt-2.5 border-t border-surface-container-high/50 flex items-center justify-between gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onVerRecibo(p)}
                    className="text-on-surface-variant hover:text-primary font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                    title="Ver comprobante digital de cobro"
                  >
                    <span>Recibo digital</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPagoAAnular(p)}
                    className="p-1 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-surface-container transition-colors cursor-pointer"
                    title="Anular y revertir cobro"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: Lista Compacta Tech */
        <div className="space-y-2.5">
          {pagosFiltrados.map((p, i) => {
            const prestamo = rel(p.prestamos);
            const contacto = rel(prestamo?.contactos);
            const isLate = p.fecha_esperada && p.recibido_en > p.fecha_esperada;
            const isEarly = p.fecha_esperada && p.recibido_en < p.fecha_esperada;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -1, transition: { duration: 0.14 } }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                className="bg-surface-container-lowest border border-surface-container-high/80 rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                {/* Deudor y préstamo */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <ContactAvatar name={contacto?.nombre ?? "—"} size={36} className="rounded-full shadow-2xs shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-on-surface truncate">{contacto?.nombre ?? "—"}</h4>
                      <span className="text-xs text-on-surface-variant font-medium truncate">· {prestamo?.nombre ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant font-mono">
                      <span>{formatDateEs(p.recibido_en)}</span>
                      <span>·</span>
                      <span>{rel(p.cuentas_dinero)?.nombre ?? "—"}</span>
                    </div>
                  </div>
                </div>

                {/* Desglose tech-pills */}
                <div className="flex flex-wrap items-center gap-1.5 flex-1 md:justify-center">
                  <span className="tech-pill font-mono">Cap: {money(Number(p.monto_principal))}</span>
                  {Number(p.monto_interes) > 0 && (
                    <span className="tech-pill font-mono text-emerald-600 dark:text-emerald-400">
                      Int: {money(Number(p.monto_interes))}
                    </span>
                  )}
                </div>

                {/* Monto y Estado */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-primary block">
                      {money(Number(p.monto_total))}
                    </span>
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
                      {p.fecha_esperada ? formatMonthYear(p.fecha_esperada) : "Cobrado"}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {p.metodo_pago === "Registro histórico" ? (
                      <span className="badge-blue px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Previo a FinPal
                      </span>
                    ) : isLate ? (
                      <span className="badge-atrasado px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                        <span className="safari-dot-red" />
                        Retraso
                      </span>
                    ) : isEarly ? (
                      <span className="badge-blue px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                        <span className="safari-dot-blue" />
                        Anticipado
                      </span>
                    ) : (
                      <span className="badge-al-dia px-2 py-0.5 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5">
                        <span className="safari-dot-green" />
                        En fecha
                      </span>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onVerRecibo(p)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
                      title="Ver comprobante de cobro"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPagoAAnular(p)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-600 hover:bg-surface-container transition-colors cursor-pointer"
                      title="Anular cobro"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {pagoAAnular && (
        <ConfirmDialog
          isOpen={true}
          title="¿Deshacer y revertir este cobro?"
          description={
            <div className="space-y-2.5 text-xs text-on-surface-variant">
              <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/70 flex items-center justify-between">
                <div>
                  <span className="font-bold text-on-surface block">
                    {rel(rel(pagoAAnular.prestamos)?.contactos)?.nombre ?? "Deudor"} · {rel(pagoAAnular.prestamos)?.nombre ?? "Préstamo"}
                  </span>
                  <span className="text-[11px]">{formatDateEs(pagoAAnular.recibido_en)}</span>
                </div>
                <span className="font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                  {money(Number(pagoAAnular.monto_total))}
                </span>
              </div>
              <p className="leading-relaxed">
                Se revertirá este cobro por completo: se descontará el interés registrado por error, se restaurará el saldo pendiente del préstamo y se restará el monto cobrado de la cuenta de dinero. Quedará registrado en la auditoría.
              </p>
            </div>
          }
          useSlider={true}
          sliderLabel="Desliza para revertir el cobro"
          submitting={isAnulando}
          variant="danger"
          onConfirm={handleConfirmAnular}
          onCancel={() => !isAnulando && setPagoAAnular(null)}
        />
      )}
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
  glowCls: string;
  iconCls: string;
}

const ACCOUNT_CARD_THEMES: AccountTheme[] = [
  {
    id: "emerald",
    name: "Esmeralda FinPal",
    description: "Identidad insignia de FinPal con liquidez activa",
    dot: "#10b981",
    cardCls: "border-surface-container-high/80 hover:border-emerald-500/50",
    badgeCls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    glowCls: "",
    iconCls: "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "ocean",
    name: "Azul Océano",
    description: "Solidez bancaria y tesorería institucional",
    dot: "#3b82f6",
    cardCls: "border-surface-container-high/80 hover:border-blue-500/50",
    badgeCls: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
    glowCls: "",
    iconCls: "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
  },
  {
    id: "amber",
    name: "Ámbar Safari",
    description: "Fondos de emergencia y ahorro líquido",
    dot: "#f59e0b",
    cardCls: "border-surface-container-high/80 hover:border-amber-500/50",
    badgeCls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
    glowCls: "",
    iconCls: "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
  },
  {
    id: "rose",
    name: "Coral Carmesí",
    description: "Billeteras QR y consumo de flujo activo",
    dot: "#ef4444",
    cardCls: "border-surface-container-high/80 hover:border-rose-500/50",
    badgeCls: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
    glowCls: "",
    iconCls: "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400",
  },
  {
    id: "violet",
    name: "Violeta Cyber",
    description: "Fondos de inversión y reservas patrimoniales",
    dot: "#8b5cf6",
    cardCls: "border-surface-container-high/80 hover:border-violet-500/50",
    badgeCls: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/25",
    glowCls: "",
    iconCls: "bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-400",
  },
  {
    id: "obsidian",
    name: "Carbono Obsidian",
    description: "Acabado titanio grafito de alta precisión",
    dot: "#64748b",
    cardCls: "border-surface-container-high/80 hover:border-slate-500/50",
    badgeCls: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20",
    glowCls: "",
    iconCls: "bg-slate-500/10 border-slate-500/20 text-slate-700 dark:text-slate-300",
  },
  {
    id: "turquoise",
    name: "Menta Fintech",
    description: "Cajas chicas y operaciones operativas diarias",
    dot: "#14b8a6",
    cardCls: "border-surface-container-high/80 hover:border-teal-500/50",
    badgeCls: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
    glowCls: "",
    iconCls: "bg-teal-500/10 border-teal-500/25 text-teal-700 dark:text-teal-300",
  },
];

const TIPO_CONFIG: Record<string, { label: string; icon: typeof Wallet; desc: string }> = {
  efectivo: { label: "Efectivo", icon: Wallet, desc: "Caja física" },
  banco: { label: "Banco", icon: Landmark, desc: "Cuenta bancaria" },
  billetera_movil: { label: "Billetera QR", icon: QrCode, desc: "Billetera digital" },
  ahorro: { label: "Ahorros", icon: PiggyBank, desc: "Cuenta de ahorro" },
  otra: { label: "Cuenta", icon: CreditCard, desc: "Otra cuenta" },
};

function AccountCardItem({
  c,
  index,
  tipoLabel,
  themeId,
  onEdit,
  onDelete,
  onOpenDetails,
  isArchived = false,
  onReactivate,
}: {
  c: Cuenta;
  index: number;
  tipoLabel: string;
  themeId: string;
  onEdit?: (cuenta: Cuenta) => void;
  onDelete?: (cuenta: Cuenta) => void;
  onOpenDetails?: (cuenta: Cuenta) => void;
  isArchived?: boolean;
  onReactivate?: (cuenta: Cuenta) => void;
}) {
  const normalizedId = themeId === "blue" ? "ocean" : themeId === "charcoal" ? "obsidian" : themeId;
  const currentTheme =
    ACCOUNT_CARD_THEMES.find((t) => t.id === normalizedId) ??
    ACCOUNT_CARD_THEMES[index % ACCOUNT_CARD_THEMES.length];
  const TipoIcon = TIPO_CONFIG[c.tipo]?.icon ?? Landmark;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.16 } }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.25) }}
      onClick={() => onOpenDetails?.(c)}
      className={`group bg-surface-container-lowest border border-surface-container-high/80 hover:border-primary/40 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 cursor-pointer select-text ${
        isArchived ? "opacity-75 border-dashed" : ""
      }`}
    >
      {/* Superior: Ícono Squircle + Nombre + Moneda */}
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 shadow-2xs ${
                isArchived
                  ? "bg-surface-container text-outline border-outline/20"
                  : currentTheme.iconCls
              }`}
            >
              <TipoIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading text-sm sm:text-base font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                {c.nombre}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="tech-pill font-mono font-bold">
              {c.codigo_moneda}
            </span>
            {/* Acciones flotantes al hover */}
            {!isArchived && (
              <div
                className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    title="Editar cuenta"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
                    className="p-1 rounded-lg text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Eliminar o archivar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Saldo Principal - Limpio y prominente */}
        <div className="mt-3">
          <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider block mb-0.5">
            Saldo Disponible
          </span>
          <p className="font-mono text-2xl font-extrabold text-on-surface tracking-tight">
            {money(c.saldo)}
          </p>
        </div>

        {/* Micro-píldoras monocromáticas estilo Tech Stack */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <span className="tech-pill">
            {isArchived ? "Archivada" : tipoLabel}
          </span>
          {c.saldo_inicial > 0 && (
            <span className="tech-pill font-mono">
              Inicial: {money(c.saldo_inicial)}
            </span>
          )}
        </div>
      </div>

      {/* Pie de tarjeta: enlace Detalles minimalista */}
      <div className="pt-2.5 border-t border-surface-container-high/50 flex items-center justify-between text-xs">
        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
          {isArchived ? "Inactiva" : "Cuenta activa"}
        </span>

        {isArchived && onReactivate ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReactivate(c);
            }}
            className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reactivar</span>
          </button>
        ) : (
          <span className="text-on-surface-variant hover:text-primary font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors">
            <span>Detalles</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Modal para Ver Detalle Minimalista de Cuenta ───────────────────────────

function ModalDetalleCuenta({
  cuenta,
  tipoLabel,
  theme,
  onClose,
  onEdit,
  onDelete,
  onOpenMovement,
}: {
  cuenta: Cuenta;
  tipoLabel: string;
  theme: AccountTheme;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenMovement: () => void;
}) {
  const TipoIcon = TIPO_CONFIG[cuenta.tipo]?.icon ?? Landmark;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 relative select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Detalle */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-high/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${theme.iconCls}`}>
              <TipoIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-bold text-on-surface truncate">
                {cuenta.nombre}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border ${theme.badgeCls}`}>
                  {tipoLabel}
                </span>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-surface-container-high/60">
                  {cuenta.codigo_moneda}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Cerrar detalles"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Saldo Principal Destacado */}
        <div className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 flex items-baseline justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold text-outline block">
              Dinero disponible
            </span>
            <p className="font-mono text-2xl sm:text-3xl font-extrabold text-on-surface mt-0.5">
              {money(cuenta.saldo)}
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-primary">
            {cuenta.codigo_moneda}
          </span>
        </div>

        {/* Detalles de la cuenta */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-surface-container-high/40">
            <span className="text-on-surface-variant">Empezó con</span>
            <span className="font-mono font-semibold text-on-surface">
              {money(cuenta.saldo_inicial)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-surface-container-high/40">
            <span className="text-on-surface-variant">Estado</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {cuenta.es_activa ? "En uso" : "Archivada / Inactiva"}
            </span>
          </div>

          {cuenta.created_at && (
            <div className="flex items-center justify-between py-1.5 border-b border-surface-container-high/40">
              <span className="text-on-surface-variant">Creada el</span>
              <span className="font-mono text-on-surface">
                {formatDateEs(cuenta.created_at)}
              </span>
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete();
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 border border-rose-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{cuenta.saldo > 0 ? "Archivar" : "Eliminar"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenMovement();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo movimiento</span>
          </button>
        </div>
      </motion.div>
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

  const isDirty = nombre !== cuenta.nombre || tipo !== cuenta.tipo || motivo.trim().length > 0;
  const [shake, setShake] = useState(false);
  const [showProtectedNotice, setShowProtectedNotice] = useState(false);
  const pointerDownOnBackdrop = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerDownOnBackdrop.current || e.target !== e.currentTarget) {
      return;
    }
    pointerDownOnBackdrop.current = false;

    if (isDirty) {
      setShake(true);
      setShowProtectedNotice(true);
      setTimeout(() => setShake(false), 350);
      setTimeout(() => setShowProtectedNotice(false), 2200);
      return;
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className={`bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col relative select-text ${
          shake ? "animate-modal-shake" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Aviso flotante de protección de edición */}
        {showProtectedNotice && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 bg-surface-container-highest/95 backdrop-blur-md text-primary text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg border border-primary/30 flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Edición en curso · Usa la ✕ o Cancelar para salir</span>
          </div>
        )}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Pencil className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-on-surface">Editar Cuenta</h2>
              <p className="text-xs text-on-surface-variant">Cambia el nombre o tipo de cuenta sin afectar tus números.</p>
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
            Editar datos
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
                Tus movimientos siguen intactos
              </p>
              <p>
                Cambiar el nombre o tipo de cuenta no modifica tus saldos ni tus movimientos pasados. Todo tu historial queda a salvo.
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
              <label className="block text-xs font-semibold text-on-surface mb-1">¿Por qué haces este cambio? (opcional, para recordarlo después)</label>
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
      </motion.div>
    </motion.div>
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
  const activeThemeId = currentAccount
    ? themeMap[currentAccount.id] === "blue"
      ? "ocean"
      : themeMap[currentAccount.id] === "charcoal"
      ? "obsidian"
      : themeMap[currentAccount.id] ?? "turquoise"
    : "turquoise";
  const activeTheme = ACCOUNT_CARD_THEMES.find((t) => t.id === activeThemeId) ?? ACCOUNT_CARD_THEMES[0];
  const TipoIcon = currentAccount ? TIPO_CONFIG[currentAccount.tipo]?.icon ?? Landmark : Landmark;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-5 max-h-[92vh] overflow-y-auto select-text"
        onClick={(e) => e.stopPropagation()}
      >
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
            <div className={`relative rounded-2xl border p-4 shadow-xs transition-all overflow-hidden ${activeTheme.cardCls} bg-surface-container-lowest/90 dark:bg-surface-container-low/40`}>
              <div
                className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-xl pointer-events-none opacity-40 ${activeTheme.glowCls}`}
              />
              <div className="flex items-center justify-between gap-2 relative">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${activeTheme.iconCls}`}>
                    <TipoIcon className="w-4 h-4" />
                  </div>
                  <p className="font-heading text-sm font-bold text-on-surface truncate tracking-tight">{currentAccount.nombre}</p>
                </div>
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface-container/70 border border-surface-container-high/60 text-on-surface-variant shrink-0">
                  {currentAccount.codigo_moneda}
                </span>
              </div>
              <p className="font-mono text-2xl font-extrabold text-on-surface mt-3 tracking-tight">{money(currentAccount.saldo)}</p>
              <div className="mt-3 pt-2.5 border-t border-surface-container-high/40 flex items-center justify-between text-[11px]">
                <span className={`inline-flex items-center font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${activeTheme.badgeCls}`}>
                  {currentAccount.tipo}
                </span>
                <span className="font-semibold text-primary inline-flex items-center gap-0.5">
                  <span>Detalles</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
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
      </motion.div>
    </motion.div>
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
  const { openModal: openDashboardModal } = useDashboard();
  const [modalColoresOpen, setModalColoresOpen] = useState(false);
  const [cuentaAEditar, setCuentaAEditar] = useState<Cuenta | null>(null);
  const [cuentaAEliminar, setCuentaAEliminar] = useState<Cuenta | null>(null);
  const [cuentaDetalle, setCuentaDetalle] = useState<Cuenta | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showArchivadas, setShowArchivadas] = useState(false);
  const [cuentasArchivadas, setCuentasArchivadas] = useState<Cuenta[]>([]);
  const [loadingArchivadas, setLoadingArchivadas] = useState(false);

  const totalLiquidez = useMemo(() => {
    return cuentas.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);
  }, [cuentas]);

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
        transition={{ duration: 0.22 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cuentas y Billeteras</h1>
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-surface-container text-on-surface border border-surface-container-high/60 shadow-2xs">
            Total: {money(totalLiquidez)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showArchivadas || cuentasArchivadas.length > 0 ? (
            <button
              type="button"
              onClick={toggleArchivadas}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                showArchivadas
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{showArchivadas ? "Ocultar" : "Archivadas"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleArchivadas}
              className="px-3 py-2 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Ver cuentas archivadas"
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Archivadas</span>
            </button>
          )}

          {cuentas.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenColorModal()}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Personalizar colores de tarjetas"
            >
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Estilo</span>
            </button>
          )}

          <button
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-1.5 cursor-pointer transition-colors"
            onClick={openModal}
          >
            <Plus className="w-4 h-4" />
            <span>Nueva cuenta</span>
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cuentas.length === 0 && (
          <div className="py-12 px-4 rounded-2xl border-2 border-dashed border-surface-container-high/70 bg-surface-container-lowest/40 text-center col-span-full max-w-md mx-auto">
            <div className="w-10 h-10 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto mb-2.5">
              <WalletCards className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-on-surface">Sin cuentas activas</p>
            <p className="text-xs text-on-surface-variant mt-1">Registra tu primera cuenta o billetera para controlar tu liquidez.</p>
            <button
              type="button"
              onClick={openModal}
              className="mt-3.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear primera cuenta</span>
            </button>
          </div>
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
            onOpenDetails={(cuenta) => setCuentaDetalle(cuenta)}
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

      <AnimatePresence>
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
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>

      <AnimatePresence>
        {cuentaDetalle && (
          <ModalDetalleCuenta
            cuenta={cuentaDetalle}
            tipoLabel={TIPO_LABELS[cuentaDetalle.tipo] ?? cuentaDetalle.tipo}
            theme={
              ACCOUNT_CARD_THEMES.find(
                (t) =>
                  t.id ===
                  (themeMap[cuentaDetalle.id] === "blue"
                    ? "ocean"
                    : themeMap[cuentaDetalle.id] === "charcoal"
                    ? "obsidian"
                    : themeMap[cuentaDetalle.id] ?? ACCOUNT_CARD_THEMES[0].id)
              ) ?? ACCOUNT_CARD_THEMES[0]
            }
            onClose={() => setCuentaDetalle(null)}
            onEdit={() => {
              const c = cuentaDetalle;
              setCuentaDetalle(null);
              setCuentaAEditar(c);
            }}
            onDelete={() => {
              const c = cuentaDetalle;
              setCuentaDetalle(null);
              setCuentaAEliminar(c);
            }}
            onOpenMovement={() => openDashboardModal("movement")}
          />
        )}
      </AnimatePresence>

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
  espacioId,
  loadData,
  setSuccessNotice,
  onVerNota,
}: {
  movimientos: Movimiento[];
  openModal: () => void;
  espacioId: string;
  loadData: () => Promise<void>;
  setSuccessNotice: (msg: string | null) => void;
  onVerNota: (titulo: string, subtitulo?: string, texto?: string | null) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "ingreso" | "gasto" | "cobro" | "transferencia" | "ajuste">("todos");
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(12);
  const [movimientoAEliminar, setMovimientoAEliminar] = useState<Movimiento | null>(null);
  const [isEliminando, setIsEliminando] = useState(false);
  const [mostrarAuditoria, setMostrarAuditoria] = useState(false);
  const [viewMode, setViewMode] = useState<"feed" | "compact">(() => {
    if (typeof window === "undefined") return "feed";
    try {
      return (localStorage.getItem("finpal_movimientos_view") as "feed" | "compact") || "feed";
    } catch {
      return "feed";
    }
  });

  const handleConfirmEliminar = async () => {
    if (!movimientoAEliminar || !espacioId) return;
    setIsEliminando(true);
    try {
      const res = await eliminarMovimiento(movimientoAEliminar.id, espacioId);
      if ("error" in res && res.error) {
        setSuccessNotice(res.error);
      } else if ("success" in res && res.success) {
        setSuccessNotice(res.message);
        await loadData();
      }
    } finally {
      setIsEliminando(false);
      setMovimientoAEliminar(null);
    }
  };

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
        const catNombre = (rel(m.categorias)?.nombre ?? "").toLowerCase();
        const desc = (m.descripcion ?? "").toLowerCase();
        const montoStr = String(m.monto);
        if (!desc.includes(q) && !cuentaNombre.toLowerCase().includes(q) && !catNombre.includes(q) && !montoStr.includes(q)) {
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
          <p className="text-xs text-on-surface-variant mt-0.5">Libro mayor de ingresos, gastos, cobros y transferencias entre cuentas.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <button
            type="button"
            onClick={() => setMostrarAuditoria(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
            title="Ver historial de cobros revertidos y movimientos eliminados"
          >
            <History className="w-4 h-4 text-primary" />
            <span>Historial de eliminaciones</span>
          </button>
          <button className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer transition-colors" onClick={openModal}>
            <Plus className="w-4 h-4" /><span>Registrar movimiento</span>
          </button>
        </div>
      </motion.div>

      {/* Barra de Filtros, Búsqueda y Conmutador */}
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

        {/* Buscador + Conmutador */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => cambiarBusqueda(e.target.value)}
              placeholder="Buscar concepto, categoría o cuenta..."
              className="w-full h-9 pl-9 pr-8 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-xs text-on-surface focus:outline-none focus:border-primary"
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

          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode("feed");
                try { localStorage.setItem("finpal_movimientos_view", "feed"); } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "feed"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista en feed visual de transacciones"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("compact");
                try { localStorage.setItem("finpal_movimientos_view", "compact"); } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "compact"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista en lista compacta"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Lista vacía */}
      {paginados.length === 0 ? (
        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-8 sm:p-12 text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-on-surface">No hay movimientos registrados</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            No se encontraron transacciones con los filtros actuales. Registra un ingreso o gasto para ver el flujo.
          </p>
        </div>
      ) : viewMode === "feed" ? (
        /* VISTA 1: Feed Visual de Transacciones */
        <div className="space-y-2.5">
          {paginados.map((m, i) => {
            const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
              || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
            const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
            const BadgeIcon = badge.Icon;
            const cuentaNombre = (Array.isArray(m.cuentas_dinero)
              ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
              : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "—";
            const catNombre = rel(m.categorias)?.nombre;
            const isCobro = m.tipo === "pago_prestamo" || Boolean(m.pago_prestamo_id);
            const isManual = !m.prestamo_id && !m.pago_prestamo_id;

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.02, 0.2) }}
                className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Lado izquierdo: Icono + Detalles */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  }`}>
                    {isPositive ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h4 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {m.descripcion ? fixSpanishEncoding(m.descripcion) : badge.label}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badge.badgeClass}`}>
                        <BadgeIcon className="w-2.5 h-2.5 shrink-0" />
                        <span>{badge.label}</span>
                      </span>
                      {catNombre && (
                        <span className="tech-pill">
                          <Tag className="w-2.5 h-2.5 text-primary shrink-0" />
                          <span>{catNombre}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-on-surface-variant flex-wrap pt-0.5">
                      <span className="tech-pill">{cuentaNombre}</span>
                      <span className="tech-pill font-mono">{formatDateEs(m.ocurrido_en)}</span>
                      {m.descripcion && m.descripcion.length > 25 && (
                        <button
                          type="button"
                          onClick={() => onVerNota("Detalle del movimiento", badge.label, m.descripcion)}
                          className="tech-pill hover:border-primary/40 cursor-pointer text-primary"
                        >
                          Nota
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado derecho: Monto + Acción */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container-low">
                  <div className="text-right">
                    <span className={`font-mono text-base sm:text-lg font-extrabold whitespace-nowrap block ${
                      isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {isPositive ? "+" : "−"}{money(Number(m.monto))}
                    </span>
                    <span className="text-[10px] text-on-surface-variant font-medium block">
                      {isPositive ? "Ingreso acreditado" : "Salida registrada"}
                    </span>
                  </div>

                  {isCobro ? (
                    <button
                      type="button"
                      onClick={() => setMovimientoAEliminar(m)}
                      className="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer transition-colors"
                      title="Deshacer y revertir cobro registrado por error"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : isManual ? (
                    <button
                      type="button"
                      onClick={() => setMovimientoAEliminar(m)}
                      className="p-2 rounded-xl text-on-surface-variant hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Eliminar este movimiento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMovimientoAEliminar(m)}
                      className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Eliminar y revertir préstamo entregado"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* VISTA 2: Lista Compacta Moderna */
        <div className="space-y-2">
          {paginados.map((m, i) => {
            const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
              || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
            const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
            const cuentaNombre = (Array.isArray(m.cuentas_dinero)
              ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
              : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "—";
            const catNombre = rel(m.categorias)?.nombre;
            const isCobro = m.tipo === "pago_prestamo" || Boolean(m.pago_prestamo_id);
            const isManual = !m.prestamo_id && !m.pago_prestamo_id;

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.15) }}
                className="bg-surface-container-lowest border border-surface-container-high/70 rounded-xl p-3 sm:px-4 shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isPositive ? "bg-primary" : "bg-rose-500"}`} />
                  <div className="min-w-0">
                    <span className="font-semibold text-xs sm:text-sm text-on-surface truncate block">
                      {m.descripcion ? fixSpanishEncoding(m.descripcion) : badge.label}
                    </span>
                    <span className="text-[11px] text-on-surface-variant block">
                      {formatDateEs(m.ocurrido_en)} · {cuentaNombre}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}>
                    {badge.label}
                  </span>
                  {catNombre && (
                    <span className="text-[10px] font-medium bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full border border-surface-container-high/60">
                      {catNombre}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <span className={`font-mono text-xs sm:text-sm font-bold whitespace-nowrap ${
                    isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {isPositive ? "+" : "−"}{money(Number(m.monto))}
                  </span>

                  {isCobro ? (
                    <button
                      type="button"
                      onClick={() => setMovimientoAEliminar(m)}
                      className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer transition-colors"
                      title="Deshacer y revertir cobro registrado por error"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  ) : isManual ? (
                    <button
                      type="button"
                      onClick={() => setMovimientoAEliminar(m)}
                      className="p-1.5 rounded-lg text-on-surface-variant hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Eliminar movimiento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMovimientoAEliminar(m)}
                      className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Eliminar y revertir préstamo entregado"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Eliminación Seguro con Slider */}
      {movimientoAEliminar && (() => {
        const esCobro = movimientoAEliminar.tipo === "pago_prestamo" || Boolean(movimientoAEliminar.pago_prestamo_id);
        const esEntregaPrestamo = movimientoAEliminar.tipo === "entrega_prestamo";
        return (
          <ConfirmDialog
            isOpen={true}
            title={
              esEntregaPrestamo
                ? "¿Eliminar y revertir este préstamo?"
                : esCobro
                ? "¿Deshacer y revertir este cobro?"
                : "¿Eliminar este movimiento?"
            }
            description={
              <div className="space-y-2.5 text-xs text-on-surface-variant">
                <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/70 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-on-surface block">
                      {movimientoAEliminar.descripcion
                        ? fixSpanishEncoding(movimientoAEliminar.descripcion)
                        : esEntregaPrestamo
                        ? "Préstamo entregado"
                        : esCobro
                        ? "Cobro de cuota"
                        : "Movimiento"}
                    </span>
                    <span className="text-[11px]">{formatDateEs(movimientoAEliminar.ocurrido_en)}</span>
                  </div>
                  <span className="font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                    {money(Number(movimientoAEliminar.monto))}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {esEntregaPrestamo
                    ? "Se eliminará el préstamo asociado por completo: el capital desembolsado regresará automáticamente al saldo de la cuenta de origen y cualquier cobro vinculado también será revertido. Esta acción quedará registrada en la bitácora de auditoría."
                    : esCobro
                    ? "Se revertirá este cobro por completo: se descontará el interés registrado por error, se restaurará el saldo pendiente del préstamo y se restará el monto cobrado de la cuenta de dinero. Esta acción quedará registrada en la bitácora de auditoría."
                    : movimientoAEliminar.transfer_group_id
                    ? "Este movimiento forma parte de una transferencia entre cuentas. Se eliminarán ambos asientos (salida y entrada) para mantener cuadradas tus cuentas. Quedará registrado en la auditoría."
                    : "Se eliminará este registro y el saldo de la cuenta se recalculará automáticamente. La eliminación quedará registrada en la auditoría."
                  }
                </p>
              </div>
            }
            useSlider={true}
            sliderLabel={
              esEntregaPrestamo
                ? "Desliza para eliminar y revertir préstamo"
                : esCobro
                ? "Desliza para revertir el cobro"
                : "Desliza para eliminar movimiento"
            }
            submitting={isEliminando}
            variant="danger"
            onConfirm={handleConfirmEliminar}
            onCancel={() => !isEliminando && setMovimientoAEliminar(null)}
          />
        );
      })()}

      {/* Modal de Auditoría de Eliminaciones y Reversiones */}
      <ModalAuditoriaEliminaciones
        isOpen={mostrarAuditoria}
        onClose={() => setMostrarAuditoria(false)}
        espacioId={espacioId}
      />

      {/* Barra de Paginación Moderna */}
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
            <option value={12}>12 por página</option>
            <option value={24}>24 por página</option>
            <option value={48}>48 por página</option>
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

const POPULAR_CURRENCIES = [
  { value: "BOB", label: "Boliviano (BOB · Bs)" },
  { value: "USD", label: "Dólar estadounidense (USD · $)" },
  { value: "EUR", label: "Euro (EUR · €)" },
  { value: "ARS", label: "Peso argentino (ARS · $)" },
  { value: "CLP", label: "Peso chileno (CLP · $)" },
  { value: "PEN", label: "Sol peruano (PEN · S/)" },
  { value: "COP", label: "Peso colombiano (COP · $)" },
  { value: "MXN", label: "Peso mexicano (MXN · $)" },
  { value: "BRL", label: "Real brasileño (BRL · R$)" },
];

function ConfiguracionView({
  preferencias,
  guardarPreferencias,
  espacioId,
  espacioNombre,
  setEspacioNombre,
  zonaHoraria,
  setZonaHoraria,
  codigoMoneda,
  setCodigoMoneda,
  setSuccessNotice,
}: {
  preferencias: { colorAcento: string; modoOscuro: boolean; tasaInteresPredeterminada: number };
  guardarPreferencias: (colorAcento: string, modoOscuro: boolean, tasaInteresPredeterminada: number) => Promise<string | null>;
  espacioId: string;
  espacioNombre: string;
  setEspacioNombre: (nombre: string) => void;
  zonaHoraria: string;
  setZonaHoraria: (zona: string) => void;
  codigoMoneda: string;
  setCodigoMoneda: (moneda: string) => void;
  setSuccessNotice: (msg: string | null) => void;
}) {
  const [color, setColor] = useState(preferencias.colorAcento);
  const [tasa, setTasa] = useState(preferencias.tasaInteresPredeterminada);
  const [zona, setZona] = useState(zonaHoraria || "America/La_Paz");
  const [moneda, setMoneda] = useState(codigoMoneda || "BOB");
  const [nombreEspacioLocal, setNombreEspacioLocal] = useState(espacioNombre || "Mi espacio");
  const [guardando, setGuardando] = useState(false);
  const [guardandoZona, setGuardandoZona] = useState(false);
  const [guardandoMoneda, setGuardandoMoneda] = useState(false);
  const [guardandoNombre, setGuardandoNombre] = useState(false);
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

  async function guardarMoneda(nuevaMoneda: string) {
    setMoneda(nuevaMoneda);
    if (!espacioId) return;
    setGuardandoMoneda(true);
    const res = await actualizarMonedaEspacio(espacioId, nuevaMoneda);
    setGuardandoMoneda(false);
    if (!res.error) {
      setCodigoMoneda(nuevaMoneda);
      setSuccessNotice(`¡Moneda principal actualizada a ${nuevaMoneda}!`);
    }
  }

  async function guardarNombreDelEspacio() {
    if (!espacioId || !nombreEspacioLocal.trim()) return;
    setGuardandoNombre(true);
    const res = await actualizarNombreEspacio(espacioId, nombreEspacioLocal.trim());
    setGuardandoNombre(false);
    if (!res.error) {
      setEspacioNombre(nombreEspacioLocal.trim());
      setSuccessNotice("¡Nombre del espacio actualizado!");
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
          <p className="text-xs text-on-surface-variant mt-1">Ajustes del espacio de trabajo, moneda principal, región y preferencias visuales.</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Card 1: Región y Moneda del Espacio */}
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
                <h2 className="font-heading text-base font-bold text-on-surface">Región y Moneda del espacio</h2>
                <p className="text-xs text-on-surface-variant">
                  Define la divisa principal y el huso horario para tus reportes y vencimientos.
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Moneda principal del espacio
                </label>
                <select
                  value={moneda}
                  onChange={(e) => guardarMoneda(e.target.value)}
                  disabled={guardandoMoneda}
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50"
                >
                  {POPULAR_CURRENCIES.map((cur) => (
                    <option key={cur.value} value={cur.value}>
                      {cur.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
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
              </div>
              <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  Los cambios de moneda y zona horaria se sincronizan en vivo en todo el panel.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
            <span>Moneda: <b className="text-on-surface font-mono">{moneda}</b> · Zona: <b className="text-on-surface font-mono">{zona}</b></span>
            {(guardandoZona || guardandoMoneda) && <span className="text-primary font-bold animate-pulse">Sincronizando...</span>}
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

            <div className="pt-2 space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Nombre del espacio actual
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nombreEspacioLocal}
                    onChange={(e) => setNombreEspacioLocal(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    disabled={guardandoNombre || !nombreEspacioLocal.trim() || nombreEspacioLocal.trim() === espacioNombre}
                    onClick={guardarNombreDelEspacio}
                    className="px-3.5 h-10 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    {guardandoNombre ? "..." : "Renombrar"}
                  </button>
                </div>
              </div>
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
