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
  LayoutGrid,
  Tag,
  User,
  Phone,
  Mail,
  Banknote,
  Landmark,
  Smartphone,
  PiggyBank,
  MoreHorizontal,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Percent,
  Clock,
  Info,
  History,
  CheckCircle2,
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
import { ModalReciboCobro } from "@/components/finpal-modals";
import { ImportModal } from "@/features/importacion/import-modal";
import { signOut } from "@/app/(auth)/actions";
import { formatDateEs, getLocalDateString, getMesesTranscurridosPrestamo } from "@/lib/format-date";
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
    reciboCobroModal,
    setReciboCobroModal,
    handleSubmitModal,
    preferencias,
  } = useDashboard();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileQuickActionOpen, setMobileQuickActionOpen] = useState(false);
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
    setMobileQuickActionOpen(false);
    setOptimisticPath(null);
    setShowWorkspaceDropdown(false);
    setShowAlertsDropdown(false);
  }, [pathname]);

  const isRouteLoading = optimisticPath !== null && pathname !== optimisticPath;
  const activePath = isRouteLoading ? optimisticPath : pathname;
  const avatarLetters = userEmail ? userEmail.slice(0, 2).toUpperCase() : "FP";
  const isMoreActive = useMemo(() => {
    return [
      "/contactos",
      "/pagos",
      "/cuentas",
      "/reportes",
      "/configuracion",
      "/espacios",
    ].includes(activePath || "");
  }, [activePath]);

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
        className="h-screen max-h-screen w-full max-w-full overflow-hidden bg-surface text-on-surface antialiased flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed"
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
                title="Avisos de cobros y vencimientos"
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
                          Próximos cobros
                        </h3>
                        <p className="text-[11px] text-on-surface-variant">
                          Pagos retrasados, de hoy y de los próximos 5 días
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
                          <p className="text-xs font-bold text-on-surface">¡Todo al día!</p>
                          <p className="text-[11px] text-on-surface-variant">
                            No tienes cobros pendientes ni vencimientos en los próximos 5 días.
                          </p>
                        </div>
                      ) : (
                        <>
                          {alertLoans.late.map((p) => {
                            const deudor = rel(p.contactos)?.nombre ?? "Contacto";
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
                                    Con atraso ({p.dias_atraso}d) · Debe: {money(loanBalance(p))}
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
                            const deudor = rel(p.contactos)?.nombre ?? "Contacto";
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
                                    ¡Toca cobrar hoy! · Cuota aprox.: {money(monthlyInterest(p) || loanBalance(p))}
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
                            const deudor = rel(p.contactos)?.nombre ?? "Contacto";
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
                                    Toca cobrar: {formatDateEs(p.fecha_proximo_pago)}
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
                        Ver todos los préstamos →
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ThemeToggle />

            <div className="flex items-center gap-1.5 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-surface-container-low shrink-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-on-surface text-surface-container-lowest flex items-center justify-center font-bold text-[11px] sm:text-xs ring-2 ring-primary/20 shrink-0 cursor-pointer md:cursor-default"
                aria-label="Abrir menú de usuario"
              >
                {avatarLetters}
              </button>
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
        <main className="w-full max-w-full min-w-0 pt-20 px-3 sm:px-8 pb-24 md:pb-12 min-h-[calc(100dvh-4rem)] overflow-x-hidden">
          {isRouteLoading ? <DashboardRouteSkeleton path={optimisticPath} /> : children}
        </main>
      </div>

      {/* Telón de fondo para menú de acción rápida móvil */}
      <AnimatePresence>
        {mobileQuickActionOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
            onClick={() => setMobileQuickActionOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Menú Flotante de Acción Rápida Móvil */}
      <AnimatePresence>
        {mobileQuickActionOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed bottom-20 left-4 right-4 z-50 md:hidden bg-surface-container-lowest/95 backdrop-blur-md border border-surface-container-high/80 rounded-2xl p-2.5 shadow-2xl space-y-1"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-between border-b border-surface-container-low mb-1">
              <span>Acción rápida</span>
              <span className="text-primary font-semibold">FinPal</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileQuickActionOpen(false);
                openModal("loan");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low text-on-surface text-xs font-semibold cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <HandCoins className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Prestar dinero</span>
                <span className="block text-[10px] text-on-surface-variant font-normal">Anota a quién le prestas y cuánto</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileQuickActionOpen(false);
                openModal("payment");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low text-on-surface text-xs font-semibold cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ReceiptText className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Anotar cobro</span>
                <span className="block text-[10px] text-on-surface-variant font-normal">Anota el dinero que te están pagando</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileQuickActionOpen(false);
                openModal("movement");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low text-on-surface text-xs font-semibold cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Registrar movimiento</span>
                <span className="block text-[10px] text-on-surface-variant font-normal">Ingreso, gasto o transferencia entre cuentas</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileQuickActionOpen(false);
                openModal("contact");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low text-on-surface text-xs font-semibold cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <UsersRound className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Nuevo contacto</span>
                <span className="block text-[10px] text-on-surface-variant font-normal">Añadir deudor o cliente al directorio</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileQuickActionOpen(false);
                openModal("account");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container-low text-on-surface text-xs font-semibold cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <WalletCards className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-bold">Nueva cuenta de dinero</span>
                <span className="block text-[10px] text-on-surface-variant font-normal">Efectivo, banco o billetera digital</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock / Barra de Navegación Móvil Inferior Centrada Simétrica */}
      <nav
        aria-label="Navegación principal móvil"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-container-high/60 px-3 py-1.5 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center justify-items-center w-full">
          {/* Inicio */}
          <Link
            href="/inicio"
            prefetch={true}
            onClick={() => {
              setOptimisticPath("/inicio");
              setMobileQuickActionOpen(false);
            }}
            className={`w-full flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer text-center ${
              activePath === "/inicio"
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <div className="relative">
              <LayoutDashboard className="w-5 h-5" />
              {activePath === "/inicio" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] truncate max-w-full">Inicio</span>
          </Link>

          {/* Préstamos */}
          <Link
            href="/prestamos"
            prefetch={true}
            onClick={() => {
              setOptimisticPath("/prestamos");
              setMobileQuickActionOpen(false);
            }}
            className={`w-full flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer text-center ${
              activePath === "/prestamos"
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <div className="relative">
              <HandCoins className="w-5 h-5" />
              {activePath === "/prestamos" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] truncate max-w-full">Préstamos</span>
          </Link>

          {/* Botón Central de Acción Rápida (+) */}
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={() => setMobileQuickActionOpen((v) => !v)}
              className={`-mt-5 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer ${
                mobileQuickActionOpen
                  ? "bg-on-surface text-surface-container-lowest rotate-45 scale-105"
                  : "bg-primary text-on-primary hover:bg-primary-container shadow-primary/25 hover:scale-105"
              }`}
              aria-label={mobileQuickActionOpen ? "Cerrar menú rápido" : "Acción rápida"}
            >
              <Plus className="w-6 h-6 transition-transform" />
            </button>
          </div>

          {/* Movimientos */}
          <Link
            href="/movimientos"
            prefetch={true}
            onClick={() => {
              setOptimisticPath("/movimientos");
              setMobileQuickActionOpen(false);
            }}
            className={`w-full flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer text-center ${
              activePath === "/movimientos"
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <div className="relative">
              <ArrowLeftRight className="w-5 h-5" />
              {activePath === "/movimientos" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] truncate max-w-full">Movimientos</span>
          </Link>

          {/* Más Secciones */}
          <button
            type="button"
            onClick={() => {
              setMobileQuickActionOpen(false);
              setMobileNavOpen((v) => !v);
            }}
            className={`w-full flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-xl transition-all cursor-pointer text-center ${
              isMoreActive || mobileNavOpen
                ? "text-primary font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
            aria-label="Abrir más secciones"
          >
            <div className="relative">
              <LayoutGrid className="w-5 h-5" />
              {(isMoreActive || mobileNavOpen) && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-[10px] truncate max-w-full">Más</span>
          </button>
        </div>
      </nav>

      {/* Notificación Circular Animada Estilo Móvil con Timbre Armónico */}
      <NotificationToast message={successNotice} onClose={() => setSuccessNotice(null)} />

      <AnimatePresence>
        {modal && (
          <ModalWrapper
            title={
              {
                contact: "Agregar persona",
                loan: "Prestar dinero",
                payment: "Anotar cobro",
                account: "Crear cuenta",
                movement: "Nuevo movimiento",
              }[modal]
            }
            close={handleSafeCloseModal}
            isDirty={isFormDirty}
          >
            <form
              ref={formRef}
              onSubmit={handleSubmitModal}
              onChange={() => setIsFormDirty(true)}
              onInput={() => setIsFormDirty(true)}
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
                      ? "Desliza para guardar el préstamo"
                      : modal === "payment"
                      ? "Desliza para anotar este cobro"
                      : modal === "movement"
                      ? "Desliza para guardar el movimiento"
                      : modal === "account"
                      ? "Desliza para crear la cuenta"
                      : "Desliza para guardar"
                  }
                />
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleSafeCloseModal}
                    className="text-xs font-semibold text-on-surface-variant hover:text-on-surface py-1 transition-colors cursor-pointer"
                  >
                    Cerrar sin guardar
                  </button>
                </div>
              </div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>

      {/* Modal Recibo Oficial de Cobro Digital */}
      <AnimatePresence>
        {reciboCobroModal && (
          <ModalReciboCobro
            pago={reciboCobroModal}
            prestamo={
              prestamos.find((pr) => pr.id === reciboCobroModal.prestamo_id) ??
              prestamos.find((pr) => pr.nombre === rel(reciboCobroModal.prestamos)?.nombre) ??
              null
            }
            espacioNombre={espaciosDisponibles.find((e) => e.id === espacioId)?.nombre}
            colorAcento={preferencias.colorAcento}
            onClose={() => setReciboCobroModal(null)}
          />
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
  isDirty = false,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
  isDirty?: boolean;
}) {
  const [shake, setShake] = useState(false);
  const [showProtectedNotice, setShowProtectedNotice] = useState(false);
  const pointerDownOnBackdrop = useRef(false);

  // Cerrar con Escape respetando comprobación segura
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Si el clic no se inició directamente sobre el fondo oscuro (ej: arrastre para seleccionar texto), ignorar
    if (!pointerDownOnBackdrop.current || e.target !== e.currentTarget) {
      return;
    }
    pointerDownOnBackdrop.current = false;

    // Si el usuario está escribiendo o modificó el formulario:
    // NO disparar el diálogo de confirmación de descarte y NO cerrar el modal.
    // Protegemos al usuario de clics accidentales fuera del formulario.
    if (isDirty) {
      setShake(true);
      setShowProtectedNotice(true);
      setTimeout(() => setShake(false), 350);
      setTimeout(() => setShowProtectedNotice(false), 2200);
      return;
    }

    // Si el formulario no ha sido modificado, se puede cerrar limpiamente
    close();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 select-none"
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={
          shake
            ? {
                y: 0,
                opacity: 1,
                x: [0, -6, 6, -4, 4, -2, 2, 0],
                transition: { duration: 0.32, ease: "easeInOut" },
              }
            : { y: 0, opacity: 1 }
        }
        exit={{ y: 20, opacity: 0 }}
        className="bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl border border-surface-container-high/80 shadow-2xl w-full max-w-xl sm:max-w-[620px] max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-7 relative select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Aviso flotante sutil al hacer clic fuera mientras se edita */}
        <AnimatePresence>
          {showProtectedNotice && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.16 }}
              className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 bg-surface-container-highest/95 backdrop-blur-md text-on-surface text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg border border-primary/30 flex items-center gap-1.5 pointer-events-none whitespace-nowrap text-primary"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-primary" />
              <span>Formulario en edición · Usa la ✕ o Cancelar para salir</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={close}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-heading text-lg sm:text-xl font-bold text-on-surface mb-3.5 sm:mb-4 pr-8">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Campos del Formulario ───────────────────────────────────────────────────

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="block text-xs font-semibold text-on-surface">
          {label}
          {required && <span className="text-primary ml-0.5">*</span>}
        </label>
        {hint && (
          <span className="text-[11px] text-on-surface-variant font-normal shrink-0 whitespace-nowrap">
            {hint}
          </span>
        )}
      </div>
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleOpenPicker = () => {
    try {
      inputRef.current?.showPicker();
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <div
      onClick={handleOpenPicker}
      className="relative flex items-center cursor-pointer group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenPicker();
        }
      }}
    >
      <Calendar className="w-4 h-4 text-outline group-hover:text-primary transition-colors absolute left-3.5 pointer-events-none z-10" />
      <div
        className={`${inputCls} pl-10 pr-14 flex items-center justify-between select-none group-hover:border-primary/60 transition-colors`}
        aria-hidden="true"
      >
        <span className={currentValue ? "text-on-surface font-medium truncate" : "text-on-surface-variant/40"}>
          {currentValue ? formatDateEs(currentValue) : "Seleccionar fecha"}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded shrink-0 pointer-events-none">
          Elegir
        </span>
      </div>
      <input
        ref={inputRef}
        type="date"
        name={name}
        value={currentValue}
        required={required}
        onChange={(event) => {
          if (value === undefined) setInternalValue(event.target.value);
          onChange?.(event.target.value);
        }}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker();
          } catch {}
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-20"
        aria-label="Seleccionar fecha"
      />
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/90 text-base sm:text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";
const selectCls =
  "w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-lowest border border-surface-container-high/90 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer";

function ContactoForm() {
  return (
    <div className="space-y-3.5">
      <FormField label="¿Cómo se llama la persona?" required>
        <div className="relative flex items-center">
          <User className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            name="nombre"
            required
            className={`${inputCls} pl-10`}
            placeholder="Ej. Carlos Mendoza, Doña María..."
            autoFocus
          />
        </div>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Teléfono o WhatsApp" hint="Opcional">
          <div className="relative flex items-center">
            <Phone className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
            <input
              type="tel"
              name="telefono"
              className={`${inputCls} pl-10`}
              placeholder="+591 70000000 (para avisos amables)"
            />
          </div>
        </FormField>
        <FormField label="Correo electrónico" hint="Opcional">
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
            <input
              type="email"
              name="email"
              className={`${inputCls} pl-10`}
              placeholder="carlos@ejemplo.com"
            />
          </div>
        </FormField>
      </div>

      <FormField label="Apuntes o datos útiles" hint="Opcional">
        <textarea
          name="notas"
          rows={2}
          className={`${inputCls} h-auto py-2.5 resize-none`}
          placeholder="Dirección, referencias, apodo o acuerdos de palabra..."
        />
      </FormField>
    </div>
  );
}

const TIPOS_CUENTA = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "banco", label: "Banco", icon: Landmark },
  { value: "billetera_movil", label: "Billetera", icon: Smartphone },
  { value: "ahorro", label: "Ahorros", icon: PiggyBank },
  { value: "otra", label: "Otra", icon: MoreHorizontal },
] as const;

function CuentaForm({ codigoMoneda = "BOB" }: { codigoMoneda?: string }) {
  const [tipo, setTipo] = useState<string>("efectivo");

  return (
    <div className="space-y-4">
      <FormField label="¿Cómo llamas a esta cuenta o bolsillo?" required>
        <div className="relative flex items-center">
          <Landmark className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            name="nombre"
            required
            className={`${inputCls} pl-10`}
            placeholder="Ej. Billetera de bolsillo, BCP Sueldo, Ahorros..."
            autoFocus
          />
        </div>
      </FormField>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-on-surface">
          ¿Qué tipo de cuenta es? <span className="text-primary">*</span>
        </label>
        <input type="hidden" name="tipo" value={tipo} />
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {TIPOS_CUENTA.map(({ value, label, icon: Icon }) => {
            const active = tipo === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTipo(value)}
                className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 p-2 sm:p-2.5 rounded-xl border text-[11px] sm:text-xs transition-all cursor-pointer select-none ${
                  active
                    ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border-outline/15"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${active ? "text-primary" : "text-on-surface-variant"}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <FormField label="¿Con cuánto dinero empiezas hoy?" hint="Opcional">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-xs font-bold text-on-surface-variant select-none pointer-events-none">
            {codigoMoneda}
          </span>
          <input
            type="number"
            name="saldo_inicial"
            defaultValue={0}
            min={0}
            step="0.01"
            className={`${inputCls} pl-14 font-mono font-medium`}
            placeholder="0.00"
          />
        </div>
        <p className="text-[11px] text-on-surface-variant/80 mt-1">
          Es el dinero que tienes en esta cuenta ahora mismo. Si no estás seguro, puedes dejarlo en 0.
        </p>
      </FormField>

      <input type="hidden" name="codigo_moneda" value={codigoMoneda} />
    </div>
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
  const [esNuevoDeudor, setEsNuevoDeudor] = useState(
    contactos.length === 0 || !preset?.contactId,
  );
  const [contactoSeleccionado, setContactoSeleccionado] = useState(
    preset?.contactId ?? (contactos[0]?.id || ""),
  );
  const [contactoNombreNuevo, setContactoNombreNuevo] = useState("");
  const [cobraInteres, setCobraInteres] = useState(initialRate > 0);
  const [tasaInteres, setTasaInteres] = useState<number | string>(
    initialRate > 0 ? initialRate : tasaPredeterminada > 0 ? tasaPredeterminada : 3,
  );
  const [fechaInicio, setFechaInicio] = useState(() => getLocalDateString());
  const [diaPago, setDiaPago] = useState(preset?.diaPago ?? new Date().getDate());
  const [metodoEntrega, setMetodoEntrega] = useState("");

  // Estados para Préstamo Histórico / Migrado
  const [esHistorico, setEsHistorico] = useState(false);
  const [descontarDeCuenta, setDescontarDeCuenta] = useState(true);
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState<string[]>([]);
  const [huboAmortizacion, setHuboAmortizacion] = useState(false);
  const [capitalAmortizado, setCapitalAmortizado] = useState<number | string>(0);

  const presetsTasa = [2, 3, 5];

  // Cálculo de los meses transcurridos entre la fecha de inicio y hoy
  const mesesTranscurridos = useMemo(() => {
    return getMesesTranscurridosPrestamo(fechaInicio, Number(diaPago));
  }, [fechaInicio, diaPago]);

  const handleToggleHistorico = () => {
    setEsHistorico((prev) => {
      const next = !prev;
      if (next) {
        setDescontarDeCuenta(false);
        // Pre-seleccionar todos los meses transcurridos por defecto para dejarlo al día
        setCuotasSeleccionadas(mesesTranscurridos.map((m) => m.fecha));
      } else {
        setDescontarDeCuenta(true);
        setCuotasSeleccionadas([]);
        setHuboAmortizacion(false);
        setCapitalAmortizado(0);
      }
      return next;
    });
  };

  const handleMarcarTodos = () => {
    setCuotasSeleccionadas(mesesTranscurridos.map((m) => m.fecha));
  };

  const handleDesmarcarTodos = () => {
    setCuotasSeleccionadas([]);
  };

  const toggleCuota = (fecha: string) => {
    setCuotasSeleccionadas((prev) =>
      prev.includes(fecha) ? prev.filter((f) => f !== fecha) : [...prev, fecha]
    );
  };

  return (
    <div className="space-y-4">
      {/* ¿A quién le prestas? */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <label className="text-xs font-semibold text-on-surface">
            ¿A quién le prestas? <span className="text-primary">*</span>
          </label>
          {contactos.length > 0 && (
            <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-lg border border-outline/15 text-[11px]">
              <button
                type="button"
                onClick={() => setEsNuevoDeudor(false)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  !esNuevoDeudor
                    ? "bg-surface-container-lowest text-primary font-semibold shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Buscar en contactos
              </button>
              <button
                type="button"
                onClick={() => setEsNuevoDeudor(true)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  esNuevoDeudor
                    ? "bg-surface-container-lowest text-primary font-semibold shadow-2xs"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                + Nueva persona
              </button>
            </div>
          )}
        </div>

        {!esNuevoDeudor && contactos.length > 0 ? (
          <div>
            <select
              name="contacto_id"
              className={selectCls}
              value={contactoSeleccionado}
              onChange={(e) => setContactoSeleccionado(e.target.value)}
              required
            >
              <option value="">— Elige una persona —</option>
              {contactos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.telefono ? `(${c.telefono})` : ""}
                </option>
              ))}
            </select>
            <input type="hidden" name="contacto_nombre" value="" />
          </div>
        ) : (
          <div>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                name="contacto_nombre"
                required
                value={contactoNombreNuevo}
                onChange={(e) => setContactoNombreNuevo(e.target.value)}
                className={`${inputCls} pl-10`}
                placeholder="Nombre de la persona"
                autoFocus
              />
            </div>
            <input type="hidden" name="contacto_id" value="" />
          </div>
        )}
      </div>

      {/* Monto del préstamo y Motivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="¿Cuánto dinero vas a prestar?" required>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-bold text-on-surface-variant select-none pointer-events-none">
              BOB
            </span>
            <input
              type="number"
              name="monto_principal"
              required
              min={1}
              step="0.01"
              defaultValue={preset?.monto ?? ""}
              className={`${inputCls} pl-14 font-mono font-semibold`}
              placeholder="0.00"
            />
          </div>
        </FormField>

        <FormField label="¿Para qué es o cómo lo recuerdas?" hint="Opcional">
          <input
            type="text"
            name="nombre"
            defaultValue={preset?.nombre ?? ""}
            className={inputCls}
            placeholder="Ej. Mercadería, Moto, Ayuda de palabra..."
          />
        </FormField>
      </div>

      {/* Condición de interés */}
      <div className="rounded-xl border border-outline/15 bg-surface-container-low/40 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-primary" />
            <span>Condición del préstamo</span>
          </label>
          <input type="hidden" name="cobra_interes" value={cobraInteres ? "true" : "false"} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setCobraInteres(true);
              if (Number(tasaInteres) === 0) {
                setTasaInteres(tasaPredeterminada > 0 ? tasaPredeterminada : 3);
              }
            }}
            className={`py-2 px-3 rounded-lg border transition-all cursor-pointer font-medium text-center whitespace-nowrap ${
              cobraInteres
                ? "bg-primary text-on-primary font-semibold shadow-xs border-primary"
                : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Con interés mensual
          </button>
          <button
            type="button"
            onClick={() => {
              setCobraInteres(false);
              setTasaInteres(0);
            }}
            className={`py-2 px-3 rounded-lg border transition-all cursor-pointer font-medium text-center whitespace-nowrap ${
              !cobraInteres
                ? "bg-primary text-on-primary font-semibold shadow-xs border-primary"
                : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Sin interés (amigo o familiar)
          </button>
        </div>

        {cobraInteres ? (
          <div className="space-y-2 pt-1 border-t border-outline/10">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex items-center flex-1">
                <input
                  type="number"
                  name="tasa_interes_mensual"
                  required
                  min={0.01}
                  max={100}
                  step="0.01"
                  className={`${inputCls} pr-16 font-mono`}
                  value={tasaInteres}
                  onChange={(e) => setTasaInteres(e.target.value)}
                  placeholder="3"
                />
                <span className="absolute right-3.5 text-xs font-medium text-on-surface-variant pointer-events-none select-none">
                  % al mes
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {presetsTasa.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setTasaInteres(rate)}
                    className={`px-2 sm:px-2.5 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                      Number(tasaInteres) === rate
                        ? "bg-primary/10 border-primary text-primary font-bold"
                        : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
            {Number(tasaInteres) > 3 ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium leading-tight flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <b>Ojo de amigo:</b> En Bolivia la ley fija 3% mensual como tope sugerido (Cód. Civil Art. 409). FinPal guardará el porcentaje que tú decidas.
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>En Bolivia la ley sugiere hasta un 3% mensual (Código Civil Art. 409).</span>
              </p>
            )}
          </div>
        ) : (
          <input type="hidden" name="tasa_interes_mensual" value="0" />
        )}
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Fecha de entrega" required>
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
        <FormField label="Día de cobro mensual" hint="Ej. 15 o 30" required>
          <div className="relative flex items-center">
            <Clock className="w-4 h-4 text-outline absolute left-3.5 pointer-events-none" />
            <input
              type="number"
              name="dia_pago"
              required
              min={1}
              max={31}
              className={`${inputCls} pl-10 font-mono`}
              value={diaPago}
              onChange={(event) => setDiaPago(Number(event.target.value))}
            />
          </div>
        </FormField>
      </div>

      {/* Sección Préstamo Histórico / Migración de Excel */}
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-on-surface">
                ¿Es un préstamo anterior que ya estaba en curso?
              </p>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Para préstamos traídos de Excel, cuadernos o meses pasados
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={esHistorico}
            onClick={handleToggleHistorico}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
              esHistorico ? "bg-primary" : "bg-outline/25 hover:bg-outline/40"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                esHistorico ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {esHistorico && (
          <div className="pt-2 border-t border-primary/15 space-y-3">
            {/* Protección de Saldos en Cuentas */}
            <div className="rounded-xl border border-outline/15 bg-surface-container-lowest p-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!descontarDeCuenta}
                  onChange={(e) => setDescontarDeCuenta(!e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded accent-primary cursor-pointer shrink-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-on-surface block">
                    El dinero ya fue entregado en el pasado (no descontar de mis cuentas)
                  </span>
                  <span className="text-[11px] text-on-surface-variant block mt-0.5 leading-relaxed">
                    Recomendado. No restará dinero del saldo actual de tu caja o banco ni creará salidas de efectivo hoy.
                  </span>
                </div>
              </label>
            </div>

            {/* Asistente de cuotas ya cubiertas */}
            <div className="rounded-xl border border-outline/15 bg-surface-container-lowest p-3 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    ¿Qué meses ya te pagaron antes de hoy?
                  </span>
                  <span className="text-[11px] text-on-surface-variant block">
                    {mesesTranscurridos.length} cuota{mesesTranscurridos.length === 1 ? "" : "s"} transcurrida{mesesTranscurridos.length === 1 ? "" : "s"} desde la fecha de entrega
                  </span>
                </div>
                {mesesTranscurridos.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleMarcarTodos}
                      className="text-[11px] font-bold text-primary hover:underline px-2 py-1 rounded bg-primary/10 transition-colors cursor-pointer"
                    >
                      Marcar todos al día
                    </button>
                    <button
                      type="button"
                      onClick={handleDesmarcarTodos}
                      className="text-[11px] text-on-surface-variant hover:text-on-surface px-2 py-1 transition-colors cursor-pointer"
                    >
                      Desmarcar
                    </button>
                  </div>
                )}
              </div>

              {mesesTranscurridos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {mesesTranscurridos.map((m) => {
                    const checked = cuotasSeleccionadas.includes(m.fecha);
                    return (
                      <label
                        key={m.fecha}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          checked
                            ? "bg-primary/10 border-primary/50 text-on-surface font-medium"
                            : "bg-surface-container-low/60 border-outline/10 text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCuota(m.fecha)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer shrink-0"
                        />
                        <span className="truncate">{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-surface-container-low/50 border border-outline/10 text-xs text-on-surface-variant flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    La fecha de entrega seleccionada es reciente. No hay cuotas vencidas antes de hoy; el primer cobro vencerá en la fecha programada.
                  </span>
                </div>
              )}

              {/* Amortización de capital acumulado en esos meses */}
              <div className="pt-2 border-t border-outline/10 space-y-2">
                <label className="text-xs font-semibold text-on-surface block">
                  ¿Te devolvieron parte del capital en estos meses?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setHuboAmortizacion(false);
                      setCapitalAmortizado(0);
                    }}
                    className={`py-1.5 px-3 rounded-lg border transition-all cursor-pointer font-medium text-center ${
                      !huboAmortizacion
                        ? "bg-primary text-on-primary font-semibold shadow-xs border-primary"
                        : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Solo pagaron intereses
                  </button>
                  <button
                    type="button"
                    onClick={() => setHuboAmortizacion(true)}
                    className={`py-1.5 px-3 rounded-lg border transition-all cursor-pointer font-medium text-center ${
                      huboAmortizacion
                        ? "bg-primary text-on-primary font-semibold shadow-xs border-primary"
                        : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    También devolvieron capital
                  </button>
                </div>
                {huboAmortizacion && (
                  <div className="pt-1 space-y-1">
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-on-surface-variant pointer-events-none select-none">
                        BOB
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={capitalAmortizado || ""}
                        onChange={(e) => setCapitalAmortizado(e.target.value === "" ? 0 : Number(e.target.value))}
                        placeholder="Monto de capital ya devuelto"
                        className={`${inputCls} pl-12 font-mono`}
                      />
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-tight">
                      El saldo pendiente del préstamo se inicializará descontando este abono previo.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <input type="hidden" name="es_historico" value={esHistorico ? "true" : "false"} />
        <input type="hidden" name="descontar_de_cuenta" value={descontarDeCuenta ? "true" : "false"} />
        <input type="hidden" name="cuotas_historicas_pagadas" value={JSON.stringify(cuotasSeleccionadas)} />
        <input type="hidden" name="capital_amortizado_previo" value={String(capitalAmortizado || 0)} />
      </div>

      {/* Cuenta de origen */}
      <div className="space-y-1.5">
        {!esHistorico || descontarDeCuenta ? (
          <>
            <FormField label="¿De dónde salió el dinero prestado?" required>
              <select name="cuenta_dinero_id" required className={selectCls}>
                <option value="">— Elige de dónde sale —</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (Tiene: {money(c.saldo)})
                  </option>
                ))}
              </select>
            </FormField>
            {cuentas.length === 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-on-surface-variant flex items-center justify-between">
                <span>Primero necesitas una cuenta para saber de dónde salió el dinero.</span>
                <button
                  type="button"
                  onClick={onCreateAccount}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  + Crear cuenta
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onCreateAccount}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  + Crear otra cuenta
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Tus cuentas actuales no se verán afectadas (dinero entregado en el pasado).</span>
            </div>
            {cuentas.length > 0 && (
              <input type="hidden" name="cuenta_dinero_id" value={cuentas[0]?.id || ""} />
            )}
          </div>
        )}
      </div>

      {/* Método de entrega */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-on-surface">¿Cómo le entregaste el dinero?</label>
          <span className="text-[11px] text-on-surface-variant">Opcional</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {["Efectivo en mano", "Transferencia bancaria", "Pago QR", "Depósito"].map((m) => {
            const active = metodoEntrega === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMetodoEntrega(active ? "" : m)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  active
                    ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border-outline/15"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          name="metodo_entrega"
          value={metodoEntrega}
          onChange={(e) => setMetodoEntrega(e.target.value)}
          placeholder="O escribe otro medio (ej. Cheque, Tigo Money...)"
          className={`${inputCls} h-9 text-xs`}
        />
      </div>

      {/* Notas */}
      <FormField label="Detalles o acuerdos de palabra" hint="Opcional">
        <textarea
          name="notas"
          rows={2}
          className={`${inputCls} h-auto py-2 resize-none`}
          placeholder="Garantías, acuerdos especiales, recordatorios..."
        />
      </FormField>
    </div>
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
  const [metodoPago, setMetodoPago] = useState("");
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
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
  const interesEstimado = prestamoSeleccionado ? monthlyInterest(prestamoSeleccionado) : 0;
  const cobraInteres = Boolean(prestamoSeleccionado?.cobra_interes && interesEstimado > 0);

  // Modo de cobro amigable:
  // "interes": Solo el interés mensual (la cuota habitual para estar al día)
  // "liquidar": Liquidar todo (deuda total + interés)
  // "personalizado": Ingresar un monto libre recibido
  const [modoCobro, setModoCobro] = useState<"interes" | "liquidar" | "personalizado">(() => {
    return cobraInteres ? "interes" : "liquidar";
  });

  const [montoLibre, setMontoLibre] = useState<number | "">("");
  const [prioridadAbono, setPrioridadAbono] = useState<"interes_primero" | "todo_capital">("interes_primero");
  const [modoAvanzado, setModoAvanzado] = useState(false);
  const [manualPrincipal, setManualPrincipal] = useState<number | "">("");

  // Si cambia el préstamo, sincronizamos modo adecuado
  const handleSelectPrestamo = (p: Prestamo) => {
    setPrestamoId(p.id);
    setUseCustomFecha(false);
    setShowPeriodPicker(false);
    const primerSugerido = p.periodos_sugeridos?.[0]?.fecha ?? p.fecha_proximo_pago ?? getLocalDateString();
    setFechaEsperada(primerSugerido);
    const hasInt = Boolean(p.cobra_interes && monthlyInterest(p) > 0);
    setModoCobro(hasInt ? "interes" : "liquidar");
    setMontoLibre("");
    setManualPrincipal("");
    setModoAvanzado(false);
  };

  // Cálculo en tiempo real de los 3 valores que requiere el sistema
  const { montoTotal, montoPrincipal, montoInteres } = useMemo(() => {
    if (modoCobro === "interes") {
      return {
        montoTotal: interesEstimado,
        montoPrincipal: 0,
        montoInteres: interesEstimado,
      };
    }

    if (modoCobro === "liquidar") {
      const tot = capitalPendiente + (cobraInteres ? interesEstimado : 0);
      return {
        montoTotal: tot,
        montoPrincipal: capitalPendiente,
        montoInteres: cobraInteres ? interesEstimado : 0,
      };
    }

    // Modo Personalizado
    const rawTotal = typeof montoLibre === "number" ? Math.max(0, montoLibre) : 0;
    if (rawTotal <= 0) {
      return { montoTotal: 0, montoPrincipal: 0, montoInteres: 0 };
    }

    if (modoAvanzado && typeof manualPrincipal === "number") {
      const p = Math.min(Math.max(0, manualPrincipal), Math.min(rawTotal, capitalPendiente));
      const i = Math.max(0, rawTotal - p);
      return { montoTotal: rawTotal, montoPrincipal: p, montoInteres: i };
    }

    if (!cobraInteres || prioridadAbono === "todo_capital") {
      const p = Math.min(rawTotal, capitalPendiente);
      const i = Math.max(0, rawTotal - p);
      return { montoTotal: rawTotal, montoPrincipal: p, montoInteres: i };
    }

    // Priorizar cuota mensual de interés primero, el excedente a capital
    const i = Math.min(rawTotal, interesEstimado);
    const p = Math.min(Math.max(0, rawTotal - i), capitalPendiente);
    return {
      montoTotal: rawTotal,
      montoPrincipal: p,
      montoInteres: Math.max(0, rawTotal - p),
    };
  }, [
    modoCobro,
    interesEstimado,
    capitalPendiente,
    cobraInteres,
    montoLibre,
    prioridadAbono,
    modoAvanzado,
    manualPrincipal,
  ]);

  const saldoRestante = Math.max(0, capitalPendiente - montoPrincipal);

  const periodoActivoLabel = useMemo(() => {
    if (!prestamoSeleccionado) return "";
    const encontrado = prestamoSeleccionado.periodos_sugeridos?.find((p) => p.fecha === fechaEsperada);
    if (encontrado) return encontrado.label;
    if (prestamoSeleccionado.fecha_proximo_pago) {
      return `Cuota del ${formatDateEs(prestamoSeleccionado.fecha_proximo_pago)}`;
    }
    return formatDateEs(fechaEsperada);
  }, [prestamoSeleccionado, fechaEsperada]);

  return (
    <div className="space-y-4">
      {/* Selector de Deudor y Préstamo */}
      <DeudorPrestamoPicker
        prestamos={prestamos}
        selectedId={prestamoId}
        onSelect={handleSelectPrestamo}
      />

      {prestamoSeleccionado && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <span>Estado del préstamo</span>
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                prestamoSeleccionado.meses_atrasados > 0
                  ? "bg-error-container text-on-error-container"
                  : prestamoSeleccionado.vence_hoy
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {prestamoSeleccionado.meses_atrasados > 0
                ? `${prestamoSeleccionado.meses_atrasados} cuota(s) pendiente(s)`
                : prestamoSeleccionado.vence_hoy
                ? "Vence hoy"
                : "Al día"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-surface-container-lowest/90 rounded-xl p-2 sm:p-2.5 border border-outline/10">
              <span className="text-[10px] text-on-surface-variant block">Deuda pendiente</span>
              <p className="text-xs sm:text-sm font-bold font-mono text-on-surface mt-0.5">{money(capitalPendiente)}</p>
            </div>
            <div className="bg-surface-container-lowest/90 rounded-xl p-2 sm:p-2.5 border border-outline/10">
              <span className="text-[10px] text-on-surface-variant block">Interés del mes</span>
              <p className="text-xs sm:text-sm font-bold font-mono text-primary mt-0.5">
                {cobraInteres ? money(interesEstimado) : "Sin interés (de confianza)"}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-surface-container-lowest/90 rounded-xl p-2 sm:p-2.5 border border-outline/10">
              <span className="text-[10px] text-on-surface-variant block">Próximo pago acordado</span>
              <p className="text-xs sm:text-sm font-bold text-on-surface mt-0.5">
                {prestamoSeleccionado.fecha_proximo_pago
                  ? formatDateEs(prestamoSeleccionado.fecha_proximo_pago)
                  : "Al día"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selector Intuitivo de Tipo de Cobro */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-on-surface">
          ¿Qué tipo de cobro estás anotando?
        </label>

        {cobraInteres ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Opción 1: Interés del mes */}
            <button
              type="button"
              onClick={() => setModoCobro("interes")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                modoCobro === "interes"
                  ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                  : "bg-surface-container-low hover:bg-surface-container border-outline/15 text-on-surface-variant"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-on-surface whitespace-nowrap">Interés mensual</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary whitespace-nowrap shrink-0">
                  Habitual
                </span>
              </div>
              <p className="text-base font-bold font-mono text-primary">{money(interesEstimado)}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Paga la ganancia del mes.
              </p>
            </button>

            {/* Opción 2: Liquidar deuda */}
            <button
              type="button"
              onClick={() => setModoCobro("liquidar")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                modoCobro === "liquidar"
                  ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                  : "bg-surface-container-low hover:bg-surface-container border-outline/15 text-on-surface-variant"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-on-surface whitespace-nowrap">Pagar todo</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0">
                  Total
                </span>
              </div>
              <p className="text-base font-bold font-mono text-on-surface">{money(capitalPendiente + interesEstimado)}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Cancela la deuda completa.
              </p>
            </button>

            {/* Opción 3: Monto personalizado */}
            <button
              type="button"
              onClick={() => setModoCobro("personalizado")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                modoCobro === "personalizado"
                  ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                  : "bg-surface-container-low hover:bg-surface-container border-outline/15 text-on-surface-variant"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-on-surface whitespace-nowrap">Otro monto</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant whitespace-nowrap shrink-0">
                  Abono
                </span>
              </div>
              <p className="text-base font-bold font-mono text-on-surface">
                {typeof montoLibre === "number" && montoLibre > 0 ? money(montoLibre) : "Ingresar"}
              </p>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Monto libre a cuenta.
              </p>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Opción Liquidar (Sin interés) */}
            <button
              type="button"
              onClick={() => setModoCobro("liquidar")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                modoCobro === "liquidar"
                  ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                  : "bg-surface-container-low hover:bg-surface-container border-outline/15 text-on-surface-variant"
              }`}
            >
              <span className="text-xs font-bold text-on-surface whitespace-nowrap">Pagar toda la deuda</span>
              <p className="text-base font-bold font-mono text-primary">{money(capitalPendiente)}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Devuelve todo el dinero prestado.
              </p>
            </button>

            {/* Opción Abono Parcial (Sin interés) */}
            <button
              type="button"
              onClick={() => setModoCobro("personalizado")}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                modoCobro === "personalizado"
                  ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                  : "bg-surface-container-low hover:bg-surface-container border-outline/15 text-on-surface-variant"
              }`}
            >
              <span className="text-xs font-bold text-on-surface whitespace-nowrap">Otro monto</span>
              <p className="text-base font-bold font-mono text-on-surface">
                {typeof montoLibre === "number" && montoLibre > 0 ? money(montoLibre) : "Ingresar"}
              </p>
              <p className="text-[11px] text-on-surface-variant leading-tight">
                Abono para achicar la deuda.
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Si eligió monto personalizado: único campo numérico + distribución clara */}
      {modoCobro === "personalizado" && (
        <div className="rounded-2xl border border-outline/15 bg-surface-container-low/50 p-3.5 space-y-3">
          <FormField label="¿Cuánto dinero te entregó?" required>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-on-surface-variant select-none pointer-events-none">
                BOB
              </span>
              <input
                type="number"
                required
                min={0.01}
                step="0.01"
                className={`${inputCls} pl-14 font-mono font-bold text-base`}
                value={montoLibre}
                onChange={(e) => {
                  const val = e.target.value === "" ? "" : Number(e.target.value);
                  setMontoLibre(val);
                }}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </FormField>

          {cobraInteres && (
            <div className="space-y-1.5 pt-1 border-t border-outline/10">
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>¿Cómo quieres repartir este dinero?</span>
                <button
                  type="button"
                  onClick={() => setModoAvanzado(!modoAvanzado)}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  {modoAvanzado ? "Modo automático" : "Repartir a mi gusto"}
                </button>
              </div>

              {!modoAvanzado ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrioridadAbono("interes_primero")}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      prioridadAbono === "interes_primero"
                        ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                        : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Cobrar mi ganancia ({money(interesEstimado)}) y el resto a la deuda
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrioridadAbono("todo_capital")}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      prioridadAbono === "todo_capital"
                        ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                        : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Todo directo a bajar el dinero prestado
                  </button>
                </div>
              ) : (
                <div className="pt-1">
                  <FormField label="¿Cuánto resta a la deuda prestada?">
                    <input
                      type="number"
                      min={0}
                      max={typeof montoLibre === "number" ? Math.min(montoLibre, capitalPendiente) : capitalPendiente}
                      step="0.01"
                      className={`${inputCls} font-mono`}
                      value={manualPrincipal}
                      onChange={(e) => setManualPrincipal(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </FormField>
                  <p className="text-[11px] text-on-surface-variant/80 mt-1">
                    La diferencia se anotará automáticamente como ganancia de interés.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tarjeta de Claridad Financiera: Desglose en vivo de qué pasa con el dinero */}
      {montoTotal > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-on-surface">
            <span>Así se reparte este dinero:</span>
            <span className="font-mono text-sm sm:text-base text-primary font-bold">Total: {money(montoTotal)}</span>
          </div>

          <div className="pt-2 border-t border-primary/10 space-y-1.5 text-on-surface-variant">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
                <span>Resta a lo que te debe:</span>
              </span>
              <span className="font-mono font-bold text-on-surface">{money(montoPrincipal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block shrink-0" />
                <span>Tu ganancia (interés):</span>
              </span>
              <span className="font-mono font-bold text-primary">{money(montoInteres)}</span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-primary/10 font-medium">
              <span>Le queda debiendo:</span>
              <span className="font-mono font-bold text-on-surface">{money(saldoRestante)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Inputs ocultos sincronizados que envían los valores exactos a la acción */}
      <input type="hidden" name="prestamo_id" value={prestamoId} />
      <input type="hidden" name="monto_total" value={montoTotal} />
      <input type="hidden" name="monto_principal" value={montoPrincipal} />
      <input type="hidden" name="monto_interes" value={montoInteres} />

      {/* Fecha de cobro y Período al que aplica */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
        <FormField label="Fecha de cobro" hint="Hoy" required>
          <DateField name="recibido_en" required defaultValue={getLocalDateString()} />
        </FormField>

        {prestamoSeleccionado ? (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <label className="block text-xs font-semibold text-on-surface whitespace-nowrap">
                Mes o cuota que cubre
              </label>
              <button
                type="button"
                onClick={() => setShowPeriodPicker(!showPeriodPicker)}
                className="text-primary hover:underline font-semibold text-[11px] shrink-0 cursor-pointer"
              >
                {showPeriodPicker ? "Cerrar" : "Cambiar"}
              </button>
            </div>

            <div className="h-10 px-3 rounded-xl border border-outline/15 bg-surface-container-low flex items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-on-surface truncate">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="font-semibold truncate">{periodoActivoLabel || formatDateEs(fechaEsperada)}</span>
              </span>
            </div>

            {showPeriodPicker && (
              <div className="pt-1 space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Seleccionar:</span>
                  <button
                    type="button"
                    onClick={() => setUseCustomFecha(!useCustomFecha)}
                    className="text-primary hover:underline font-medium cursor-pointer"
                  >
                    {useCustomFecha ? "Sugeridos" : "Fecha libre"}
                  </button>
                </div>

                {!useCustomFecha &&
                prestamoSeleccionado.periodos_sugeridos &&
                prestamoSeleccionado.periodos_sugeridos.length > 0 ? (
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
                    <option value="__custom__">🗓️ Elegir otra fecha en calendario...</option>
                  </select>
                ) : (
                  <DateField name="_fecha_esperada_custom" value={fechaEsperada} onChange={setFechaEsperada} />
                )}
              </div>
            )}
          </div>
        ) : (
          <FormField label="Mes o cuota que cubre">
            <div className="h-10 px-3.5 rounded-xl border border-outline/15 bg-surface-container-low flex items-center text-xs text-on-surface-variant/60">
              Selecciona un préstamo primero
            </div>
          </FormField>
        )}

        <input type="hidden" name="fecha_esperada" value={fechaEsperada} />
      </div>

      {/* Cuenta de destino */}
      <FormField label="¿Dónde guardaste este dinero?" required>
        <select name="cuenta_dinero_id" required className={selectCls}>
          <option value="">— Elige dónde guardarlo —</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre} (Tiene: {money(Number(c.saldo || 0))})
            </option>
          ))}
        </select>
      </FormField>

      {/* Método de pago */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-on-surface">¿Cómo te pagó?</label>
          <span className="text-[11px] text-on-surface-variant">Opcional</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {["Efectivo en mano", "Transferencia bancaria", "Pago QR", "Depósito"].map((m) => {
            const active = metodoPago === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMetodoPago(active ? "" : m)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  active
                    ? "bg-primary text-on-primary border-primary font-semibold shadow-xs"
                    : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface border-outline/15"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          name="metodo_pago"
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          placeholder="O escribe otro medio (ej. Tigo Money, cheque...)"
          className={`${inputCls} h-9 text-xs`}
        />
      </div>

      {/* Notas */}
      <FormField label="Notas o detalle" hint="Opcional">
        <textarea
          name="notas"
          rows={2}
          className={`${inputCls} h-auto py-2 resize-none`}
          placeholder="Ej. Pagó en efectivo, número de comprobante..."
        />
      </FormField>
    </div>
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

const MOV_TYPES = [
  {
    value: "ingreso",
    label: "Entró dinero",
    icon: ArrowDownLeft,
    activeCls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/50 font-bold",
  },
  {
    value: "gasto",
    label: "Salió dinero",
    icon: ArrowUpRight,
    activeCls: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/50 font-bold",
  },
  {
    value: "transferencia",
    label: "Pasar dinero",
    icon: ArrowLeftRight,
    activeCls: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/50 font-bold",
  },
  {
    value: "ajuste",
    label: "Corregir saldo",
    icon: Scale,
    activeCls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/50 font-bold",
  },
] as const;

function MovimientoForm({
  cuentas,
  categorias = [],
}: {
  cuentas: Cuenta[];
  categorias?: Categoria[];
}) {
  const [tipo, setTipo] = useState<"ingreso" | "gasto" | "transferencia" | "ajuste">("ingreso");
  const [ajusteSentido, setAjusteSentido] = useState<"sumar" | "restar">("sumar");
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
    <div className="space-y-4">
      {/* Selector de Tipo en Segmented Control Tabs */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-on-surface">¿Qué movimiento quieres hacer?</label>
        <input type="hidden" name="tipo" value={tipo} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline/15">
          {MOV_TYPES.map(({ value, label, icon: Icon, activeCls }) => {
            const active = tipo === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTipo(value);
                  setCategoriaNombre("");
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs transition-all cursor-pointer select-none border ${
                  active
                    ? `${activeCls} shadow-xs`
                    : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Si es Corregir saldo (Ajuste), elegir si faltaba sumar o restar */}
      {tipo === "ajuste" && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 space-y-2">
          <label className="block text-xs font-semibold text-on-surface">¿Qué pasó con el saldo de esta cuenta?</label>
          <input type="hidden" name="ajuste_sentido" value={ajusteSentido} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAjusteSentido("sumar")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-left ${
                ajusteSentido === "sumar"
                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                  : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              + Me faltaba sumar dinero
            </button>
            <button
              type="button"
              onClick={() => setAjusteSentido("restar")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-left ${
                ajusteSentido === "restar"
                  ? "bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 shadow-2xs"
                  : "bg-surface-container-lowest border-outline/15 text-on-surface-variant hover:text-on-surface"
              }`}
            >
              - Me faltaba restar dinero
            </button>
          </div>
        </div>
      )}
      {tipo !== "ajuste" && <input type="hidden" name="ajuste_sentido" value="" />}

      {/* Monto y Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="¿Cuánto dinero?" required>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-bold text-on-surface-variant select-none pointer-events-none">
              BOB
            </span>
            <input
              type="number"
              name="monto"
              required
              min={0.01}
              step="0.01"
              className={`${inputCls} pl-14 font-mono font-semibold text-base`}
              placeholder="0.00"
              autoFocus
            />
          </div>
        </FormField>

        <FormField label="¿Qué día fue?" required>
          <DateField name="ocurrido_en" required defaultValue={getLocalDateString()} />
        </FormField>
      </div>

      {/* Cuentas de origen y destino */}
      {tipo === "transferencia" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
          <FormField label="¿De qué cuenta sale?" required>
            <select
              name="cuenta_dinero_id"
              required
              className={selectCls}
              value={cuentaOrigenId}
              onChange={(e) => setCuentaOrigenId(e.target.value)}
            >
              <option value="">— Elige origen —</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Tiene: {money(c.saldo)})
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="¿A qué cuenta entra?" required>
            <select name="cuenta_destino_id" required className={selectCls} defaultValue="">
              <option value="" disabled>
                — Elige destino —
              </option>
              {cuentas
                .filter((c) => c.id !== cuentaOrigenId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (Tiene: {money(c.saldo)})
                  </option>
                ))}
            </select>
          </FormField>
        </div>
      ) : (
        <div>
          <FormField
            label={
              tipo === "ajuste"
                ? "¿Qué cuenta vas a corregir?"
                : tipo === "ingreso"
                ? "¿A qué cuenta entra el dinero?"
                : "¿De qué cuenta sale el dinero?"
            }
            required
          >
            <select
              name="cuenta_dinero_id"
              required
              className={selectCls}
              value={cuentaOrigenId}
              onChange={(e) => setCuentaOrigenId(e.target.value)}
            >
              <option value="">— Elige una cuenta —</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} (Tiene: {money(c.saldo)})
                </option>
              ))}
            </select>
          </FormField>
          <input type="hidden" name="cuenta_destino_id" value="" />
        </div>
      )}

      {/* Categoría (solo para ingresos y gastos) */}
      {(tipo === "ingreso" || tipo === "gasto") && (
        <FormField label="Categoría" hint="Opcional">
          <div className="space-y-2">
            <div className="relative flex items-center">
              <Tag className="w-3.5 h-3.5 text-outline absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                name="categoria_nombre"
                value={categoriaNombre}
                onChange={(e) => setCategoriaNombre(e.target.value)}
                className={`${inputCls} pl-9`}
                placeholder="Escribe o elige abajo..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {sugerenciasRapidas.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaNombre(cat === categoriaNombre ? "" : cat)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
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

      {/* Descripción o Justificación */}
      <FormField
        label={tipo === "ajuste" ? "¿Por qué haces esta corrección?" : "Detalle o motivo"}
        hint={tipo === "ajuste" ? "Obligatorio" : "Opcional"}
        required={tipo === "ajuste"}
      >
        <input
          type="text"
          name="descripcion"
          required={tipo === "ajuste"}
          className={inputCls}
          placeholder={
            tipo === "ajuste"
              ? "Ej. Conté mal el dinero en mano o error al tipear..."
              : tipo === "transferencia"
              ? "Ej. Retiro de cajero, traspaso del mes..."
              : tipo === "ingreso"
              ? "Ej. Sueldo, honorarios, venta de hoy..."
              : "Ej. Pago de luz, compras del mes, transporte..."
          }
        />
      </FormField>
    </div>
  );
}
