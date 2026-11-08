"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Building2,
  HandCoins,
  Info,
  LogOut,
  Plus,
  ReceiptText,
  WalletCards,
  X,
  Loader2,
  Users,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { crearEspacio } from "./actions";
import { signOut } from "@/app/(auth)/actions";
import { useEspacio } from "@/lib/espacio-context";
import { useDashboard } from "@/lib/dashboard-context";
import { formatDateEs } from "@/lib/format-date";
import {
  clearSessionAccent,
  applyCustomAccent,
  setSessionAccent,
  getSessionAccent,
  ACCENT_PALETTES,
  type AccentColorKey,
} from "@/lib/theme-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ConfirmDialog } from "@/components/confirm-dialog";

type EspacioRow = {
  id: string;
  nombre: string;
  codigo_moneda: string;
  created_at: string;
  zona_horaria?: string;
  contactos: { count: number }[];
  prestamos: { count: number }[];
};

const ICONS = [WalletCards, HandCoins, Building2, ReceiptText];

export default function EspaciosClient({
  espacios,
  userEmail,
  initialColorAcento = "verde",
}: {
  espacios: EspacioRow[];
  userEmail: string;
  initialColorAcento?: string;
}) {
  const router = useRouter();
  const { setEspacio } = useEspacio();
  const { preferencias } = useDashboard();

  // Color de acento efectivo: de perfiles (servidor), de sesión o de preferencias
  const effectiveAccent =
    (initialColorAcento && initialColorAcento !== "verde" ? initialColorAcento : null) ||
    getSessionAccent() ||
    preferencias?.colorAcento ||
    "verde";

  useEffect(() => {
    if (effectiveAccent) {
      setSessionAccent(effectiveAccent);
      applyCustomAccent(effectiveAccent);
    }
    const observer = new MutationObserver(() => {
      applyCustomAccent(effectiveAccent);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => observer.disconnect();
  }, [effectiveAccent]);

  const customAccent =
    effectiveAccent && effectiveAccent !== "verde" && effectiveAccent in ACCENT_PALETTES
      ? ACCENT_PALETTES[effectiveAccent as AccentColorKey]
      : null;

  const themeStyle = customAccent
    ? ({
        "--color-primary": customAccent.primary,
        "--color-primary-container": customAccent.container,
        "--primary": customAccent.primary,
        "--primary-dark": customAccent.dark,
      } as React.CSSProperties)
    : undefined;
  const [showModal, setShowModal] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [modalShake, setModalShake] = useState(false);
  const [showProtectedNotice, setShowProtectedNotice] = useState(false);
  const pointerDownOnBackdrop = useRef(false);

  const handleSafeCloseModal = () => {
    if (isFormDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    setShowModal(false);
    setIsFormDirty(false);
  };

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSafeCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, isFormDirty]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerDownOnBackdrop.current || e.target !== e.currentTarget) {
      return;
    }
    pointerDownOnBackdrop.current = false;

    // Si el usuario está escribiendo o modificó el formulario:
    // NO disparar el diálogo de confirmación y NO cerrar el modal.
    if (isFormDirty) {
      setModalShake(true);
      setShowProtectedNotice(true);
      setTimeout(() => setModalShake(false), 350);
      setTimeout(() => setShowProtectedNotice(false), 2200);
      return;
    }

    setShowModal(false);
    setIsFormDirty(false);
  };

  const avatarLetters = userEmail ? userEmail.slice(0, 2).toUpperCase() : "FP";
  const [enteringEspacioId, setEnteringEspacioId] = useState<string | null>(null);

  function handleSelectEspacio(id: string, nombre: string, zona?: string, moneda?: string) {
    if (enteringEspacioId) return;
    setEnteringEspacioId(id);
    setEspacio(id, nombre, zona, moneda);
    router.push("/inicio");
  }



  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFieldErrors({});
    startTransition(async () => {
      const result = await crearEspacio(fd);
      if (result?.error) {
        setFieldErrors(result.error as Record<string, string[]>);
      } else {
        setIsFormDirty(false);
        setShowModal(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="h-screen max-h-screen w-full flex flex-col justify-between overflow-y-auto sm:overflow-hidden select-none relative bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Destellos ambientales suaves de fondo */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-[450px] w-96 h-96 bg-primary/10 dark:bg-primary/8 rounded-full blur-[110px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/6 rounded-full blur-[110px]" />
      </div>
      {/* ─── Cabecera de navegación superior compacta ───────────────────────── */}
      <header className="w-full h-14 shrink-0 border-b border-surface-container-high/60 bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-8">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          <Link href="/espacios" className="flex items-center gap-2 group focus:outline-none rounded-lg py-1 min-w-0">
            <FinPalLogo
              size={30}
              className="w-7.5 h-7.5 group-hover:scale-105 transition-transform shrink-0"
              colorAcento={effectiveAccent}
              priority
            />
            <div className="flex items-baseline tracking-tight font-heading text-lg sm:text-xl truncate">
              <span className="font-extrabold text-on-surface">Fin</span>
              <span className="font-extrabold text-primary">Pal</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <div className="flex items-center gap-2 pl-2 sm:pl-3 pr-2 py-1 rounded-full bg-surface-container-low border border-surface-container-high/70 hover:bg-surface-container transition-colors shrink-0">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold tracking-wider shrink-0 shadow-2xs">
                {avatarLetters}
              </div>
              <span className="text-xs font-semibold text-on-surface hidden sm:inline-block max-w-[120px] lg:max-w-none truncate">
                {userEmail}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-surface-container-high hidden sm:block" />
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
                className="p-1.5 sm:p-2 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-xl transition-colors flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
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
          </div>
        </div>
      </header>

      {/* ─── Main Content (Laptop/Desktop Centered View sin scroll vertical) ─── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3 sm:py-5 flex flex-col items-center justify-center overflow-hidden">
        {/* Centered Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="text-center max-w-xl mx-auto mb-3 sm:mb-5 px-2"
        >
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>Espacios de Trabajo</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface font-heading tracking-tight">
            Selecciona tu espacio de trabajo
          </h1>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-md mx-auto">
            Cada espacio mantiene préstamos, cobros, contactos y cuentas completamente aislados.
          </p>
        </motion.div>

        {/* Barra de progreso de carga al ingresar a un espacio */}
        {enteringEspacioId && (
          <div className="fixed top-0 left-0 right-0 h-[3px] z-50 overflow-hidden bg-primary/20">
            <div className="h-full bg-primary animate-pulse w-full shadow-[0_0_10px_var(--color-primary)]" />
          </div>
        )}

        {/* Centered Workspaces Container */}
        <div className="w-full flex flex-wrap items-stretch justify-center gap-3.5 sm:gap-5 max-w-5xl px-2">
          {espacios.map((espacio, i) => {
            const IconComponent = ICONS[i % ICONS.length];
            const prestamosCount = espacio.prestamos?.[0]?.count ?? 0;
            const contactosCount = espacio.contactos?.[0]?.count ?? 0;
            const isEntering = enteringEspacioId === espacio.id;

            return (
              <motion.div
                key={espacio.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.04, 0.2) }}
                onClick={() => handleSelectEspacio(espacio.id, espacio.nombre, espacio.zona_horaria, espacio.codigo_moneda)}
                className={`group bg-surface-container-lowest/90 dark:bg-surface-container-low/40 backdrop-blur-xs rounded-2xl border border-surface-container-high/70 hover:border-primary/60 shadow-2xs hover:shadow-lg dark:hover:shadow-primary/5 transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden w-full max-w-[320px] sm:w-[290px] lg:w-[310px] h-[175px] active:scale-[0.98] select-text ${
                  isEntering ? "ring-2 ring-primary ring-offset-2 scale-[0.98] opacity-90 shadow-md" : ""
                }`}
              >
                {/* Superior: Ícono Acorde a Acento + Etiqueta Moneda */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-white shadow-2xs group-hover:scale-105">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-surface-container/70 text-on-surface-variant border border-surface-container-high/60 shadow-2xs">
                      {espacio.codigo_moneda}
                    </span>
                  </div>

                  <h2 className="font-heading text-base font-bold text-on-surface group-hover:text-primary transition-colors tracking-tight line-clamp-1 mt-2.5">
                    {espacio.nombre}
                  </h2>

                  {/* Pastillas Tech Monospace estilo tarjeta moderna */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-surface-container/60 dark:bg-surface-container/40 border border-surface-container-high/50 text-on-surface-variant">
                      <HandCoins className="w-3 h-3 text-primary shrink-0" />
                      <span>{prestamosCount} préstamo{prestamosCount !== 1 ? "s" : ""}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-surface-container/60 dark:bg-surface-container/40 border border-surface-container-high/50 text-on-surface-variant">
                      <Users className="w-3 h-3 text-on-surface-variant shrink-0" />
                      <span>{contactosCount} contacto{contactosCount !== 1 ? "s" : ""}</span>
                    </span>
                  </div>
                </div>

                {/* Pie de tarjeta y acción */}
                <div className="pt-2.5 border-t border-surface-container-high/40 flex items-center justify-between text-[11px] mt-auto">
                  <span className="font-mono text-outline truncate max-w-[170px]">
                    {espacio.created_at ? `Desde ${formatDateEs(espacio.created_at)}` : "Espacio activo"}
                  </span>
                  <div className="flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
                    {isEntering ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        <span>Ingresando...</span>
                      </>
                    ) : (
                      <>
                        <span>Acceder</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* "+ Crear nuevo espacio" Card */}
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: Math.min(espacios.length * 0.04, 0.25) }}
            onClick={() => setShowModal(true)}
            className="group bg-surface-container-lowest/40 hover:bg-primary/5 rounded-2xl border-2 border-dashed border-surface-container-high/80 hover:border-primary/60 transition-all duration-200 p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer h-[175px] w-full max-w-[320px] sm:w-[290px] lg:w-[310px] shadow-2xs hover:shadow-md"
          >
            <div className="w-9 h-9 rounded-xl bg-surface-container text-on-surface-variant group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all duration-200 mb-2 shadow-2xs group-hover:scale-105">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-heading text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
              Crear nuevo espacio
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-1 max-w-[210px] leading-snug line-clamp-2">
              Separa otra cartera de préstamos o finanzas independientes.
            </p>
          </motion.button>
        </div>

        {/* Helpful Info Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.15 }}
          className="mt-3.5 flex justify-center px-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-container-low/50 border border-surface-container-high/50 text-[11px] text-outline shadow-2xs">
            <Info className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>
              Puedes alternar libremente entre tus espacios de trabajo desde el menú superior.
            </span>
          </div>
        </motion.div>
      </main>

      {/* ─── Modal Crear Espacio ───────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in select-none"
          onPointerDown={handlePointerDown}
          onClick={handleBackdropClick}
        >
          <div
            className={`bg-surface-container-lowest rounded-2xl border border-surface-container-high/80 shadow-2xl w-full max-w-md p-6 relative text-on-surface select-text ${
              modalShake ? "animate-modal-shake" : ""
            }`}
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
              onClick={handleSafeCloseModal}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading text-xl font-bold text-on-surface mb-1">
              Nuevo espacio
            </h2>
            <p className="text-xs text-on-surface-variant mb-5">
              Crea un espacio separado para tus préstamos personales, negocio o familia.
            </p>

            <form
              onSubmit={handleCreate}
              onChange={() => setIsFormDirty(true)}
              onInput={() => setIsFormDirty(true)}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Nombre del espacio *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Negocio, Préstamos personales, Familia..."
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.name[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">
                    Moneda
                  </label>
                  <select
                    name="currencyCode"
                    defaultValue="BOB"
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option className="bg-surface text-on-surface" value="BOB">BOB — Boliviano</option>
                    <option className="bg-surface text-on-surface" value="USD">USD — Dólar</option>
                    <option className="bg-surface text-on-surface" value="PEN">PEN — Sol</option>
                    <option className="bg-surface text-on-surface" value="COP">COP — Peso COP</option>
                    <option className="bg-surface text-on-surface" value="MXN">MXN — Peso MXN</option>
                    <option className="bg-surface text-on-surface" value="ARS">ARS — Peso ARS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">
                    Zona horaria
                  </label>
                  <select
                    name="timezone"
                    defaultValue="America/La_Paz"
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option className="bg-surface text-on-surface" value="America/La_Paz">La Paz (BOT)</option>
                    <option className="bg-surface text-on-surface" value="America/Lima">Lima (PET)</option>
                    <option className="bg-surface text-on-surface" value="America/Bogota">Bogotá (COT)</option>
                    <option className="bg-surface text-on-surface" value="America/Mexico_City">México (CST)</option>
                    <option className="bg-surface text-on-surface" value="America/Buenos_Aires">Buenos Aires (ART)</option>
                    <option className="bg-surface text-on-surface" value="America/New_York">Nueva York (ET)</option>
                  </select>
                </div>
              </div>

              {fieldErrors._global && (
                <p className="text-xs text-error">{fieldErrors._global[0]}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleSafeCloseModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-white hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Crear Espacio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo nativo del sistema para confirmar descarte */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="¿Descartar nuevo espacio?"
        description="Tienes información ingresada en el formulario. Si sales ahora, los datos no se guardarán."
        confirmText="Descartar espacio"
        cancelText="Continuar editando"
        variant="danger"
        onConfirm={() => {
          setShowDiscardConfirm(false);
          setIsFormDirty(false);
          setShowModal(false);
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      {/* ─── Pie de página compacto (sin desbordamiento) ─────────────────── */}
      <footer className="w-full h-9 shrink-0 px-4 sm:px-6 border-t border-surface-container-high/40 bg-surface-container-lowest/80 flex items-center justify-between text-[11px] text-outline">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>FinPal Ledger Cloud — Multi-espacio empresarial</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span>Privacidad & Seguridad Garantizada</span>
          </div>
        </div>
      </footer>
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
    </div>
  );
}
