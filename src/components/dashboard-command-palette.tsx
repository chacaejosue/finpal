"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftRight,
  FileBarChart2,
  HandCoins,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Search,
  Settings,
  User,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { rel, type Contacto, type ModalPresetOptions, type ModalType, type Prestamo } from "@/lib/dashboard-context";

interface DashboardCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  contactos: Contacto[];
  prestamos: Prestamo[];
  openModal: (modal: ModalType, preset?: ModalPresetOptions) => void;
  onNavigate?: (path: string) => void;
}

const navRoutes = [
  { label: "Inicio", path: "/inicio", icon: LayoutDashboard, keywords: "resumen dashboard" },
  { label: "Contactos / Deudores", path: "/contactos", icon: UsersRound, keywords: "personas clientes" },
  { label: "Préstamos", path: "/prestamos", icon: HandCoins, keywords: "cartera creditos" },
  { label: "Cobros", path: "/pagos", icon: ReceiptText, keywords: "recibos pagos" },
  { label: "Cuentas", path: "/cuentas", icon: WalletCards, keywords: "billeteras bancos efectivo" },
  { label: "Movimientos", path: "/movimientos", icon: ArrowLeftRight, keywords: "ingresos gastos" },
  { label: "Reportes", path: "/reportes", icon: FileBarChart2, keywords: "exportar pdf excel" },
  { label: "Configuración", path: "/configuracion", icon: Settings, keywords: "preferencias tema" },
];

export function DashboardCommandPalette({
  open,
  onClose,
  onOpen,
  contactos,
  prestamos,
  openModal,
  onNavigate,
}: DashboardCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo global Ctrl+K / Cmd+K y Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          onClose();
        } else {
          setQuery("");
          onOpen();
        }
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, onOpen]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  const q = query.trim().toLowerCase();

  const quickActions = useMemo(() => {
    const actions: Array<{
      id: string;
      label: string;
      hint: string;
      modal: ModalType;
    }> = [
      { id: "act-loan", label: "Registrar nuevo préstamo", hint: "Acción rápida", modal: "loan" },
      { id: "act-payment", label: "Registrar cobro", hint: "Acción rápida", modal: "payment" },
      { id: "act-movement", label: "Registrar movimiento", hint: "Ingreso / Gasto", modal: "movement" },
      { id: "act-contact", label: "Agregar contacto", hint: "Nuevo deudor", modal: "contact" },
      { id: "act-account", label: "Crear cuenta de dinero", hint: "Efectivo / Banco", modal: "account" },
    ];
    if (!q) return actions;
    return actions.filter(
      (a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q),
    );
  }, [q]);

  const matchedRoutes = useMemo(() => {
    if (!q) return navRoutes.slice(0, 4);
    return navRoutes.filter(
      (r) => r.label.toLowerCase().includes(q) || r.keywords.toLowerCase().includes(q),
    );
  }, [q]);

  const matchedContacts = useMemo(() => {
    if (!q) return [];
    return contactos
      .filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          (c.telefono ?? "").toLowerCase().includes(q),
      )
      .slice(0, 4);
  }, [contactos, q]);

  const matchedLoans = useMemo(() => {
    if (!q) return [];
    return prestamos
      .filter((p) => {
        const contactoNombre = rel(p.contactos)?.nombre ?? "";
        return (
          p.nombre.toLowerCase().includes(q) ||
          contactoNombre.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);
  }, [prestamos, q]);

  const goTo = (path: string) => {
    onClose();
    onNavigate?.(path);
    router.push(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/55 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscador rápido"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-surface-container-high/80 shadow-2xl overflow-hidden text-on-surface"
          >
            {/* Input de búsqueda */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-surface-container-low">
              <Search className="w-4 h-4 text-primary shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar contacto, préstamo, sección o acción..."
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                aria-label="Cerrar buscador"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Resultados */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
              {quickActions.length > 0 && (
                <div>
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Acciones rápidas
                  </p>
                  <div className="space-y-0.5">
                    {quickActions.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          openModal(act.modal);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium hover:bg-surface-container-low transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 text-on-surface font-semibold">
                          <Plus className="w-3.5 h-3.5 text-primary shrink-0" />
                          {act.label}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">{act.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedContacts.length > 0 && (
                <div>
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Contactos
                  </p>
                  <div className="space-y-0.5">
                    {matchedContacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          openModal("loan", { contactId: c.id });
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs hover:bg-surface-container-low transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 font-semibold text-on-surface truncate">
                          <User className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">{c.nombre}</span>
                        </span>
                        <span className="text-[11px] text-primary font-semibold shrink-0">
                          Nuevo préstamo
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedLoans.length > 0 && (
                <div>
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Préstamos
                  </p>
                  <div className="space-y-0.5">
                    {matchedLoans.map((p) => {
                      const contactoNombre = rel(p.contactos)?.nombre ?? "—";
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onClose();
                            openModal("payment", { loanId: p.id });
                          }}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-xs hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2 font-semibold text-on-surface truncate">
                            <HandCoins className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">
                              {contactoNombre} · {p.nombre}
                            </span>
                          </span>
                          <span className="text-[11px] text-primary font-semibold shrink-0">
                            Cobrar
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedRoutes.length > 0 && (
                <div>
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Ir a sección
                  </p>
                  <div className="space-y-0.5">
                    {matchedRoutes.map((r) => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.path}
                          type="button"
                          onClick={() => goTo(r.path)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-medium text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                        >
                          <Icon className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                          <span>{r.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {quickActions.length === 0 &&
                matchedContacts.length === 0 &&
                matchedLoans.length === 0 &&
                matchedRoutes.length === 0 && (
                  <p className="text-xs text-on-surface-variant text-center py-6">
                    No se encontraron resultados para &ldquo;{query}&rdquo;.
                  </p>
                )}
            </div>

            <div className="px-4 py-2 border-t border-surface-container-low bg-surface-container-low/40 flex items-center justify-between text-[11px] text-on-surface-variant">
              <span>Atajo: Ctrl + K / ⌘K</span>
              <span>Esc para cerrar</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
