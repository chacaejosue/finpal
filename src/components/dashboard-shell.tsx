"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeftRight,
  ChevronDown,
  FileSpreadsheet,
  FolderOpen,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Plus,
  ReceiptText,
  Settings,
  UsersRound,
  WalletCards,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  FileBarChart2,
} from "lucide-react";
import { useEspacio } from "@/lib/espacio-context";
import { useDashboard, money, loanBalance, rel, type Contacto, type Cuenta, type Prestamo } from "@/lib/dashboard-context";
import { FinPalLogo } from "@/components/finpal-logo";
import { ImportModal } from "@/features/importacion/import-modal";
import { signOut } from "@/app/(auth)/actions";
import { formatDateEs } from "@/lib/format-date";

const navItems = [
  { label: "Inicio", path: "/inicio", key: "inicio", icon: LayoutDashboard },
  { label: "Contactos / Deudores", path: "/contactos", key: "contactos", icon: UsersRound },
  { label: "Préstamos", path: "/prestamos", key: "prestamos", icon: HandCoins },
  { label: "Cobros", path: "/pagos", key: "pagos", icon: ReceiptText },
  { label: "Cuentas", path: "/cuentas", key: "cuentas", icon: WalletCards },
  { label: "Movimientos", path: "/movimientos", key: "movimientos", icon: ArrowLeftRight },
  { label: "Reportes", path: "/reportes", key: "reportes", icon: FileBarChart2 },
  { label: "Configuración", path: "/configuracion", key: "configuracion", icon: Settings },
] as const;

export function DashboardShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const { espacioId, espacioNombre } = useEspacio();
  const {
    contactos,
    cuentas,
    prestamos,
    totals,
    loadData,
    modal,
    openModal,
    closeModal,
    showImportModal,
    setShowImportModal,
    submitting,
    formError,
    successNotice,
    handleSubmitModal,
    preferencias,
  } = useDashboard();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isRouteLoading = optimisticPath !== null && pathname !== optimisticPath;
  const activePath = isRouteLoading ? optimisticPath : pathname;
  const avatarLetters = userEmail ? userEmail.slice(0, 2).toUpperCase() : "FP";

  // Si estamos en la selección de espacios, no mostramos el shell del dashboard
  if (pathname === "/espacios") {
    return <>{children}</>;
  }

  const accent = {
    verde: { primary: "#006948", container: "#00855d", dark: "#005137" },
    azul: { primary: "#2563eb", container: "#1d4ed8", dark: "#1e40af" },
    violeta: { primary: "#7c3aed", container: "#6d28d9", dark: "#5b21b6" },
    naranja: { primary: "#c2410c", container: "#ea580c", dark: "#9a3412" },
    rosa: { primary: "#e11d48", container: "#be123c", dark: "#9f1239" },
  }[preferencias.colorAcento];
  const themeStyle = {
    "--color-primary": accent.primary,
    "--color-primary-container": accent.container,
    "--primary": accent.primary,
    "--primary-dark": accent.dark,
  } as CSSProperties;

  return (
    <div
      data-theme={preferencias.modoOscuro ? "dark" : "light"}
      style={themeStyle}
      className="min-h-screen bg-surface text-on-surface antialiased flex selection:bg-primary-fixed selection:text-on-primary-fixed"
    >
      {/* Top Loading Progress Bar */}
      {(isPending || optimisticPath !== null) && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 overflow-hidden bg-primary/20">
          <div className="h-full bg-primary animate-pulse w-full shadow-[0_0_8px_var(--color-primary)]" />
        </div>
      )}

      {/* Sidebar Fija y Persistente */}
      <aside className="fixed left-0 top-0 h-full w-60 bg-surface-container-lowest border-r border-surface-container-high/60 z-40 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col">
          {/* Brand */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-surface-container-low">
            <Link
              href="/inicio"
              prefetch={true}
              onClick={() => setOptimisticPath("/inicio")}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <FinPalLogo size={32} className="w-8 h-8 rounded-lg shadow-xs" priority />
              <div className="flex items-baseline tracking-tight font-heading text-lg">
                <span className="font-extrabold text-on-surface">Fin</span>
                <span className="font-extrabold text-primary">Pal</span>
              </div>
            </Link>
          </div>

          {/* Selector de Espacio de Trabajo */}
          <div className="px-4 py-3 relative">
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors border border-surface-container-high/40 text-xs font-semibold cursor-pointer"
              type="button"
              onClick={() => setShowWorkspaceDropdown((v) => !v)}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <span className="truncate max-w-[100px]">{espacioNombre || "Cargando..."}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute left-4 right-4 top-[3.25rem] bg-surface-container-lowest border border-surface-container-high/80 rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                <Link
                  href="/espacios"
                  prefetch={true}
                  onClick={() => setShowWorkspaceDropdown(false)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-secondary-container/30 rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ver todos los espacios</span>
                </Link>
              </div>
            )}
          </div>

          {/* Navegación con Respuesta Instantánea */}
          <nav className="flex flex-col gap-0.5 px-3 mt-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activePath === item.path || pathname === item.path;

              return (
                <Link
                  key={item.key}
                  href={item.path}
                  prefetch={true}
                  onClick={() => {
                    startTransition(() => {
                      setOptimisticPath(item.path);
                    });
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold cursor-pointer active:scale-[0.98] ${
                    isActive
                      ? "bg-primary text-on-primary shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.key === "prestamos" && totals.lateCount > 0 && (
                    <span
                      className={`ml-auto text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive
                          ? "bg-surface-container-lowest text-primary"
                          : "bg-error-container text-on-error-container"
                      }`}
                    >
                      {totals.lateCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Cerrar Sesión */}
        <div className="p-3 border-t border-surface-container-low">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low hover:bg-error-container/40 hover:text-error text-on-surface transition-colors border border-surface-container-high/40 text-xs font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido Principal con Header Persistente */}
      <div className="pl-60 flex-1 flex flex-col min-w-0">
        <header className="fixed top-0 left-60 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.03)] border-b border-surface-container-high/60 z-30 flex items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-surface-container-high/40">
              <Calendar className="w-4 h-4 text-primary" />
              <span>
                {new Date().toLocaleDateString("es-BO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 text-on-surface transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>Importar Excel / CSV</span>
            </button>
            <div className="flex items-center gap-2.5 pl-2 border-l border-surface-container-low">
              <div className="w-8 h-8 rounded-full bg-on-surface text-surface-container-lowest flex items-center justify-center font-bold text-xs ring-2 ring-primary/20">
                {avatarLetters}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-on-surface leading-tight">{userEmail}</span>
                <span className="text-[11px] text-on-surface-variant leading-tight">{espacioNombre}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Children Rendered Instantly */}
        <main className="w-full pt-20 px-8 pb-12 min-h-[calc(100vh-4rem)]">
          {isRouteLoading ? <DashboardRouteSkeleton path={optimisticPath} /> : children}
        </main>
      </div>

      {/* Modals Compartidos */}
      <AnimatePresence>
        {successNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="fixed top-20 right-6 z-[60] rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 shadow-lg backdrop-blur-sm"
            role="status"
          >
            {successNotice}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <ModalWrapper
            title={
              {
                contact: "Nuevo contacto",
                loan: "Nuevo préstamo",
                payment: "Registrar cobro",
                account: "Nueva cuenta",
                movement: "Registrar movimiento",
              }[modal]
            }

            close={closeModal}
          >
            <form onSubmit={handleSubmitModal} className="space-y-4">
              {modal === "contact" && <ContactoForm />}
              {modal === "account" && <CuentaForm />}
              {modal === "loan" && (
                <PrestamoForm
                  contactos={contactos}
                  cuentas={cuentas}
                  tasaPredeterminada={preferencias.tasaInteresPredeterminada}
                  onCreateAccount={() => openModal("account")}
                />
              )}
              {modal === "payment" && <PagoForm prestamos={prestamos} cuentas={cuentas} />}
              {modal === "movement" && <MovimientoForm cuentas={cuentas} />}

              {formError && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-xs flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? modal === "account" ? "Creando cuenta..." : "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Modal Inteligente de Importación */}
      <ImportModal
        espacioId={espacioId ?? ""}
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          loadData();
        }}
        cuentasDisponibles={cuentas.map((c) => ({ id: c.id, nombre: c.nombre }))}
      />
    </div>
  );
}

function DashboardRouteSkeleton({ path }: { path: string | null }) {
  const label = navItems.find((item) => item.path === path)?.label ?? "Sección";

  return (
    <div
      aria-busy="true"
      aria-label={`Cargando ${label}`}
      className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer"
    >
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-surface-container rounded-md" />
          <div className="h-8 w-56 bg-surface-container-high rounded-xl" />
          <div className="h-3 w-80 bg-surface-container rounded-md" />
        </div>
        {!["/configuracion", "/reportes"].includes(path ?? "") && (
          <div className="h-10 w-36 bg-primary/20 rounded-xl" />
        )}
      </div>
      <RouteSkeletonContent path={path} />
    </div>
  );
}

function RouteSkeletonContent({ path }: { path: string | null }) {
  if (path === "/inicio" || path === "/reportes") {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-28 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-5"
            >
              <div className="h-3 w-24 bg-surface-container rounded" />
              <div className="h-7 w-32 bg-surface-container-high rounded-lg mt-5" />
            </div>
          ))}
        </div>
        <div className="h-64 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-5">
          <div className="h-4 w-40 bg-surface-container rounded" />
          <div className="h-3 w-full max-w-xl bg-surface-container-low rounded mt-5" />
          <div className="h-3 w-4/5 bg-surface-container-low rounded mt-3" />
        </div>
      </>
    );
  }

  if (path === "/cuentas") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-40 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-5"
          >
            <div className="h-3 w-24 bg-surface-container rounded" />
            <div className="h-5 w-36 bg-surface-container-high rounded mt-3" />
            <div className="h-8 w-32 bg-surface-container-high rounded-lg mt-6" />
          </div>
        ))}
      </div>
    );
  }

  if (path === "/configuracion") {
    return (
      <div className="h-80 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 p-6 space-y-5">
        <div className="h-5 w-32 bg-surface-container-high rounded" />
        <div className="h-3 w-96 max-w-full bg-surface-container rounded" />
        <div className="h-3 w-72 max-w-full bg-surface-container rounded" />
        <div className="h-10 w-64 bg-surface-container-low rounded-xl" />
        <div className="h-12 w-full max-w-xl bg-surface-container-low rounded-xl" />
        <div className="h-10 w-36 bg-primary/20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 overflow-hidden">
      <div className="h-12 bg-surface-container-low border-b border-surface-container-high/60 flex items-center gap-6 px-5">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-3 w-20 bg-surface-container rounded" />
        ))}
      </div>
      <div className="divide-y divide-surface-container-low">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-14 px-5 flex items-center gap-6">
            <div className="h-3 w-28 bg-surface-container rounded" />
            <div className="h-3 w-40 bg-surface-container-low rounded" />
            <div className="h-3 w-24 bg-surface-container rounded" />
            <div className="h-3 w-20 bg-surface-container-low rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

function ModalWrapper({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-xs p-4"
      onClick={close}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/80 shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-heading text-xl font-bold text-on-surface mb-4">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Form Inputs ──────────────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-on-surface mb-1">{label}</label>
      {children}
    </div>
  );
}

function DateField({
  name,
  value,
  defaultValue,
  required = false,
  onChange,
}: {
  name: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? "");
  const currentValue = value ?? internalValue;

  return (
    <div className="relative">
      <div
        className={`${inputCls} flex items-center select-none`}
        aria-hidden="true"
      >
        {formatDateEs(currentValue)}
      </div>
      <input
        type="date"
        name={name}
        value={currentValue}
        required={required}
        onChange={(event) => {
          if (value === undefined) setInternalValue(event.target.value);
          onChange?.(event.target.value);
        }}
        className="absolute inset-0 h-10 w-full cursor-pointer opacity-0"
        aria-label="Seleccionar fecha"
      />
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const selectCls = `${inputCls} cursor-pointer`;

function ContactoForm() {
  return (
    <>
      <FormField label="Nombre completo *">
        <input type="text" name="nombre" required className={inputCls} placeholder="Ej. Carlos Mendoza" />
      </FormField>
      <FormField label="Teléfono">
        <input type="tel" name="telefono" className={inputCls} placeholder="+591 70000000" />
      </FormField>
      <FormField label="Email">
        <input type="email" name="email" className={inputCls} placeholder="correo@ejemplo.com" />
      </FormField>
      <FormField label="Notas">
        <textarea name="notas" rows={2} className={`${inputCls} h-auto py-2.5`} placeholder="Información adicional..." />
      </FormField>
    </>
  );
}

function CuentaForm() {
  return (
    <>
      <FormField label="Nombre de la cuenta *">
        <input type="text" name="nombre" required className={inputCls} placeholder="Ej. Banco Nacional" />
      </FormField>
      <FormField label="Tipo *">
        <select name="tipo" required className={selectCls}>
          <option value="efectivo">Efectivo</option>
          <option value="banco">Cuenta bancaria</option>
          <option value="billetera_movil">Billetera móvil</option>
          <option value="ahorro">Cuenta de ahorro</option>
          <option value="otra">Otra</option>
        </select>
      </FormField>
      <FormField label="Saldo inicial (Bs)">
        <input type="number" name="saldo_inicial" defaultValue={0} min={0} step="0.01" className={inputCls} />
      </FormField>
      <input type="hidden" name="codigo_moneda" value="BOB" />
    </>
  );
}

function PrestamoForm({
  contactos,
  cuentas,
  tasaPredeterminada,
  onCreateAccount,
}: {
  contactos: Contacto[];
  cuentas: Cuenta[];
  tasaPredeterminada: number;
  onCreateAccount: () => void;
}) {
  const [cobraInteres, setCobraInteres] = useState(true);
  const [contactoSeleccionado, setContactoSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [diaPago, setDiaPago] = useState(new Date().getDate());
  return (
    <>
      <FormField label="Deudor *">
        <select
          name="contacto_id"
          className={selectCls}
          value={contactoSeleccionado}
          onChange={(event) => setContactoSeleccionado(event.target.value)}
        >
          <option value="">— Nuevo deudor —</option>
          {contactos.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </FormField>
      {contactoSeleccionado ? (
        <input type="hidden" name="contacto_nombre" value="" />
      ) : (
        <FormField label="Nombre del nuevo deudor *">
          <input
            type="text"
            name="contacto_nombre"
            required
            className={inputCls}
            placeholder="Ej. Juan Pérez"
            autoFocus
          />
        </FormField>
      )}
      <FormField label="Monto principal (Bs) *">
        <input type="number" name="monto_principal" required min={1} step="0.01" className={inputCls} />
      </FormField>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
          <input
            type="checkbox"
            name="cobra_interes"
            value="true"
            checked={cobraInteres}
            onChange={(e) => setCobraInteres(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          Cobra interés mensual
        </label>
      </div>
      {cobraInteres && (
        <FormField label="Tasa mensual (%) *">
          <input type="number" name="tasa_interes_mensual" required min={0.01} max={100} step="0.01" className={inputCls} defaultValue={tasaPredeterminada} placeholder="Ej. 3" />
        </FormField>
      )}
      {!cobraInteres && <input type="hidden" name="tasa_interes_mensual" value="0" />}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Fecha inicio *">
          <DateField
            name="fecha_inicio"
            required
            value={fechaInicio}
            onChange={(value) => {
              setFechaInicio(value);
              setDiaPago(Number(value.slice(-2)));
            }}
          />
        </FormField>
        <FormField label="Día de pago *">
          <input type="number" name="dia_pago" required min={1} max={31} className={inputCls} value={diaPago} onChange={(event) => setDiaPago(Number(event.target.value))} />
        </FormField>
      </div>
      <div className="space-y-1.5">
        <FormField label="Cuenta de origen *">
          <select name="cuenta_dinero_id" required className={selectCls}>
            <option value="">— Selecciona cuenta —</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre} ({money(c.saldo)})</option>
            ))}
          </select>
        </FormField>
        {cuentas.length === 0 ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-[11px] text-on-surface-variant">
            <p>Primero necesitas una cuenta para registrar de dónde sale el dinero.</p>
            <button
              type="button"
              onClick={onCreateAccount}
              className="mt-2 font-bold text-primary hover:underline cursor-pointer"
            >
              + Crear nueva cuenta
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onCreateAccount}
            className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
          >
            + Crear otra cuenta
          </button>
        )}
      </div>
      <FormField label="Notas">
        <textarea name="notas" rows={2} className={`${inputCls} h-auto py-2.5`} />
      </FormField>
      <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-xl px-3 py-2">
        Próximo vencimiento sugerido: día {diaPago} del siguiente mes. Podrás registrar sin interés desactivando la casilla.
      </p>
    </>
  );
}

function PagoForm({ prestamos, cuentas }: { prestamos: Prestamo[]; cuentas: Cuenta[] }) {
  const [total, setTotal] = useState(0);
  const [principal, setPrincipal] = useState(0);
  const [prestamoId, setPrestamoId] = useState(prestamos[0]?.id ?? "");
  const [fechaEsperada, setFechaEsperada] = useState(
    prestamos[0]?.fecha_proximo_pago ?? new Date().toISOString().slice(0, 10),
  );
  const interes = Math.max(0, total - principal);
  const prestamoSeleccionado = prestamos.find((prestamo) => prestamo.id === prestamoId);
  const capitalPendiente = prestamoSeleccionado
    ? loanBalance(prestamoSeleccionado)
    : 0;
  return (
    <>
      <FormField label="Préstamo *">
        <select
          name="prestamo_id"
          required
          className={selectCls}
          value={prestamoId}
          onChange={(event) => {
            const id = event.target.value;
            setPrestamoId(id);
            const siguiente = prestamos.find((prestamo) => prestamo.id === id)?.fecha_proximo_pago;
            if (siguiente) setFechaEsperada(siguiente);
          }}
        >
          <option value="">— Selecciona préstamo —</option>
          {prestamos.filter((p) => p.estado !== "pagado").map((p) => (
            <option key={p.id} value={p.id}>
              {rel(p.contactos)?.nombre ?? "?"} — {p.nombre} ({money(loanBalance(p))} pendiente)
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Fecha a la que corresponde el pago *">
        <DateField
          name="fecha_esperada"
          required
          value={fechaEsperada}
          onChange={setFechaEsperada}
        />
      </FormField>
      <FormField label="Fecha de cobro *">
        <DateField name="recibido_en" required defaultValue={new Date().toISOString().slice(0, 10)} />
      </FormField>
      <FormField label="Monto total cobrado (Bs) *">
        <input type="number" name="monto_total" required min={0.01} step="0.01" className={inputCls} onChange={(e) => setTotal(Number(e.target.value))} />
      </FormField>
      <FormField label={`Capital abonado (Bs) · Interés de este abono: ${money(interes)}`}>
        <input
          type="number"
          name="monto_principal"
          required
          min={0}
          max={Math.min(total, capitalPendiente)}
          step="0.01"
          className={inputCls}
          onChange={(e) => setPrincipal(Number(e.target.value))}
          placeholder={`Máx ${money(Math.min(total, capitalPendiente))}`}
        />
      </FormField>
      <input type="hidden" name="monto_interes" value={interes} />
      <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-xl px-3 py-2">
        Puedes registrar varios abonos para el mismo préstamo. Cada abono conserva
        su interés y se acumula en el historial. Capital pendiente: {money(capitalPendiente)}.
      </p>
      <FormField label="Cuenta de destino *">
        <select name="cuenta_dinero_id" required className={selectCls}>
          <option value="">— Selecciona cuenta —</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Método de pago">
        <input type="text" name="metodo_pago" className={inputCls} placeholder="Efectivo, transferencia, QR..." />
      </FormField>
    </>
  );
}

function MovimientoForm({ cuentas }: { cuentas: Cuenta[] }) {
  const [tipo, setTipo] = useState("ingreso");
  return (
    <>
      <FormField label="Tipo *">
        <select name="tipo" required className={selectCls} value={tipo} onChange={(event) => setTipo(event.target.value)}>
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
          <option value="ajuste">Ajuste</option>
        </select>
      </FormField>
      {tipo === "ajuste" && (
        <FormField label="Efecto del ajuste *">
          <select name="ajuste_sentido" required className={selectCls} defaultValue="">
            <option value="" disabled>— Selecciona —</option>
            <option value="sumar">Sumar dinero a la cuenta</option>
            <option value="restar">Restar dinero de la cuenta</option>
          </select>
        </FormField>
      )}
      {tipo !== "ajuste" && <input type="hidden" name="ajuste_sentido" value="" />}
      <FormField label="Monto (Bs) *">
        <input type="number" name="monto" required min={0.01} step="0.01" className={inputCls} />
      </FormField>
      <FormField label="Fecha *">
        <DateField name="ocurrido_en" required defaultValue={new Date().toISOString().slice(0, 10)} />
      </FormField>
      <FormField label="Cuenta *">
        <select name="cuenta_dinero_id" required className={selectCls}>
          <option value="">— Selecciona cuenta —</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </FormField>
      <FormField label={tipo === "ajuste" ? "Justificación (obligatoria) *" : "Descripción"}>
        <input type="text" name="descripcion" required={tipo === "ajuste"} className={inputCls} placeholder={tipo === "ajuste" ? "Ej. Corregí un saldo digitado por error" : "Descripción del movimiento..."} />
      </FormField>
    </>
  );
}
