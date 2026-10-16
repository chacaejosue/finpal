"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  HandCoins,
  Info,
  LogOut,
  Plus,
  ReceiptText,
  WalletCards,
  X,
  Loader2,
  Users,
  Calendar,
  Sparkles,
} from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { crearEspacio } from "./actions";
import { signOut } from "@/app/(auth)/actions";
import { useEspacio } from "@/lib/espacio-context";
import { formatDateEs } from "@/lib/format-date";

type EspacioRow = {
  id: string;
  nombre: string;
  codigo_moneda: string;
  created_at: string;
  contactos: { count: number }[];
  prestamos: { count: number }[];
};

const ICONS = [WalletCards, HandCoins, Building2, ReceiptText];
const ICON_STYLES = [
  {
    bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
    hover: "group-hover:bg-emerald-600 group-hover:text-white",
  },
  {
    bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20",
    hover: "group-hover:bg-blue-600 group-hover:text-white",
  },
  {
    bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
    hover: "group-hover:bg-amber-600 group-hover:text-white",
  },
  {
    bg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20",
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
  const [showModal, setShowModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const avatarLetters = userEmail ? userEmail.slice(0, 2).toUpperCase() : "FP";

  function handleSelectEspacio(id: string, nombre: string) {
    setEspacio(id, nombre);
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
        setShowModal(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* ─── Cabecera de navegación superior ────────────────────────────────── */}
      <header className="w-full border-b border-surface-container-high/60 bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/espacios" className="flex items-center gap-2.5 group focus:outline-none rounded-lg py-1">
            <FinPalLogo size={36} className="w-9 h-9 group-hover:scale-105 transition-transform" priority />
            <div className="flex items-baseline tracking-tight font-heading text-xl">
              <span className="font-extrabold text-on-surface">Fin</span>
              <span className="font-extrabold text-primary">Pal</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-3 pr-2 py-1 rounded-full bg-surface-container-low border border-surface-container-high/70 hover:bg-surface-container transition-colors">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold tracking-wider">
                {avatarLetters}
              </div>
              <span className="text-xs font-semibold text-on-surface hidden sm:inline-block">
                {userEmail}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-surface-container-high hidden sm:block" />
            <form action={signOut}>
              <button
                type="submit"
                className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ─── Main Content (Spacious Laptop/Desktop Centered View) ───────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center justify-center">
        {/* Centered Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
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
        </div>

        {/* Centered Workspaces Container */}
        <div className="w-full flex flex-wrap items-stretch justify-center gap-5 sm:gap-6">
          {espacios.map((espacio, i) => {
            const IconComponent = ICONS[i % ICONS.length];
            const style = ICON_STYLES[i % ICON_STYLES.length];
            const prestamosCount = espacio.prestamos?.[0]?.count ?? 0;
            const contactosCount = espacio.contactos?.[0]?.count ?? 0;

            return (
              <div
                key={espacio.id}
                onClick={() => handleSelectEspacio(espacio.id, espacio.nombre)}
                className="group bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 hover:border-primary/50 shadow-2xs hover:shadow-md transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden w-full sm:w-[320px] lg:w-[340px] shrink-0"
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
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
                  <div className="flex items-center gap-1 font-bold text-primary group-hover:translate-x-1 transition-transform">
                    <span>Ingresar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* "+ Crear nuevo espacio" Card */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="group bg-surface-container-lowest/60 hover:bg-primary/5 rounded-2xl border-2 border-dashed border-surface-container-high/80 hover:border-primary/50 transition-all duration-200 p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] w-full sm:w-[320px] lg:w-[340px] shrink-0"
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
          </button>
        </div>

        {/* Helpful Info Tip */}
        <div className="mt-8 sm:mt-10 flex justify-center px-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60 text-xs text-on-surface-variant max-w-lg shadow-2xs">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span className="leading-relaxed text-left">
              Puedes alternar libremente entre tus espacios de trabajo en cualquier momento desde el menú superior o lateral.
            </span>
          </div>
        </div>
      </main>

      {/* ─── Modal Crear Espacio ───────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/80 shadow-2xl w-full max-w-md p-6 relative text-on-surface">
            <button
              type="button"
              onClick={() => setShowModal(false)}
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

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">
                  Nombre del espacio *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Empresa, Familia, Cartera Cochabamba"
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
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
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary cursor-pointer"
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
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}
