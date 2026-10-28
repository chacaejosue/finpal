"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState, useTransition, useEffect, useMemo, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeftRight,
  Bell,
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
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
} from "lucide-react";
import { useEspacio } from "@/lib/espacio-context";
import {
  useDashboard,
  money,
  loanBalance,
  monthlyInterest,
  rel,
  type Contacto,
  type Cuenta,
  type Prestamo,
  type Categoria,
  type ModalPresetOptions,
} from "@/lib/dashboard-context";
import { FinPalLogo } from "@/components/finpal-logo";
import { ImportModal } from "@/features/importacion/import-modal";
import { signOut } from "@/app/(auth)/actions";
import { formatDateEs, getLocalDateString } from "@/lib/format-date";
import { InactivityMonitor } from "@/components/inactivity-monitor";
import { DeudorPrestamoPicker } from "@/components/deudor-prestamo-picker";
import { NotificationToast } from "@/components/notification-toast";
import {
  ACCENT_PALETTES,
  type AccentColorKey,
  applyCustomAccent,
  resetGlobalThemeColors,
  clearSessionAccent,
  getSessionAccent,
} from "@/lib/theme-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardRouteSkeleton } from "@/components/dashboard-skeletons";

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

import { SlideToConfirm, type SlideToConfirmProps } from "@/components/slide-to-confirm";
export { SlideToConfirm, type SlideToConfirmProps };

export function DashboardShell({
  children,
  userEmail,
  espaciosDisponibles = [],
}: {
  children: ReactNode;
  userEmail: string;
  espaciosDisponibles?: { id: string; nombre: string; zona_horaria?: string; codigo_moneda?: string }[];
}) {
  const pathname = usePathname();
  const { espacioId, espacioNombre, codigoMoneda, setEspacio, setCodigoMoneda } = useEspacio();
  const {
    contactos,
    cuentas,
    prestamos,
    categorias,
    totals,
    loadData,
    modal,
    modalPreset,
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
  } = useDashboard();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const workspaceDropdownDesktopRef = useRef<HTMLDivElement>(null);
  const workspaceDropdownMobileRef = useRef<HTMLDivElement>(null);
  const alertsDropdownRef = useRef<HTMLDivElement>(null);

  // Sincronizar moneda del espacio activo desde la lista de espacios disponibles
  useEffect(() => {
    if (!espacioId || !espaciosDisponibles.length) return;
    const found = espaciosDisponibles.find((e) => e.id === espacioId);
    if (found?.codigo_moneda && found.codigo_moneda !== codigoMoneda) {
      setCodigoMoneda(found.codigo_moneda);
    }
  }, [espacioId, espaciosDisponibles, codigoMoneda, setCodigoMoneda]);

  // Cargar preferencia de barra lateral minimizada desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("finpal_sidebar_collapsed");
      if (saved !== null) {
        setSidebarCollapsed(saved === "true");
      }
    } catch {
      // Ignorar si el almacenamiento local está restringido
    }
  }, []);

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("finpal_sidebar_collapsed", String(next));
      } catch {
        // Ignorar
      }
      return next;
    });
  }, []);

  // Cerrar selector de espacios o alertas si se hace clic fuera o se presiona Escape
  useEffect(() => {
    if (!showWorkspaceDropdown && !showAlertsDropdown) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      if (showWorkspaceDropdown) {
        const isInsideDesktop = workspaceDropdownDesktopRef.current?.contains(target);
        const isInsideMobile = workspaceDropdownMobileRef.current?.contains(target);
        if (!isInsideDesktop && !isInsideMobile) {
          setShowWorkspaceDropdown(false);
        }
      }

      if (showAlertsDropdown) {
        const isInsideAlerts = alertsDropdownRef.current?.contains(target);
        if (!isInsideAlerts) {
          setShowAlertsDropdown(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowWorkspaceDropdown(false);
        setShowAlertsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showWorkspaceDropdown, showAlertsDropdown]);

  const handleSwitchWorkspace = (id: string, nombre: string, zona?: string, moneda?: string) => {
    setShowWorkspaceDropdown(false);
    setMobileNavOpen(false);
    if (id === espacioId) return;
    setEspacio(id, nombre, zona, moneda);
  };

  // Alertas de vencimientos para la campana del header
  const alertLoans = useMemo(() => {
    const active = prestamos.filter((p) => p.estado === "activo" || p.estado === "atrasado");
    const late = active.filter((p) => p.estado === "atrasado");
    const today = active.filter((p) => p.vence_hoy && p.estado !== "atrasado");
    const nowTime = Date.now();
    const soon = active.filter((p) => {
      if (p.vence_hoy || p.estado === "atrasado" || !p.fecha_proximo_pago) return false;
      const diffDays = Math.ceil(
        (new Date(`${p.fecha_proximo_pago}T00:00:00`).getTime() - nowTime) / (1000 * 60 * 60 * 24),
      );
      return diffDays >= 1 && diffDays <= 5;
    });
    return {
      late,
      today,
      soon,
      total: late.length + today.length + soon.length,
    };
  }, [prestamos]);

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

  // Cerrar menú móvil, dropdown de espacios y sincronizar ruta optimista automáticamente al navegar
  useEffect(() => {
    setMobileNavOpen(false);
    setOptimisticPath(null);
    setShowWorkspaceDropdown(false);
    setShowAlertsDropdown(false);
  }, [pathname]);

  const isRouteLoading = optimisticPath !== null && pathname !== optimisticPath;
  const activePath = isRouteLoading ? optimisticPath : pathname;
  const avatarLetters = userEmail ? userEmail.slice(0, 2).toUpperCase() : "FP";

  const isCustomAccent = preferencias.colorAcento && preferencias.colorAcento !== "verde";
  const customAccent =
    isCustomAccent && preferencias.colorAcento in ACCENT_PALETTES
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
                setShowWorkspaceDropdown(false);
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
          <div ref={workspaceDropdownMobileRef} className="px-4 py-3 relative">
            <button
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors border border-surface-container-high/40 text-xs font-semibold cursor-pointer"
              type="button"
              onClick={() => setShowWorkspaceDropdown((v) => !v)}
              aria-expanded={showWorkspaceDropdown}
              aria-haspopup="true"
              aria-label="Seleccionar espacio de trabajo"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{espacioNombre || "Cargando..."}</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-200 ${
                  showWorkspaceDropdown ? "rotate-180 text-primary" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showWorkspaceDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-4 right-4 top-[3.25rem] bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 backdrop-blur-md"
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                    <span>Espacios de trabajo</span>
                    <span className="text-[10px] text-primary font-medium">FinPal</span>
                  </div>

                  {espaciosDisponibles && espaciosDisponibles.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {espaciosDisponibles.map((esp) => {
                        const isSelected = esp.id === espacioId;
                        return (
                          <button
                            key={esp.id}
                            type="button"
                            onClick={() =>
                              handleSwitchWorkspace(esp.id, esp.nombre, esp.zona_horaria, esp.codigo_moneda)
                            }
                            className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-on-surface hover:bg-surface-container-low"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FolderOpen
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? "text-primary" : "text-on-surface-variant"
                                }`}
                              />
                              <span className="truncate">{esp.nombre}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-1 border-t border-surface-container-low">
                    <Link
                      href="/espacios"
                      prefetch={true}
                      onClick={() => {
                        setShowWorkspaceDropdown(false);
                        setMobileNavOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Gestionar todos los espacios</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navegación móvil */}
          <nav className="flex flex-col gap-0.5 px-3 mt-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activePath === item.path;

              return (
                <Link
                  key={item.key}
                  href={item.path}
                  prefetch={true}
                  onClick={() => {
                    setShowWorkspaceDropdown(false);
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
              setIsLoggingOut(true);
              clearSessionAccent();
            }}
          >
            <button
              type="submit"
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-low hover:bg-error-container/40 hover:text-error text-on-surface transition-colors border border-surface-container-high/40 text-xs font-medium cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-error" />
                  <span className="font-semibold text-error">Cerrando sesión...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </>
              )}
            </button>
          </form>
        </div>
      </aside>

      {/* Sidebar Desktop Fija y Persistente con Modo Minimizado (Solo Íconos) */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full ${
          sidebarCollapsed ? "w-[4.5rem]" : "w-60"
        } bg-surface-container-lowest border-r border-surface-container-high/60 z-40 flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-[width] duration-300 ease-in-out`}
        aria-label="Menú de navegación lateral"
      >
        <div className="flex flex-col">
          {/* Header del Sidebar: Logo y botón de minimizar/expandir arriba */}
          <div
            className={`h-16 flex items-center border-b border-surface-container-low transition-all duration-300 ${
              sidebarCollapsed ? "px-2 justify-center" : "px-4"
            }`}
          >
            {sidebarCollapsed ? (
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container transition-all duration-200 cursor-pointer group"
                title="Expandir barra lateral"
                aria-label="Expandir barra lateral"
              >
                <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 pointer-events-none">
                  <FinPalLogo size={36} className="w-9 h-9 shrink-0" colorAcento={preferencias.colorAcento} priority />
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-primary opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none">
                  <PanelLeftOpen className="w-5 h-5" />
                </div>
              </button>
            ) : (
              <div className="w-full flex items-center justify-between min-w-0">
                <Link
                  href="/inicio"
                  prefetch={true}
                  onClick={() => {
                    setShowWorkspaceDropdown(false);
                    setOptimisticPath("/inicio");
                  }}
                  className="flex items-center gap-2.5 hover:opacity-90 transition-opacity min-w-0"
                  title="FinPal - Ir a Inicio"
                >
                  <FinPalLogo size={38} className="w-10 h-10 shrink-0" colorAcento={preferencias.colorAcento} priority />
                  <div className="flex items-baseline tracking-tight font-heading text-xl">
                    <span className="font-extrabold text-on-surface">Fin</span>
                    <span className="font-extrabold text-primary">Pal</span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={toggleSidebarCollapse}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                  title="Minimizar barra lateral (solo íconos)"
                  aria-label="Minimizar barra lateral"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Selector de Espacio de Trabajo */}
          <div
            ref={workspaceDropdownDesktopRef}
            className={`py-3 relative ${sidebarCollapsed ? "px-2.5 flex justify-center" : "px-4"}`}
          >
            {sidebarCollapsed ? (
              <button
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors border border-surface-container-high/40 cursor-pointer"
                type="button"
                onClick={() => setShowWorkspaceDropdown((v) => !v)}
                aria-expanded={showWorkspaceDropdown}
                aria-haspopup="true"
                aria-label="Seleccionar espacio de trabajo"
                title={`Espacio actual: ${espacioNombre || "Espacios"}`}
              >
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
              </button>
            ) : (
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors border border-surface-container-high/40 text-xs font-semibold cursor-pointer"
                type="button"
                onClick={() => setShowWorkspaceDropdown((v) => !v)}
                aria-expanded={showWorkspaceDropdown}
                aria-haspopup="true"
                aria-label="Seleccionar espacio de trabajo"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate max-w-[120px]">{espacioNombre || "Cargando..."}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-200 ${
                    showWorkspaceDropdown ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
            )}

            <AnimatePresence>
              {showWorkspaceDropdown && (
                <motion.div
                  initial={sidebarCollapsed ? { opacity: 0, x: -6, scale: 0.98 } : { opacity: 0, y: -6, scale: 0.98 }}
                  animate={sidebarCollapsed ? { opacity: 1, x: 0, scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  exit={sidebarCollapsed ? { opacity: 0, x: -6, scale: 0.98 } : { opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={
                    sidebarCollapsed
                      ? "absolute left-[4.25rem] top-2 w-64 bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 backdrop-blur-md"
                      : "absolute left-4 right-4 top-[3.25rem] bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 backdrop-blur-md"
                  }
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                    <span>Espacios de trabajo</span>
                    <span className="text-[10px] text-primary font-medium">{codigoMoneda}</span>
                  </div>

                  {espaciosDisponibles && espaciosDisponibles.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {espaciosDisponibles.map((esp) => {
                        const isSelected = esp.id === espacioId;
                        return (
                          <button
                            key={esp.id}
                            type="button"
                            onClick={() =>
                              handleSwitchWorkspace(esp.id, esp.nombre, esp.zona_horaria, esp.codigo_moneda)
                            }
                            className={`w-full text-left px-2.5 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-on-surface hover:bg-surface-container-low"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FolderOpen
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? "text-primary" : "text-on-surface-variant"
                                }`}
                              />
                              <span className="truncate max-w-[125px]">{esp.nombre}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-1 border-t border-surface-container-low">
                    <Link
                      href="/espacios"
                      prefetch={true}
                      onClick={() => setShowWorkspaceDropdown(false)}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Gestionar todos los espacios</span>
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navegación con Respuesta Instantánea */}
          <nav className={`flex flex-col gap-1 mt-1 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activePath === item.path;

              if (sidebarCollapsed) {
                return (
                  <Link
                    key={item.key}
                    href={item.path}
                    prefetch={true}
                    title={item.label}
                    onClick={() => {
                      setShowWorkspaceDropdown(false);
                      startTransition(() => {
                        setOptimisticPath(item.path);
                      });
                    }}
                    className={`relative w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all text-xs font-semibold cursor-pointer active:scale-[0.95] group ${
                      isActive
                        ? "bg-primary text-on-primary shadow-xs"
                        : "text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface"
                    }`}
                    aria-label={item.label}
                  >
                    <IconComp className="w-5 h-5 shrink-0" />
                    {item.key === "prestamos" && totals.lateCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-error-container text-on-error-container text-[9px] font-black flex items-center justify-center ring-2 ring-surface-container-lowest shadow-xs"
                        title={`${totals.lateCount} préstamos con atraso`}
                      >
                        {totals.lateCount > 9 ? "9+" : totals.lateCount}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.path}
                  prefetch={true}
                  onClick={() => {
                    setShowWorkspaceDropdown(false);
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

        {/* Footer del Menú: Cerrar Sesión */}
        <div
          className={`border-t border-surface-container-low ${
            sidebarCollapsed ? "p-2 flex flex-col items-center" : "p-3"
          }`}
        >
          {sidebarCollapsed ? (
            <form
              action={signOut}
              onSubmit={() => {
                setIsLoggingOut(true);
                clearSessionAccent();
              }}
            >
              <button
                type="submit"
                disabled={isLoggingOut}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-low hover:bg-error-container/40 hover:text-error text-on-surface transition-colors border border-surface-container-high/40 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                title={isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                aria-label={isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin text-error" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
              </button>
            </form>
          ) : (
            <form
              action={signOut}
              onSubmit={() => {
                setIsLoggingOut(true);
                clearSessionAccent();
              }}
            >
              <button
                type="submit"
                disabled={isLoggingOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-low hover:bg-error-container/40 hover:text-error text-on-surface transition-colors border border-surface-container-high/40 text-xs font-medium cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-error" />
                    <span className="font-semibold text-error">Cerrando sesión...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar sesión</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </aside>

      {/* Contenido Principal con Header Persistente */}
      <div
        className={`pl-0 ${
          sidebarCollapsed ? "md:pl-[4.5rem]" : "md:pl-60"
        } flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden transition-[padding] duration-300 ease-in-out`}
      >
        <header
          className={`fixed top-0 left-0 ${
            sidebarCollapsed ? "md:left-[4.5rem]" : "md:left-60"
          } right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_4px_rgba(0,0,0,0.03)] border-b border-surface-container-high/60 z-30 flex items-center justify-between px-3 sm:px-8 max-w-full transition-[left] duration-300 ease-in-out`}
        >
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
              <span className="font-heading font-extrabold text-base tracking-tight text-on-surface truncate">
                Fin<span className="text-primary">Pal</span>
              </span>
            </div>

            {/* Fecha en versión desktop / tablet */}
            <div
              suppressHydrationWarning
              className="hidden lg:flex items-center gap-2 text-xs font-semibold text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg border border-surface-container-high/40"
            >
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

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Botón Importar Excel / CSV */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container-high/50 transition-colors cursor-pointer"
              title="Importar contactos, préstamos o movimientos desde Excel o CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-primary shrink-0" />
              <span className="hidden sm:inline">Importar</span>
            </button>

            {/* Campana de Centro de Vencimientos y Alertas */}
            <div ref={alertsDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowAlertsDropdown((v) => !v)}
                className="relative p-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container-high/50 transition-colors cursor-pointer"
                title="Centro de vencimientos y alertas de cartera"
                aria-label="Centro de alertas"
              >
                <Bell className="w-4 h-4 text-on-surface-variant" />
                {alertLoans.total > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center ring-2 ring-surface-container-lowest ${
                      alertLoans.late.length > 0
                        ? "bg-error text-on-error"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {alertLoans.total > 9 ? "9+" : alertLoans.total}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showAlertsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-11 w-[calc(100vw-1.5rem)] sm:w-88 max-w-sm bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-surface-container-low flex items-center justify-between bg-surface-container-low/50">
                      <div>
                        <h3 className="font-heading text-xs font-extrabold text-on-surface uppercase tracking-wider">
                          Vencimientos de Cartera
                        </h3>
                        <p className="text-[11px] text-on-surface-variant">
                          Préstamos atrasados, de hoy y próximos 5 días
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAlertsDropdown(false)}
                        className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-surface-container-low p-2 space-y-1">
                      {alertLoans.total === 0 ? (
                        <div className="py-8 px-4 text-center space-y-1.5">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                            <Check className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-on-surface">¡Cartera al día!</p>
                          <p className="text-[11px] text-on-surface-variant">
                            No tienes préstamos en mora ni vencimientos en los próximos 5 días.
                          </p>
                        </div>
                      ) : (
                        <>
                          {alertLoans.late.map((p) => {
                            const deudor = rel(p.contactos)?.nombre ?? "Deudor";
                            return (
                              <div
                                key={p.id}
                                className="p-2.5 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                                    <p className="text-xs font-bold text-on-surface truncate">{deudor}</p>
                                  </div>
                                  <p className="text-[11px] text-on-surface-variant truncate">{p.nombre}</p>
                                  <p className="text-[10px] font-bold text-error mt-0.5">
                                    Atrasado ({p.dias_atraso}d) · Saldo: {money(loanBalance(p))}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAlertsDropdown(false);
                                    openModal("payment", { loanId: p.id });
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-bold shrink-0 hover:bg-primary-container transition-colors cursor-pointer"
                                >
                                  Cobrar
                                </button>
                              </div>
                            );
                          })}

                          {alertLoans.today.map((p) => {
                            const deudor = rel(p.contactos)?.nombre ?? "Deudor";
                            return (
                              <div
                                key={p.id}
                                className="p-2.5 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                    <p className="text-xs font-bold text-on-surface truncate">{deudor}</p>
                                  </div>
                                  <p className="text-[11px] text-on-surface-variant truncate">{p.nombre}</p>
                                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                    ¡Vence hoy! · Cuota est.: {money(monthlyInterest(p) || loanBalance(p))}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAlertsDropdown(false);
                                    openModal("payment", { loanId: p.id });
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-primary text-on-primary text-[11px] font-bold shrink-0 hover:bg-primary-container transition-colors cursor-pointer"
                                >
                                  Cobrar
                                </button>
                              </div>
                            );
                          })}

                          {alertLoans.soon.map((p) => {
                            const deudor = rel(p.contactos)?.nombre ?? "Deudor";
                            return (
                              <div
                                key={p.id}
                                className="p-2.5 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                    <p className="text-xs font-bold text-on-surface truncate">{deudor}</p>
                                  </div>
                                  <p className="text-[11px] text-on-surface-variant truncate">{p.nombre}</p>
                                  <p className="text-[10px] text-on-surface-variant mt-0.5">
                                    Vence: {formatDateEs(p.fecha_proximo_pago)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAlertsDropdown(false);
                                    openModal("payment", { loanId: p.id });
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold shrink-0 transition-colors cursor-pointer"
                                >
                                  Cobrar
                                </button>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>

                    <div className="px-3 py-2 border-t border-surface-container-low bg-surface-container-low/40 text-center">
                      <Link
                        href="/prestamos"
                        onClick={() => setShowAlertsDropdown(false)}
                        className="text-[11px] font-bold text-primary hover:underline"
                      >
                        Ver toda la cartera de préstamos →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ThemeToggle />

            <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-surface-container-low shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-on-surface text-surface-container-lowest flex items-center justify-center font-bold text-[11px] sm:text-xs ring-2 ring-primary/20 shrink-0">
                {avatarLetters}
              </div>
              <div className="hidden md:flex flex-col text-left max-w-[140px] lg:max-w-[180px]">
                <span className="text-xs font-bold text-on-surface leading-tight truncate">{userEmail}</span>
                <span className="text-[11px] text-on-surface-variant leading-tight truncate">
                  {espacioNombre} ({codigoMoneda})
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Children Rendered Instantly */}
        <main className="w-full max-w-full min-w-0 pt-20 px-3 sm:px-8 pb-12 min-h-[calc(100dvh-4rem)] overflow-x-hidden">
          {isRouteLoading ? <DashboardRouteSkeleton path={optimisticPath} /> : children}
        </main>
      </div>

      {/* Notificación Circular Animada Estilo Móvil con Timbre Armónico */}
      <NotificationToast message={successNotice} onClose={() => setSuccessNotice(null)} />

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
              {modal === "account" && <CuentaForm codigoMoneda={codigoMoneda} />}
              {modal === "loan" && (
                <PrestamoForm
                  contactos={contactos}
                  cuentas={cuentas}
                  tasaPredeterminada={preferencias.tasaInteresPredeterminada}
                  preset={modalPreset}
                  onCreateAccount={() => openModal("account")}
                />
              )}
              {modal === "payment" && (
                <PagoForm
                  prestamos={prestamos}
                  cuentas={cuentas}
                  initialLoanId={modalPreset?.loanId}
                />
              )}
              {modal === "movement" && (
                <MovimientoForm cuentas={cuentas} categorias={categorias} />
              )}

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

      {/* Overlay de Cierre de Sesión Seguro */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs select-none p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3.5 p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high/80 shadow-2xl text-center max-w-xs w-full"
            >
              <div className="w-12 h-12 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error shadow-2xs">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface font-heading">Cerrando sesión...</h3>
                <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                  Saliendo de tu cuenta y asegurando tus datos de forma protegida.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monitor de inactividad de sesión (alerta a 15m, cierre automático a 20m) */}
      <InactivityMonitor />
    </div>
  );
}

export { DashboardRouteSkeleton } from "@/components/dashboard-skeletons";

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
      <div className={`${inputCls} flex items-center select-none`} aria-hidden="true">
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
const selectCls =
  "w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer";

function ContactoForm() {
  return (
    <>
      <FormField label="Nombre completo *">
        <input type="text" name="nombre" required className={inputCls} placeholder="Ej. Carlos Mendoza" />
      </FormField>
      <FormField label="Teléfono (opcional)">
        <input type="tel" name="telefono" className={inputCls} placeholder="+591 70000000" />
      </FormField>
      <FormField label="Email (opcional)">
        <input type="email" name="email" className={inputCls} placeholder="correo@ejemplo.com" />
      </FormField>
      <FormField label="Notas (opcional)">
        <textarea
          name="notas"
          rows={2}
          className={`${inputCls} h-auto py-2.5`}
          placeholder="Información adicional..."
        />
      </FormField>
    </>
  );
}

function CuentaForm({ codigoMoneda = "BOB" }: { codigoMoneda?: string }) {
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
      <FormField label={`Saldo inicial (${codigoMoneda}) (opcional)`}>
        <input type="number" name="saldo_inicial" defaultValue={0} min={0} step="0.01" className={inputCls} />
      </FormField>
      <input type="hidden" name="codigo_moneda" value={codigoMoneda} />
    </>
  );
}

function PrestamoForm({
  contactos,
  cuentas,
  tasaPredeterminada,
  preset,
  onCreateAccount,
}: {
  contactos: Contacto[];
  cuentas: Cuenta[];
  tasaPredeterminada: number;
  preset?: ModalPresetOptions | null;
  onCreateAccount: () => void;
}) {
  const initialRate = preset?.tasa !== undefined ? preset.tasa : tasaPredeterminada;
  const [cobraInteres, setCobraInteres] = useState(initialRate > 0);
  const [tasaInteres, setTasaInteres] = useState<number | string>(initialRate);
  const [contactoSeleccionado, setContactoSeleccionado] = useState(preset?.contactId ?? "");
  const [fechaInicio, setFechaInicio] = useState(() => getLocalDateString());
  const [diaPago, setDiaPago] = useState(preset?.diaPago ?? new Date().getDate());
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
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
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
          defaultValue={preset?.nombre ?? ""}
          className={inputCls}
          placeholder="Ej. Préstamo personal, Moto, Capital de trabajo..."
        />
      </FormField>
      <FormField label="Monto principal *">
        <input
          type="number"
          name="monto_principal"
          required
          min={1}
          step="0.01"
          defaultValue={preset?.monto ?? ""}
          className={inputCls}
        />
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
          <input
            type="number"
            name="dia_pago"
            required
            min={1}
            max={31}
            className={inputCls}
            value={diaPago}
            onChange={(event) => setDiaPago(Number(event.target.value))}
          />
        </FormField>
      </div>
      <div className="space-y-1.5">
        <FormField label="Cuenta de origen *">
          <select name="cuenta_dinero_id" required className={selectCls}>
            <option value="">— Selecciona cuenta —</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({money(c.saldo)})
              </option>
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
      <FormField label="Notas (opcional)">
        <textarea
          name="notas"
          rows={2}
          className={`${inputCls} h-auto py-2.5`}
          placeholder="Detalles adicionales, recordatorios, acuerdos especiales..."
        />
      </FormField>
      <p className="text-[11px] text-on-surface-variant bg-surface-container-low rounded-xl px-3 py-2">
        Próximo vencimiento sugerido: día {diaPago} del siguiente mes. Puedes ingresar 0% o desactivar la casilla para registrar préstamos sin interés.
      </p>
    </>
  );
}

function PagoForm({
  prestamos,
  cuentas,
  initialLoanId,
}: {
  prestamos: Prestamo[];
  cuentas: Cuenta[];
  initialLoanId?: string;
}) {
  // Solo préstamos que tienen deuda pendiente activa (> 0.01) y no están saldados ni cancelados
  const prestamosPendientes = useMemo(() => {
    return prestamos.filter(
      (p) => p.estado !== "pagado" && p.estado !== "cancelado" && loanBalance(p) > 0.01,
    );
  }, [prestamos]);

  const defaultLoan = useMemo(() => {
    if (initialLoanId) {
      const found = prestamosPendientes.find((p) => p.id === initialLoanId);
      if (found) return found;
    }
    return prestamosPendientes[0] ?? null;
  }, [prestamosPendientes, initialLoanId]);

  const [prestamoId, setPrestamoId] = useState<string>(defaultLoan?.id ?? "");
  const [total, setTotal] = useState<number | "">("");
  const [principal, setPrincipal] = useState<number | "">("");
  const [metodoPago, setMetodoPago] = useState("");
  const [useCustomFecha, setUseCustomFecha] = useState(false);
  const [fechaEsperada, setFechaEsperada] = useState(
    defaultLoan?.periodos_sugeridos?.[0]?.fecha ??
      defaultLoan?.fecha_proximo_pago ??
      getLocalDateString(),
  );

  const prestamoSeleccionado = useMemo(() => {
    return prestamos.find((prestamo) => prestamo.id === prestamoId) ?? null;
  }, [prestamos, prestamoId]);

  useEffect(() => {
    if (prestamoSeleccionado) {
      const primerSugerido =
        prestamoSeleccionado.periodos_sugeridos?.[0]?.fecha ??
        prestamoSeleccionado.fecha_proximo_pago;
      if (primerSugerido) {
        setFechaEsperada(primerSugerido);
      }
    }
  }, [prestamoId, prestamoSeleccionado]);

  const capitalPendiente = prestamoSeleccionado ? loanBalance(prestamoSeleccionado) : 0;
  const numTotal = typeof total === "number" ? total : 0;
  const numPrincipal = typeof principal === "number" ? principal : 0;
  const interes = Math.max(0, numTotal - numPrincipal);
  const interesEstimado = prestamoSeleccionado ? monthlyInterest(prestamoSeleccionado) : 0;

  const handleSelectPrestamo = (p: Prestamo) => {
    setPrestamoId(p.id);
    setUseCustomFecha(false);
    const primerSugerido = p.periodos_sugeridos?.[0]?.fecha ?? p.fecha_proximo_pago ?? getLocalDateString();
    setFechaEsperada(primerSugerido);
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
      <DeudorPrestamoPicker
        prestamos={prestamos}
        selectedId={prestamoId}
        onSelect={handleSelectPrestamo}
      />

      {prestamoSeleccionado && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span>Estado del préstamo y cuotas</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                prestamoSeleccionado.meses_atrasados > 0
                  ? "bg-error-container text-on-error-container"
                  : prestamoSeleccionado.vence_hoy
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {prestamoSeleccionado.meses_atrasados > 0
                ? `${prestamoSeleccionado.meses_atrasados} cuota(s) atrasada(s)`
                : prestamoSeleccionado.vence_hoy
                ? "Vence hoy"
                : "Al día"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-surface-container-lowest/80 rounded-xl p-2.5 border border-surface-container-high/40">
              <span className="text-[10px] text-on-surface-variant block font-medium">Último pago registrado</span>
              {prestamoSeleccionado.ultimo_pago ? (
                <div className="mt-0.5">
                  <p className="text-xs font-bold text-on-surface">
                    {money(prestamoSeleccionado.ultimo_pago.monto_total)} ·{" "}
                    {formatDateEs(prestamoSeleccionado.ultimo_pago.recibido_en)}
                  </p>
                  <span className="block text-[10px] text-primary font-medium">
                    Cubrió: {prestamoSeleccionado.ultimo_mes_cubierto || "Período anterior"}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic mt-0.5">Sin cobros previos registrados</p>
              )}
            </div>

            <div className="bg-surface-container-lowest/80 rounded-xl p-2.5 border border-surface-container-high/40">
              <span className="text-[10px] text-on-surface-variant block font-medium">Próximo vencimiento adeudado</span>
              <p className="text-xs font-bold text-on-surface mt-0.5">
                {prestamoSeleccionado.fecha_proximo_pago
                  ? formatDateEs(prestamoSeleccionado.fecha_proximo_pago)
                  : "Al día"}
              </p>
              {prestamoSeleccionado.dias_atraso > 0 && (
                <span className="text-[10px] text-error font-bold block">
                  ⚠️ Atrasado hace {prestamoSeleccionado.dias_atraso} días
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <FormField label="Período / Cuota a la que corresponde este cobro *">
        {prestamoSeleccionado &&
        prestamoSeleccionado.periodos_sugeridos &&
        prestamoSeleccionado.periodos_sugeridos.length > 0 &&
        !useCustomFecha ? (
          <div className="space-y-1.5">
            <select
              value={fechaEsperada}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setUseCustomFecha(true);
                } else {
                  setFechaEsperada(e.target.value);
                }
              }}
              className={selectCls}
            >
              {prestamoSeleccionado.periodos_sugeridos.map((per) => (
                <option key={per.fecha} value={per.fecha}>
                  {per.label}
                </option>
              ))}
              <option value="__custom__">⚙️ Otra fecha personalizada...</option>
            </select>
            <input type="hidden" name="fecha_esperada" value={fechaEsperada} />
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1">
              <span>
                Período a saldar: <strong className="text-primary">{formatDateEs(fechaEsperada)}</strong>
              </span>
              <button
                type="button"
                onClick={() => setUseCustomFecha(true)}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Ingresar fecha manual
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <DateField name="fecha_esperada" required value={fechaEsperada} onChange={setFechaEsperada} />
            {prestamoSeleccionado?.periodos_sugeridos &&
              prestamoSeleccionado.periodos_sugeridos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseCustomFecha(false)}
                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                >
                  ↩ Volver a las cuotas sugeridas del préstamo
                </button>
              )}
          </div>
        )}
      </FormField>

      <FormField label="Fecha real en que recibiste el dinero (Fecha de cobro) *">
        <DateField name="recibido_en" required defaultValue={getLocalDateString()} />
      </FormField>

      <div className="space-y-1.5">
        <FormField label="Monto total cobrado *">
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

        {prestamoSeleccionado && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-on-surface-variant font-medium">Llenado rápido:</span>
            {interesEstimado > 0 && (
              <button
                type="button"
                onClick={handleFillOnlyInterest}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold badge-amber hover:opacity-90 transition-opacity cursor-pointer"
              >
                Solo interés mensual ({money(interesEstimado)})
              </button>
            )}
            <button
              type="button"
              onClick={handleFillOnlyCapital}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold badge-emerald hover:opacity-90 transition-opacity cursor-pointer"
            >
              Solo capital ({money(capitalPendiente)})
            </button>
            {interesEstimado > 0 && (
              <button
                type="button"
                onClick={handleFillFullBalance}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold badge-neutral hover:opacity-90 transition-opacity cursor-pointer border border-primary/30"
              >
                ⚡ Liquidar todo ({money(capitalPendiente + interesEstimado)})
              </button>
            )}
          </div>
        )}
      </div>

      <FormField label={`Capital abonado · Interés calculado: ${money(interes)}`}>
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
        Cada abono descuenta el capital pendiente y acumula los intereses correspondientes en el historial. Saldo deudor pendiente:{" "}
        <strong className="font-mono text-on-surface">{money(capitalPendiente)}</strong>.
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

      <FormField label="Método de pago (opcional)">
        <div className="space-y-1.5">
          <input
            type="text"
            name="metodo_pago"
            className={inputCls}
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            placeholder="Efectivo, transferencia bancaria, QR..."
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {["Efectivo", "Transferencia bancaria", "Pago QR", "Depósito"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetodoPago(m)}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  metodoPago === m
                    ? "bg-primary text-on-primary border-primary font-semibold"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline/15"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </FormField>

      <FormField label="Notas del cobro (opcional)">
        <textarea
          name="notas"
          rows={2}
          className={`${inputCls} h-auto py-2.5`}
          placeholder="Ej. Pagó en efectivo, comprobante #1234..."
        />
      </FormField>
    </>
  );
}

const SUGERENCIAS_CATEGORIA_INGRESO = [
  "Sueldo / Honorarios",
  "Ventas / Negocio",
  "Aporte de capital",
  "Rendimientos",
  "Otros ingresos",
];

const SUGERENCIAS_CATEGORIA_GASTO = [
  "Operativo / Negocio",
  "Servicios básicos",
  "Alimentación",
  "Transporte",
  "Impuestos / Comisiones",
  "Personal / Hogar",
];

function MovimientoForm({
  cuentas,
  categorias = [],
}: {
  cuentas: Cuenta[];
  categorias?: Categoria[];
}) {
  const [tipo, setTipo] = useState("ingreso");
  const [cuentaOrigenId, setCuentaOrigenId] = useState(cuentas[0]?.id ?? "");
  const [categoriaNombre, setCategoriaNombre] = useState("");

  const categoriasDelTipo = useMemo(() => {
    return categorias.filter((c) => c.tipo === tipo);
  }, [categorias, tipo]);

  const sugerenciasRapidas = useMemo(() => {
    const base = tipo === "ingreso" ? SUGERENCIAS_CATEGORIA_INGRESO : SUGERENCIAS_CATEGORIA_GASTO;
    const customNames = categoriasDelTipo.map((c) => c.nombre);
    return Array.from(new Set([...customNames, ...base]));
  }, [tipo, categoriasDelTipo]);

  return (
    <>
      <FormField label="Tipo de movimiento *">
        <select
          name="tipo"
          required
          className={selectCls}
          value={tipo}
          onChange={(event) => {
            setTipo(event.target.value);
            setCategoriaNombre("");
          }}
        >
          <option value="ingreso">Ingreso de dinero</option>
          <option value="gasto">Gasto / Salida</option>
          <option value="transferencia">Transferencia entre mis cuentas</option>
          <option value="ajuste">Ajuste contable de saldo</option>
        </select>
      </FormField>

      {tipo === "ajuste" && (
        <FormField label="Efecto del ajuste *">
          <select name="ajuste_sentido" required className={selectCls} defaultValue="">
            <option value="" disabled>
              — Selecciona —
            </option>
            <option value="sumar">Sumar dinero a la cuenta</option>
            <option value="restar">Restar dinero de la cuenta</option>
          </select>
        </FormField>
      )}
      {tipo !== "ajuste" && <input type="hidden" name="ajuste_sentido" value="" />}

      <FormField label="Monto *">
        <input type="number" name="monto" required min={0.01} step="0.01" className={inputCls} placeholder="0.00" />
      </FormField>

      <FormField label="Fecha *">
        <DateField name="ocurrido_en" required defaultValue={getLocalDateString()} />
      </FormField>

      <FormField label={tipo === "transferencia" ? "Cuenta de origen (de donde sale) *" : "Cuenta *"}>
        <select
          name="cuenta_dinero_id"
          required
          className={selectCls}
          value={cuentaOrigenId}
          onChange={(e) => setCuentaOrigenId(e.target.value)}
        >
          <option value="">— Selecciona cuenta —</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} (Saldo: {money(c.saldo)})
            </option>
          ))}
        </select>
      </FormField>

      {tipo === "transferencia" && (
        <FormField label="Cuenta de destino (a donde entra) *">
          <select name="cuenta_destino_id" required className={selectCls} defaultValue="">
            <option value="" disabled>
              — Selecciona cuenta de destino —
            </option>
            {cuentas
              .filter((c) => c.id !== cuentaOrigenId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Saldo: {money(c.saldo)})
                </option>
              ))}
          </select>
        </FormField>
      )}

      {(tipo === "ingreso" || tipo === "gasto") && (
        <FormField label="Categoría (opcional)">
          <div className="space-y-1.5">
            <div className="relative">
              <Tag className="w-3.5 h-3.5 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="categoria_nombre"
                value={categoriaNombre}
                onChange={(e) => setCategoriaNombre(e.target.value)}
                className={`${inputCls} pl-8`}
                placeholder="Elige abajo o escribe una categoría..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {sugerenciasRapidas.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaNombre(cat === categoriaNombre ? "" : cat)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                    categoriaNombre === cat
                      ? "bg-primary text-on-primary border-primary font-semibold"
                      : "bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline/15"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </FormField>
      )}

      <FormField label={tipo === "ajuste" ? "Justificación (obligatoria) *" : "Descripción / Nota (opcional)"}>
        <input
          type="text"
          name="descripcion"
          required={tipo === "ajuste"}
          className={inputCls}
          placeholder={
            tipo === "ajuste"
              ? "Ej. Corregí un saldo digitado por error"
              : tipo === "transferencia"
              ? "Ej. Retiro de cajero o fondeo de cuenta..."
              : "Descripción del movimiento..."
          }
        />
      </FormField>
    </>
  );
}
