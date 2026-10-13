"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Building2,
  ChevronRight,
  CircleDollarSign,
  HandCoins,
  Info,
  LogOut,
  Plus,
  ReceiptText,
  WalletCards,
  X,
  Loader2,
} from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { crearEspacio } from "./actions";
import { signOut } from "@/app/(auth)/actions";
import { useEspacio } from "@/lib/espacio-context";

type EspacioRow = {
  id: string;
  nombre: string;
  codigo_moneda: string;
  created_at: string;
  contactos: { count: number }[];
  prestamos: { count: number }[];
};

const ICONS = [WalletCards, HandCoins, Building2, ReceiptText];
const ICON_COLORS = [
  "bg-emerald-100/70 border-emerald-200/60 text-primary group-hover:bg-primary group-hover:text-white",
  "bg-amber-100/70 border-amber-200/60 text-amber-700 group-hover:bg-amber-600 group-hover:text-white",
  "bg-blue-100/70 border-blue-200/60 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
  "bg-violet-100/70 border-violet-200/60 text-violet-700 group-hover:bg-violet-600 group-hover:text-white",
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

  const avatarLetters = userEmail.slice(0, 2).toUpperCase();

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
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Header */}
      <header className="w-full border-b border-surface-container-high/60 bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-30 px-6 lg:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/espacios" className="flex items-center gap-2.5 group focus:outline-none rounded-lg py-1">
            <FinPalLogo size={32} className="w-8 h-8 rounded-lg shadow-xs group-hover:scale-105 transition-transform" priority />
            <div className="flex items-baseline tracking-tight font-heading text-lg">
              <span className="font-extrabold text-on-surface">Fin</span>
              <span className="font-extrabold text-primary">Pal</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 pl-3 pr-2 py-1 rounded-full bg-surface-container-low border border-surface-container-high/70 hover:bg-surface-container transition-colors">
              <div className="w-6 h-6 rounded-full bg-on-surface text-surface-container-lowest flex items-center justify-center text-[10px] font-bold tracking-wider">
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
                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-colors flex items-center justify-center"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-[500px] flex flex-col gap-6">
          <div className="text-center sm:text-left flex flex-col gap-1.5 px-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface font-heading tracking-tight">
              Elige un espacio de trabajo
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Cada espacio mantiene préstamos, cuentas y registros completamente aislados.
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-3.5 sm:p-4 flex flex-col gap-2.5">
            {espacios.length === 0 && (
              <p className="text-center text-xs text-on-surface-variant py-4">
                Aún no tienes espacios. Crea uno para empezar.
              </p>
            )}

            {espacios.map((espacio, i) => {
              const IconComponent = ICONS[i % ICONS.length];
              const prestamosCount = espacio.prestamos?.[0]?.count ?? 0;
              const contactosCount = espacio.contactos?.[0]?.count ?? 0;
              return (
                <button
                  key={espacio.id}
                  type="button"
                  onClick={() => handleSelectEspacio(espacio.id, espacio.nombre)}
                  className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-transparent bg-surface-container-low/50 hover:bg-secondary-container/20 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-150 cursor-pointer text-left w-full"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl border ${ICON_COLORS[i % ICON_COLORS.length]} flex items-center justify-center shrink-0 transition-all duration-200 shadow-2xs`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                          {espacio.nombre}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-100 text-emerald-800 border-emerald-200/60">
                          {prestamosCount} préstamo{prestamosCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant group-hover:text-on-surface truncate mt-0.5">
                        {contactosCount} contacto{contactosCount !== 1 ? "s" : ""} · {espacio.codigo_moneda}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              );
            })}

            <div className="my-1 border-t border-surface-container-low" />

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="group w-full flex items-center justify-between p-3.5 rounded-xl border border-dashed border-surface-container-high/80 hover:border-primary/50 hover:bg-secondary-container/20 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-150 text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-surface-container-low group-hover:bg-secondary-container/50 text-on-surface-variant group-hover:text-primary flex items-center justify-center shrink-0 transition-colors">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    Crear nuevo espacio
                  </span>
                  <p className="text-xs text-on-surface-variant truncate">
                    Organiza un nuevo proyecto o cartera independiente
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant px-2 py-1">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span>Consejo: Puedes alternar entre espacios en cualquier momento desde el menú lateral.</span>
          </div>
        </div>
      </main>

      {/* Modal Crear Espacio */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-xs p-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/80 shadow-2xl w-full max-w-md p-6 relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-heading text-xl font-bold text-on-surface mb-1">Nuevo espacio de trabajo</h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Crea un espacio independiente para separar préstamos, cuentas y deudores.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Nombre del espacio</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ej. Empresa, Familia, Proyecto X"
                  className="w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-error">{fieldErrors.name[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Moneda</label>
                  <select
                    name="currencyCode"
                    defaultValue="BOB"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="BOB">BOB — Boliviano</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="PEN">PEN — Sol</option>
                    <option value="COP">COP — Peso COP</option>
                    <option value="MXN">MXN — Peso MXN</option>
                    <option value="ARS">ARS — Peso ARS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Zona horaria</label>
                  <select
                    name="timezone"
                    defaultValue="America/La_Paz"
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="America/La_Paz">La Paz (BOT)</option>
                    <option value="America/Lima">Lima (PET)</option>
                    <option value="America/Bogota">Bogotá (COT)</option>
                    <option value="America/Mexico_City">México (CST)</option>
                    <option value="America/Buenos_Aires">Buenos Aires (ART)</option>
                    <option value="America/New_York">Nueva York (ET)</option>
                  </select>
                </div>
              </div>

              {fieldErrors._global && (
                <p className="text-xs text-error">{fieldErrors._global[0]}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-xs flex items-center gap-2 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Crear Espacio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full py-4 px-6 text-center text-xs border-t border-surface-container-high/40 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            <span>FinPal Ledger Cloud — Todos los sistemas operativos</span>
          </div>
          <div className="flex items-center gap-4">
            <a className="hover:text-on-surface transition-colors" href="#">Centro de ayuda</a>
            <a className="hover:text-on-surface transition-colors" href="#">Seguridad de datos</a>
            <a className="hover:text-on-surface transition-colors" href="#">Privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
