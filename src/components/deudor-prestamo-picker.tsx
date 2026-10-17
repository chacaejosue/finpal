"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  HandCoins,
  Check,
  Calendar,
  Phone,
  Mail,
  FileText,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  X,
  User,
} from "lucide-react";
import { ContactAvatar } from "@/components/contact-avatar";
import { money, loanBalance, rel, type Prestamo } from "@/lib/dashboard-context";
import { formatDateEs } from "@/lib/format-date";

interface DeudorPrestamoPickerProps {
  prestamos: Prestamo[];
  selectedId: string;
  onSelect: (prestamo: Prestamo) => void;
}

type FilterStatus = "todos" | "atrasados" | "al_dia";

/**
 * Selector inteligente de deudores y préstamos para el registro de cobros.
 * 
 * Resuelve problemas de usabilidad críticos en carteras de crédito:
 * 1. Desambiguación: Si existen múltiples préstamos a la misma persona (ej. dos préstamos a "Madre"),
 *    muestra el alias/concepto, saldo restante y fecha de vencimiento para identificar cuál cobrar.
 * 2. Filtrado de saldados: Excluye automáticamente préstamos ya pagados o cancelados con saldo <= 0.01.
 * 3. Búsqueda instantánea y filtros rápidos: Permite filtrar por atrasados, al día o buscar por nombre/alias.
 */
export function DeudorPrestamoPicker({
  prestamos,
  selectedId,
  onSelect,
}: DeudorPrestamoPickerProps) {
  // 1. Filtrar solo préstamos que NO estén pagados ni cancelados y con saldo > 0.01
  const prestamosPendientes = useMemo(() => {
    return prestamos.filter(
      (p) => p.estado !== "pagado" && p.estado !== "cancelado" && loanBalance(p) > 0.01
    );
  }, [prestamos]);

  const selectedPrestamo = useMemo(() => {
    return prestamos.find((p) => p.id === selectedId) ?? null;
  }, [prestamos, selectedId]);

  // Si ya hay un préstamo seleccionado, mostramos la tarjeta compacta (con opción de cambiar)
  const [isSearching, setIsSearching] = useState<boolean>(!selectedId);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("todos");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Enfocar el input de búsqueda automáticamente al abrir el selector
  useEffect(() => {
    if (isSearching) {
      searchInputRef.current?.focus();
    }
  }, [isSearching]);

  // Filtrado reactivo en tiempo real con buscador multi-campo
  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();

    return prestamosPendientes.filter((p) => {
      const contacto = rel(p.contactos);
      const isAtrasado = p.estado === "atrasado";

      // Filtro de estado
      if (statusFilter === "atrasados" && !isAtrasado) return false;
      if (statusFilter === "al_dia" && isAtrasado) return false;

      // Filtro de texto (nombre, teléfono, email, notas del contacto, concepto del préstamo y notas)
      if (!q) return true;

      const nombreContacto = (contacto?.nombre ?? "").toLowerCase();
      const telefono = ((contacto as any)?.telefono ?? "").toLowerCase();
      const email = ((contacto as any)?.email ?? "").toLowerCase();
      const notasContacto = ((contacto as any)?.notas ?? "").toLowerCase();
      const nombrePrestamo = (p.nombre ?? "").toLowerCase();
      const notasPrestamo = (p.notas ?? "").toLowerCase();

      return (
        nombreContacto.includes(q) ||
        telefono.includes(q) ||
        email.includes(q) ||
        notasContacto.includes(q) ||
        nombrePrestamo.includes(q) ||
        notasPrestamo.includes(q)
      );
    });
  }, [prestamosPendientes, query, statusFilter]);

  const countAtrasados = useMemo(
    () => prestamosPendientes.filter((p) => p.estado === "atrasado").length,
    [prestamosPendientes]
  );
  const countAlDia = prestamosPendientes.length - countAtrasados;

  // Si no hay deudas pendientes en todo el espacio
  if (prestamosPendientes.length === 0) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4 text-center">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-on-surface">¡Cartera al día!</h4>
        <p className="text-[11px] text-on-surface-variant mt-0.5">
          No tienes deudores con saldo pendiente de pago en este momento.
        </p>
        <input type="hidden" name="prestamo_id" value="" />
      </div>
    );
  }

  // ─── Estado Seleccionado: Tarjeta Compacta de Alta Claridad ──────────────────
  if (selectedPrestamo && !isSearching) {
    const contacto = rel(selectedPrestamo.contactos);
    const balance = loanBalance(selectedPrestamo);
    const isAtrasado = selectedPrestamo.estado === "atrasado";
    const telefono = (contacto as any)?.telefono;
    const email = (contacto as any)?.email;
    const notasContacto = (contacto as any)?.notas;

    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-on-surface">
          Deudor y préstamo seleccionado *
        </label>
        <div className="bg-surface-container-low border border-primary/40 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <ContactAvatar
              name={contacto?.nombre ?? "Deudor"}
              size={40}
              className="rounded-xl shrink-0 shadow-2xs mt-0.5"
            />
            <div className="min-w-0">
              {/* Nombre del deudor y desambiguación */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-heading font-extrabold text-sm text-on-surface truncate">
                  {contacto?.nombre ?? "Sin contacto"}
                </span>
                {telefono && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-surface-container-high/60">
                    <Phone className="w-3 h-3 text-primary" />
                    {telefono}
                  </span>
                )}
                {email && !telefono && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant border border-surface-container-high/60">
                    <Mail className="w-3 h-3 text-primary" />
                    {email}
                  </span>
                )}
              </div>

              {/* Concepto del préstamo + día de pago */}
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                <span className="font-semibold text-on-surface">
                  {selectedPrestamo.nombre}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  · Día {selectedPrestamo.dia_pago} de cobro
                </span>
                {selectedPrestamo.fecha_inicio && (
                  <span className="text-[11px] text-on-surface-variant hidden sm:inline">
                    · Desde {formatDateEs(selectedPrestamo.fecha_inicio)}
                  </span>
                )}
              </div>

              {/* Notas de desambiguación si existen */}
              {notasContacto && (
                <p className="text-[11px] text-on-surface-variant/90 italic truncate mt-0.5">
                  &ldquo;{notasContacto}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Saldo pendiente y botón para cambiar */}
          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-container-high/60 shrink-0">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-wider">
                Saldo pendiente
              </span>
              <span className={`font-mono text-sm sm:text-base font-extrabold ${isAtrasado ? "text-error" : "text-primary"}`}>
                {money(balance)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsSearching(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-container-lowest text-primary text-xs font-bold border border-primary/30 hover:bg-primary/10 transition-colors cursor-pointer shadow-2xs"
              title="Cambiar deudor o préstamo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cambiar</span>
            </button>
          </div>
        </div>
        <input type="hidden" name="prestamo_id" value={selectedPrestamo.id} required />
      </div>
    );
  }

  // ─── Estado Buscador / Selector Desplegable Mejorado ────────────────────────
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-on-surface">
          Selecciona el deudor y préstamo a cobrar *
        </label>
        {selectedPrestamo && (
          <button
            type="button"
            onClick={() => setIsSearching(false)}
            className="text-[11px] text-on-surface-variant hover:text-on-surface flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3 h-3" /> Cancelar cambio
          </button>
        )}
      </div>

      {/* Buscador y Filtros Rápidos */}
      <div className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-3 shadow-sm space-y-2.5">
        {/* Input de Búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar por nombre, teléfono, apodo o concepto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs font-medium border border-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chips de filtro rápido */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter("todos")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === "todos"
                  ? "bg-surface-container-high text-on-surface font-bold shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Todos ({prestamosPendientes.length})
            </button>

            {countAtrasados > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("atrasados")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === "atrasados"
                    ? "badge-atrasado font-bold shadow-2xs"
                    : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                }`}
              >
                Atrasados ({countAtrasados})
              </button>
            )}

            <button
              type="button"
              onClick={() => setStatusFilter("al_dia")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === "al_dia"
                  ? "badge-al-dia font-bold shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Al día ({countAlDia})
            </button>
          </div>

          <span className="text-[10px] text-on-surface-variant">
            {filteredList.length} resultado{filteredList.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Lista de Deudores y Préstamos Desplegable */}
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-surface-container-low">
          {filteredList.length === 0 ? (
            <div className="py-6 text-center text-xs text-on-surface-variant">
              No se encontraron deudores coincidentes con tu búsqueda.
            </div>
          ) : (
            filteredList.map((p) => {
              const contacto = rel(p.contactos);
              const balance = loanBalance(p);
              const isSelected = p.id === selectedId;
              const isAtrasado = p.estado === "atrasado";
              const telefono = (contacto as any)?.telefono;
              const email = (contacto as any)?.email;
              const notasContacto = (contacto as any)?.notas;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelect(p);
                    setIsSearching(false);
                  }}
                  className={`pt-1.5 first:pt-0 group flex items-start justify-between gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-surface-container-low border border-transparent"
                  }`}
                >
                  {/* Avatar + Detalles del Contacto & Préstamo */}
                  <div className="flex items-start gap-2.5 min-w-0">
                    <ContactAvatar
                      name={contacto?.nombre ?? "Deudor"}
                      size={36}
                      className="rounded-xl shrink-0 shadow-2xs mt-0.5"
                    />

                    <div className="min-w-0">
                      {/* Línea 1: Nombre del contacto y teléfono para desambiguar */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate">
                          {contacto?.nombre ?? "Sin contacto"}
                        </span>

                        {telefono && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            <Phone className="w-2.5 h-2.5 text-primary" />
                            {telefono}
                          </span>
                        )}

                        {email && !telefono && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            <Mail className="w-2.5 h-2.5 text-primary" />
                            {email}
                          </span>
                        )}
                      </div>

                      {/* Línea 2: Concepto del préstamo y detalles clave */}
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                        <span className="font-semibold text-on-surface-variant group-hover:text-on-surface">
                          {p.nombre}
                        </span>
                        <span className="text-on-surface-variant/80">
                          · Cobro día {p.dia_pago}
                        </span>
                        {p.fecha_inicio && (
                          <span className="text-on-surface-variant/70 hidden sm:inline">
                            · Inicio {formatDateEs(p.fecha_inicio)}
                          </span>
                        )}
                      </div>

                      {/* Línea 3: Notas o apodo de contacto (crucial para diferenciar homónimos) */}
                      {notasContacto && (
                        <p className="text-[10px] text-on-surface-variant/80 italic truncate mt-0.5 max-w-xs">
                          {notasContacto}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Saldo y Estado */}
                  <div className="text-right shrink-0">
                    <span className={`font-mono text-xs font-bold block ${isAtrasado ? "text-error" : "text-on-surface"}`}>
                      {money(balance)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant block">
                      de {money(Number(p.monto_principal))}
                    </span>
                    {isAtrasado ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold badge-atrasado mt-0.5">
                        <AlertOctagon className="w-2.5 h-2.5 shrink-0" /> Atrasado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold badge-al-dia mt-0.5">
                        Al día
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <input type="hidden" name="prestamo_id" value={selectedId} required />
    </div>
  );
}
