"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
} from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { crearEspacio } from "./actions";
import { signOut } from "@/app/(auth)/actions";
import { useEspacio } from "@/lib/espacio-context";
import { useDashboard } from "@/lib/dashboard-context";
import { formatDateEs } from "@/lib/format-date";
import { clearSessionAccent } from "@/lib/theme-utils";
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
const ICON_STYLES = [
  {
    bg: "kpi-icon-emerald",
    hover: "group-hover:bg-emerald-600 group-hover:text-white",
  },
  {
    bg: "kpi-icon-blue",
    hover: "group-hover:bg-blue-600 group-hover:text-white",
  },
  {
    bg: "kpi-icon-amber",
    hover: "group-hover:bg-amber-600 group-hover:text-white",
  },
  {
    bg: "kpi-icon-violet",
    hover: "group-hover:bg-violet-600 group-hover:text-white",
  },
];

export default function EspaciosClient({
  espacios,
  userEmail,
}: {
  espacios: EspacioRow[];
  userEmail: string;
}) {
  const router = useRouter();
  const { setEspacio } = useEspacio();
  const { preferencias } = useDashboard();
  const [showModal, setShowModal] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSafeCloseModal = () => {
    if (isFormDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    setShowModal(false);
    setIsFormDirty(false);
  };

  const avatarLetters = userEmail ? userEmail.slice(0, 2).toUpperCase() : "FP";
  const [enteringEspacioId, setEnteringEspacioId] = useState<string | null>(null);

  function handleSelectEspacio(id: string, nombre: string, zona?: string) {
    if (enteringEspacioId) return;
    setEnteringEspacioId(id);
    setEspacio(id, nombre, zona);
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* ─── Cabecera de navegación superior ────────────────────────────────── */}
      <header className="w-full border-b border-surface-container-high/60 bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-8 py-3.5 max-w-full overflow-hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/espacios" className="flex items-center gap-2 group focus:outline-none rounded-lg py-1 min-w-0">
            <FinPalLogo
              size={32}
              className="w-8 h-8 group-hover:scale-105 transition-transform shrink-0"
              colorAcento={preferencias?.colorAcento}
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
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold tracking-wider shrink-0">
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
                className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-xl transition-colors flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-75 disabled:cursor-not-allowed"
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

      {/* ─── Main Content (Spacious Laptop/Desktop Centered View) ───────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center justify-center overflow-x-hidden">
        {/* Centered Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="text-center max-w-2xl mx-auto mb-8 sm:mb-10 px-2"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Espacios de Trabajo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface font-heading tracking-tight">
            Selecciona tu espacio de trabajo
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
            Cada espacio mantiene préstamos, cobros, deudores y cuentas financieras completamente aislados y seguros.
          </p>
        </motion.div>

        {/* Barra de progreso de carga al ingresar a un espacio */}
        {enteringEspacioId && (
          <div className="fixed top-0 left-0 right-0 h-[3px] z-50 overflow-hidden bg-primary/20">
            <div className="h-full bg-primary animate-pulse w-full shadow-[0_0_10px_var(--color-primary)]" />
          </div>
        )}

        {/* Centered Workspaces Container */}
        <div className="w-full max-w-full flex flex-wrap items-stretch justify-center gap-4 sm:gap-6">
          {espacios.map((espacio, i) => {
            const IconComponent = ICONS[i % ICONS.length];
            const style = ICON_STYLES[i % ICON_STYLES.length];
            const prestamosCount = espacio.prestamos?.[0]?.count ?? 0;
            const contactosCount = espacio.contactos?.[0]?.count ?? 0;
            const isEntering = enteringEspacioId === espacio.id;

            return (
              <motion.div
                key={espacio.id}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, delay: Math.min(i * 0.05, 0.3) }}
                onClick={() => handleSelectEspacio(espacio.id, espacio.nombre, espacio.zona_horaria)}
                className={`group bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 hover:border-primary/50 shadow-2xs hover:shadow-md transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden w-full max-w-[340px] sm:w-[320px] lg:w-[340px] active:scale-[0.98] ${
                  isEntering ? "ring-2 ring-primary ring-offset-2 scale-[0.98] opacity-90 shadow-md" : ""
                }`}
              >
                {/* Superior: Ícono + Etiqueta de Moneda */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${style.bg} ${style.hover}`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface-variant border border-surface-container-high/60">
                      {espacio.codigo_moneda}
                    </span>
                  </div>

                  <h2 className="font-heading text-lg sm:text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors tracking-tight">
                    {espacio.nombre}
                  </h2>

                  {/* Pastillas de Métricas */}
                  <div className="flex flex-wrap items-center gap-2 mt-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold badge-emerald">
                      <HandCoins className="w-3.5 h-3.5" />
                      <span>{prestamosCount} préstamo{prestamosCount !== 1 ? "s" : ""}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container text-on-surface-variant border border-surface-container-high/60">
                      <Users className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span>{contactosCount} contacto{contactosCount !== 1 ? "s" : ""}</span>
                    </span>
                  </div>
                </div>

                {/* Pie de tarjeta y acción */}
                <div className="pt-5 mt-5 border-t border-surface-container-low flex items-center justify-between text-xs">
                  <span className="text-[11px] text-on-surface-variant">
                    {espacio.created_at ? `Desde ${formatDateEs(espacio.created_at)}` : "Espacio activo"}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-primary group-hover:translate-x-1 transition-transform">
                    {isEntering ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Ingresando...</span>
                      </>
                    ) : (
                      <>
                        <span>Ingresar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: Math.min(espacios.length * 0.05, 0.35) }}
            onClick={() => setShowModal(true)}
            className="group bg-surface-container-lowest/60 hover:bg-primary/5 rounded-2xl border-2 border-dashed border-surface-container-high/80 hover:border-primary/50 transition-all duration-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] w-full max-w-[340px] sm:w-[320px] lg:w-[340px]"
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container text-on-surface-variant group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors mb-3.5 shadow-2xs">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-base font-bold text-on-surface group-hover:text-primary transition-colors">
              Crear nuevo espacio
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
              Separa una nueva cartera de préstamos, proyectos personales o negocios independientes.
            </p>
          </motion.button>
        </div>

        {/* Helpful Info Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mt-8 sm:mt-10 flex justify-center px-4"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60 text-xs text-on-surface-variant max-w-lg shadow-2xs">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span className="leading-relaxed text-left">
              Puedes alternar libremente entre tus espacios de trabajo en cualquier momento desde el menú superior o lateral.
            </span>
          </div>
        </motion.div>
      </main>

      {/* ─── Modal Crear Espacio ───────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
          onClick={handleSafeCloseModal}
        >
          <div
            className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/80 shadow-2xl w-full max-w-md p-6 relative text-on-surface"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleSafeCloseModal}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading text-xl font-bold text-on-surface mb-1">
              Nuevo espacio de trabajo
            </h2>
            <p className="text-xs text-on-surface-variant mb-5">
              Crea un espacio independiente para separar préstamos, cuentas y deudores.
            </p>

            <form
              onSubmit={handleCreate}
              onChange={() => setIsFormDirty(true)}
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
                  placeholder="Ej. Empresa, Familia, Cartera Cochabamba"
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

      {/* ─── Pie de página ─────────────────────────────────────────────────── */}
      <footer className="w-full py-4 px-6 text-center text-xs border-t border-surface-container-high/40 bg-surface-container-lowest mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            <span>FinPal Ledger Cloud — Multi-espacio empresarial</span>
          </div>
          <div className="flex items-center gap-4">
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
