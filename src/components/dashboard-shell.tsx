"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useTransition, useEffect, useMemo, useRef } from "react";
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
  Menu,
  Check,
  ChevronRight,
} from "lucide-react";
import { useEspacio } from "@/lib/espacio-context";
import { useDashboard, money, loanBalance, monthlyInterest, rel, type Contacto, type Cuenta, type Prestamo } from "@/lib/dashboard-context";
import { FinPalLogo } from "@/components/finpal-logo";
import { ImportModal } from "@/features/importacion/import-modal";
import { signOut } from "@/app/(auth)/actions";
import { formatDateEs } from "@/lib/format-date";
import { InactivityMonitor } from "@/components/inactivity-monitor";
import { DeudorPrestamoPicker } from "@/components/deudor-prestamo-picker";
import { NotificationToast } from "@/components/notification-toast";
import { ACCENT_PALETTES, type AccentColorKey, applyCustomAccent, resetGlobalThemeColors, clearSessionAccent, getSessionAccent } from "@/lib/theme-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConfirmDialog } from "@/components/confirm-dialog";

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

function SlideToConfirm({
  onConfirm,
  submitting,
  resetTrigger,
  label = "Desliza para registrar",
}: {
  onConfirm: () => boolean | void;
  submitting: boolean;
  resetTrigger?: unknown;
  label?: string;
}) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Cada vez que termina el envío o cambia la condición de reseteo, devolver la barra al inicio
  useEffect(() => {
    if (!submitting) {
      setSliderPosition(0);
      setIsDragging(false);
    }
  }, [submitting, resetTrigger]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (submitting) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || submitting || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxOffset = Math.max(0, rect.width - 48);
    const currentX = e.clientX - rect.left - 24;
    const clamped = Math.max(0, Math.min(currentX, maxOffset));
    setSliderPosition(clamped);

    if (clamped >= maxOffset * 0.85) {
      setIsDragging(false);
      setSliderPosition(maxOffset);
      const isOk = onConfirm();
      if (isOk === false) {
        // Validación fallida (campos obligatorios vacíos o con formato inválido)
        setTimeout(() => {
          setSliderPosition(0);
        }, 220);
      } else {
        // En caso de que el navegador detenga la sumisión sin emitir evento onSubmit
        setTimeout(() => {
          setSliderPosition((current) => {
            return submitting ? current : 0;
          });
        }, 600);
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!submitting) {
      setSliderPosition(0);
    }
  };

  return (
    <div
      ref={trackRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-12 bg-surface-container-high/60 border border-surface-container-high rounded-2xl overflow-hidden select-none flex items-center px-1 shadow-inner touch-none"
    >
      <div
        className={`absolute left-0 top-0 bottom-0 bg-primary/20 ${
          isDragging ? "transition-none" : "transition-all duration-300 ease-out"
        }`}
        style={{ width: `${sliderPosition + 48}px` }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-on-surface-variant pointer-events-none gap-1.5 px-12 text-center">
        {submitting ? (
          <span className="flex items-center gap-2 text-primary font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Registrando información...</span>
          </span>
        ) : (
          <span>{label}</span>
        )}
      </div>
      <div
        onPointerDown={handlePointerDown}
        style={{ transform: `translateX(${sliderPosition}px)` }}
        className={`relative z-10 w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing ${
          isDragging
            ? "scale-105 shadow-lg transition-none"
            : "transition-transform duration-300 ease-out"
        }`}
        title="Arrastra hasta el final para confirmar el registro"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin text-on-primary" />
        ) : sliderPosition > 40 ? (
          <Check className="w-4 h-4 text-on-primary" />
        ) : (
          <ChevronRight className="w-5 h-5 text-on-primary" />
        )}
      </div>
    </div>
  );
}

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
    setSuccessNotice,
    handleSubmitModal,
    preferencias,
    guardarPreferencias,
  } = useDashboard();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Advertencia antes de cerrar pestaña con formulario incompleto
  useEffect(() => {
    setIsFormDirty(false);
  }, [modal]);

  useEffect(() => {
    if (!modal || !isFormDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Tienes cambios sin guardar en el formulario. ¿Deseas salir?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [modal, isFormDirty]);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleSafeCloseModal = () => {
    if (isFormDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    setIsFormDirty(false);
    closeModal();
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    setIsFormDirty(false);
    closeModal();
  };

  const handleCancelDiscard = () => {
    setShowDiscardConfirm(false);
  };

  // Cerrar menú móvil automáticamente al navegar
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, optimisticPath]);

  const isRouteLoading = optimisticPath !== null && pathname !== optimisticPath;
  const activePath = isRouteLoading ? optimisticPath : pathname;
  const avatarLetters = userEmail ? userEmail.slice(0, 2).toUpperCase() : "FP";

  const isCustomAccent = preferencias.colorAcento && preferencias.colorAcento !== "verde";
  const customAccent = isCustomAccent && preferencias.colorAcento in ACCENT_PALETTES
    ? ACCENT_PALETTES[preferencias.colorAcento as AccentColorKey]
    : null;

  const themeStyle = customAccent
    ? ({
        "--color-primary": customAccent.primary,
        "--color-primary-container": customAccent.container,
        "--primary": customAccent.primary,
        "--primary-dark": customAccent.dark,
      } as CSSProperties)
    : undefined;

  useEffect(() => {
    if (!customAccent) {
      const cached = getSessionAccent();
      if (!cached || cached === "verde") {
        resetGlobalThemeColors();
      }
      return;
    }

    applyCustomAccent(preferencias.colorAcento);

    const observer = new MutationObserver(() => {
      applyCustomAccent(preferencias.colorAcento);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });

    return () => {
      observer.disconnect();
    };
  }, [customAccent, preferencias.colorAcento]);

  // Si estamos en la selección de espacios, no mostramos el shell del dashboard
  if (pathname === "/espacios") {
    return (
      <div
        style={themeStyle}
        className="min-h-screen w-full max-w-full overflow-x-hidden bg-surface text-on-surface antialiased flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed"
      >
        {children}
        <InactivityMonitor />
      </div>
    );
  }

  return (
    <div
      style={themeStyle}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-surface text-on-surface antialiased flex selection:bg-primary-fixed selection:text-on-primary-fixed"
    >
      {/* Barra de progreso de carga superior */}
      {(isPending || optimisticPath !== null) && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 overflow-hidden bg-primary/20">
          <div className="h-full bg-primary animate-pulse w-full shadow-[0_0_8px_var(--color-primary)]" />
        </div>
      )}

      {/* Telón de fondo para menú móvil */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden animate-fade-in"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 max-w-[85vw] bg-surface-container-lowest border-r border-surface-container-high/60 z-50 flex flex-col justify-between shadow-2xl transition-transform duration-200 ease-in-out md:hidden ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
        aria-label="Menú de navegación móvil"
      >
        <div className="flex flex-col">
          {/* Brand & Close Button */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-surface-container-low">
            <Link
              href="/inicio"
              prefetch={true}
              onClick={() => {
                setOptimisticPath("/inicio");
                setMobileNavOpen(false);
              }}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <FinPalLogo size={38} className="w-10 h-10" colorAcento={preferencias.colorAcento} priority />
              <div className="flex items-baseline tracking-tight font-heading text-xl">
                <span className="font-extrabold text-on-surface">Fin</span>
                <span className="font-extrabold text-primary">Pal</span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de Espacio de Trabajo */}
          <div className="px-4 py-3 relative">
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors border border-surface-container-high/40 text-xs font-semibold cursor-pointer"
              type="button"
              onClick={() => setShowWorkspaceDropdown((v) => !v)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{espacioNombre || "Cargando..."}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute left-4 right-4 top-[3.25rem] bg-surface-container-lowest border border-surface-container-high/80 rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                <Link
                  href="/espacios"
                  prefetch={true}
                  onClick={() => {
                    setShowWorkspaceDropdown(false);
                    setMobileNavOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-primary hover:bg-secondary-container/30 rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ver todos los espacios</span>
                </Link>
              </div>
            )}
          </div>

          {/* Navegación móvil */}
          <nav className="flex flex-col gap-0.5 px-3 mt-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activePath === item.path || pathname === item.path;

              return (
                <Link
                  key={item.key}
                  href={item.path}
                  prefetch={true}
                  onClick={() => {
                    setMobileNavOpen(false);
                    startTransition(() => {
                      setOptimisticPath(item.path);
                    });
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs font-semibold cursor-pointer active:scale-[0.98] ${
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

        {/* Cerrar Sesión Móvil */}
        <div className="p-3 border-t border-surface-container-low">
          <form
            action={signOut}
            onSubmit={() => {
              clearSessionAccent();
            }}
          >
            <button
              type="submit"
              onClick={() => {
                clearSessionAccent();
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-low hover:bg-error-container/40 hover:text-error text-on-surface transition-colors border border-surface-container-high/40 text-xs font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Sidebar Desktop Fija y Persistente */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-60 bg-surface-container-lowest border-r border-surface-container-high/60 z-40 flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col">
          {/* Brand */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-surface-container-low">
            <Link
              href="/inicio"
              prefetch={true}
              onClick={() => setOptimisticPath("/inicio")}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <FinPalLogo size={38} className="w-10 h-10" colorAcento={preferencias.colorAcento} priority />
              <div className="flex items-baseline tracking-tight font-heading text-xl">
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
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate max-w-[120px]">{espacioNombre || "Cargando..."}</span>
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
          <form
            action={signOut}
            onSubmit={() => {
              clearSessionAccent();
            }}
          >
            <button
              type="submit"
              onClick={() => {
                clearSessionAccent();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low hover:bg-error-container/40 hover:text-error text-on-surface transition-colors border border-surface-container-high/40 text-xs font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido Principal con Header Persistente */}
      <div className="pl-0 md:pl-60 flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <header className="fixed top-0 left-0 md:left-60 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.03)] border-b border-surface-container-high/60 z-30 flex items-center justify-between px-3 sm:px-8 max-w-full overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botón menú móvil */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 -ml-1 text-on-surface hover:bg-surface-container rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 text-on-surface" />
            </button>

            {/* Logo en versión móvil */}
            <div className="flex items-center gap-2 md:hidden min-w-0">
              <FinPalLogo size={32} className="w-8 h-8 shrink-0" colorAcento={preferencias.colorAcento} priority />
              <span className="font-heading font-extrabold text-base tracking-tight text-on-surface truncate">Fin<span className="text-primary">Pal</span></span>
            </div>

            {/* Fecha en versión desktop / tablet */}
            <div suppressHydrationWarning className="hidden lg:flex items-center gap-2 text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-surface-container-high/40">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="capitalize" suppressHydrationWarning>
                {new Date().toLocaleDateString("es-BO", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 text-on-surface transition-colors cursor-pointer shrink-0"
              title="Importar Excel o CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
              <span className="hidden sm:inline">Importar Excel / CSV</span>
              <span className="sm:hidden text-[11px]">Importar</span>
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-surface-container-low shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-on-surface text-surface-container-lowest flex items-center justify-center font-bold text-[11px] sm:text-xs ring-2 ring-primary/20 shrink-0">
                {avatarLetters}
              </div>
              <div className="hidden md:flex flex-col text-left max-w-[140px] lg:max-w-[180px]">
                <span className="text-xs font-bold text-on-surface leading-tight truncate">{userEmail}</span>
                <span className="text-[11px] text-on-surface-variant leading-tight truncate">{espacioNombre}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Children Rendered Instantly */}
        <main className="w-full max-w-full min-w-0 pt-20 px-3 sm:px-8 pb-12 min-h-[calc(100dvh-4rem)] overflow-x-hidden">
          {isRouteLoading ? <DashboardRouteSkeleton path={optimisticPath} /> : children}
        </main>
      </div>

      {/* Modals Compartidos */}
      {/* Notificación Circular Animada Estilo Móvil con Timbre Armónico */}
      <NotificationToast
        message={successNotice}
        onClose={() => setSuccessNotice(null)}
      />

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
            close={handleSafeCloseModal}
          >
            <form
              ref={formRef}
              onSubmit={handleSubmitModal}
              onChange={() => setIsFormDirty(true)}
              className="space-y-4"
            >
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

              <div className="pt-2 space-y-2.5">
                <SlideToConfirm
                  submitting={submitting}
                  resetTrigger={`${modal}-${formError ?? ""}`}
                  onConfirm={() => {
                    if (formRef.current) {
                      if (!formRef.current.checkValidity()) {
                        formRef.current.reportValidity();
                        return false;
                      }
                      formRef.current.requestSubmit();
                      return true;
                    }
                    return false;
                  }}
                  label={
                    modal === "loan"
                      ? "Desliza para registrar el préstamo"
                      : modal === "payment"
                      ? "Desliza para registrar el cobro"
                      : modal === "movement"
                      ? "Desliza para registrar el movimiento"
                      : modal === "account"
                      ? "Desliza para crear la cuenta"
                      : "Desliza para confirmar y registrar"
                  }
                />
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleSafeCloseModal}
                    className="text-xs font-semibold text-on-surface-variant hover:text-on-surface py-1 transition-colors cursor-pointer"
                  >
                    Cancelar y descartar
                  </button>
                </div>
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

      {/* Diálogo nativo del sistema para confirmar descarte de cambios */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="¿Descartar cambios?"
        description="Tienes información ingresada en el formulario. Si sales ahora, los datos no guardados se perderán."
        confirmText="Descartar cambios"
        cancelText="Continuar editando"
        variant="danger"
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />

      {/* Monitor de inactividad de sesión (alerta a 15m, cierre automático a 20m) */}
      <InactivityMonitor />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-surface-container rounded-md" />
          <div className="h-8 w-56 bg-surface-container-high rounded-xl" />
          <div className="h-3 w-full max-w-xs bg-surface-container rounded-md" />
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

// ─── Contenedor Modal (Envoltorio) ──────────────────────────────────────────

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      onClick={close}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl border border-surface-container-high/80 shadow-2xl w-full max-w-lg max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-5 sm:p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-heading text-xl font-bold text-on-surface mb-4 pr-8">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Campos del Formulario ───────────────────────────────────────────────────

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
  "w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
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
  const [cobraInteres, setCobraInteres] = useState(tasaPredeterminada > 0);
  const [tasaInteres, setTasaInteres] = useState<number | string>(tasaPredeterminada);
  const [contactoSeleccionado, setContactoSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [diaPago, setDiaPago] = useState(new Date().getDate());
  const [metodoEntrega, setMetodoEntrega] = useState("");
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
      <FormField label="Concepto / Alias del préstamo (opcional)">
        <input
          type="text"
          name="nombre"
          className={inputCls}
          placeholder="Ej. Préstamo personal, Moto, Capital de trabajo..."
        />
      </FormField>
      <FormField label="Monto principal (Bs) *">
        <input type="number" name="monto_principal" required min={1} step="0.01" className={inputCls} />
      </FormField>
      <div className="rounded-xl border border-outline/15 bg-surface-container-low/50 p-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <label className="flex items-start gap-2.5 text-xs font-semibold text-on-surface cursor-pointer select-none">
            <input
              type="checkbox"
              name="cobra_interes"
              value="true"
              checked={cobraInteres}
              onChange={(e) => {
                const checked = e.target.checked;
                setCobraInteres(checked);
                if (!checked) {
                  setTasaInteres(0);
                } else if (Number(tasaInteres) === 0) {
                  setTasaInteres(tasaPredeterminada > 0 ? tasaPredeterminada : 3);
                }
              }}
              className="mt-0.5 w-4 h-4 rounded accent-primary cursor-pointer"
            />
            <div>
              <span className="block text-xs font-semibold text-on-surface">
                Genera cobro de interés mensual (el deudor paga intereses)
              </span>
              <span className="block text-[11px] font-normal text-on-surface-variant">
                {cobraInteres
                  ? "El deudor debe pagar intereses cada mes según la tasa acordada."
                  : "Préstamo de confianza / sin intereses (0%). Solo devuelve el capital prestado."}
              </span>
            </div>
          </label>
          {cobraInteres && Number(tasaInteres) === 0 && (
            <span className="shrink-0 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              0% (sin interés)
            </span>
          )}
        </div>
      </div>
      {cobraInteres && (
        <FormField label="Tasa mensual (%)">
          <input
            type="number"
            name="tasa_interes_mensual"
            required
            min={0}
            max={100}
            step="0.01"
            className={inputCls}
            value={tasaInteres}
            onChange={(e) => setTasaInteres(e.target.value)}
            placeholder="0 para sin interés o ej. 3"
          />
        </FormField>
      )}
      {!cobraInteres && <input type="hidden" name="tasa_interes_mensual" value="0" />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <FormField label="Método de entrega (opcional)">
        <div className="space-y-2">
          <input
            type="text"
            name="metodo_entrega"
            className={inputCls}
            value={metodoEntrega}
            onChange={(e) => setMetodoEntrega(e.target.value)}
            placeholder="Efectivo, transferencia, QR..."
          />
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-on-surface-variant">Opciones rápidas:</span>
            {["Efectivo", "Transferencia bancaria", "Pago QR", "Depósito"].map((metodo) => (
              <button
                key={metodo}
                type="button"
                onClick={() => setMetodoEntrega(metodo)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  metodoEntrega === metodo
                    ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border-outline/15"
                }`}
              >
                {metodo}
              </button>
            ))}
          </div>
        </div>
      </FormField>
      <FormField label="Notas">
        <textarea name="notas" rows={2} className={`${inputCls} h-auto py-2.5`} />
      </FormField>
      <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-xl px-3 py-2">
        Próximo vencimiento sugerido: día {diaPago} del siguiente mes. Puedes ingresar 0% o desactivar la casilla para registrar préstamos sin interés.
      </p>
    </>
  );
}

function PagoForm({ prestamos, cuentas }: { prestamos: Prestamo[]; cuentas: Cuenta[] }) {
  // Solo préstamos que tienen deuda pendiente activa (> 0.01) y no están saldados ni cancelados
  const prestamosPendientes = useMemo(() => {
    return prestamos.filter(
      (p) => p.estado !== "pagado" && p.estado !== "cancelado" && loanBalance(p) > 0.01
    );
  }, [prestamos]);

  const [prestamoId, setPrestamoId] = useState<string>(prestamosPendientes[0]?.id ?? "");
  const [total, setTotal] = useState<number | "">("");
  const [principal, setPrincipal] = useState<number | "">("");
  const [fechaEsperada, setFechaEsperada] = useState(
    prestamosPendientes[0]?.fecha_proximo_pago ?? new Date().toISOString().slice(0, 10),
  );

  const prestamoSeleccionado = useMemo(() => {
    return prestamos.find((prestamo) => prestamo.id === prestamoId) ?? null;
  }, [prestamos, prestamoId]);

  const capitalPendiente = prestamoSeleccionado ? loanBalance(prestamoSeleccionado) : 0;
  const numTotal = typeof total === "number" ? total : 0;
  const numPrincipal = typeof principal === "number" ? principal : 0;
  const interes = Math.max(0, numTotal - numPrincipal);
  const interesEstimado = prestamoSeleccionado ? monthlyInterest(prestamoSeleccionado) : 0;

  const handleSelectPrestamo = (p: Prestamo) => {
    setPrestamoId(p.id);
    if (p.fecha_proximo_pago) {
      setFechaEsperada(p.fecha_proximo_pago);
    }
  };

  const handleFillOnlyInterest = () => {
    if (!prestamoSeleccionado) return;
    const estInt = monthlyInterest(prestamoSeleccionado);
    setTotal(estInt);
    setPrincipal(0);
  };

  const handleFillOnlyCapital = () => {
    if (!prestamoSeleccionado) return;
    const balance = loanBalance(prestamoSeleccionado);
    setTotal(balance);
    setPrincipal(balance);
  };

  const handleFillFullBalance = () => {
    if (!prestamoSeleccionado) return;
    const balance = loanBalance(prestamoSeleccionado);
    const estInt = monthlyInterest(prestamoSeleccionado);
    setTotal(balance + estInt);
    setPrincipal(balance);
  };

  return (
    <>
      {/* Selector inteligente y buscador de deudores con desambiguación completa */}
      <DeudorPrestamoPicker
        prestamos={prestamos}
        selectedId={prestamoId}
        onSelect={handleSelectPrestamo}
      />

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

      <div className="space-y-1.5">
        <FormField label="Monto total cobrado (Bs) *">
          <input
            type="number"
            name="monto_total"
            required
            min={0.01}
            step="0.01"
            className={inputCls}
            value={total}
            onChange={(e) => setTotal(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="0.00"
          />
        </FormField>

        {/* Botones de autocompletado rápido de montos */}
        {prestamoSeleccionado && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-on-surface-variant font-medium">Llenado rápido:</span>
            {interesEstimado > 0 && (
              <button
                type="button"
                onClick={handleFillOnlyInterest}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold badge-amber hover:opacity-90 transition-opacity cursor-pointer"
              >
                Solo interés ({money(interesEstimado)})
              </button>
            )}
            <button
              type="button"
              onClick={handleFillOnlyCapital}
              className="px-2 py-0.5 rounded-md text-[11px] font-semibold badge-emerald hover:opacity-90 transition-opacity cursor-pointer"
            >
              Liquidar capital ({money(capitalPendiente)})
            </button>
            {interesEstimado > 0 && (
              <button
                type="button"
                onClick={handleFillFullBalance}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold badge-neutral hover:opacity-90 transition-opacity cursor-pointer"
              >
                Capital + interés ({money(capitalPendiente + interesEstimado)})
              </button>
            )}
          </div>
        )}
      </div>

      <FormField label={`Capital abonado (Bs) · Interés calculado: ${money(interes)}`}>
        <input
          type="number"
          name="monto_principal"
          required
          min={0}
          max={numTotal > 0 ? Math.min(numTotal, capitalPendiente) : capitalPendiente}
          step="0.01"
          className={inputCls}
          value={principal}
          onChange={(e) => setPrincipal(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`Máx ${money(numTotal > 0 ? Math.min(numTotal, capitalPendiente) : capitalPendiente)}`}
        />
      </FormField>
      <input type="hidden" name="monto_interes" value={interes} />

      <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-xl px-3 py-2 leading-relaxed">
        Cada abono descuenta el capital pendiente y acumula los intereses correspondientes en el historial. Saldo deudor pendiente: <strong className="font-mono text-on-surface">{money(capitalPendiente)}</strong>.
      </p>

      <FormField label="Cuenta de destino del dinero *">
        <select name="cuenta_dinero_id" required className={selectCls}>
          <option value="">— Selecciona cuenta —</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} (Saldo: {money(Number(c.saldo || 0))})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Método de pago">
        <input type="text" name="metodo_pago" className={inputCls} placeholder="Efectivo, transferencia bancaria, QR..." />
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
