"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  BadgeCheck,
  HandCoins,
  Loader2,
  Percent,
  Plus,
  ReceiptText,
  WalletCards,
  AlertCircle,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Scale,
  ArrowLeftRight,
  Palette,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import {
  useDashboard,
  money,
  loanBalance,
  monthlyInterest,
  rel,
  type Contacto,
  type Cuenta,
  type Prestamo,
  type Pago,
  type Movimiento,
} from "@/lib/dashboard-context";
import { fixSpanishEncoding } from "@/lib/clean-text";
import { ContactAvatar } from "@/components/contact-avatar";
import { useEspacio } from "@/lib/espacio-context";
import { actualizarEstadoPrestamo } from "@/app/(dashboard)/prestamos/actions";
import { formatDateEs } from "@/lib/format-date";
import { ReportesBiDashboard } from "@/features/reportes/reportes-bi-dashboard";

export type PageName =
  | "inicio"
  | "contactos"
  | "prestamos"
  | "pagos"
  | "cuentas"
  | "movimientos"
  | "reportes"
  | "configuracion";

// ─── Componente Conmutador de Vistas Principales ─────────────────────────────

export default function DashboardClient({
  page = "inicio",
}: {
  page?: PageName;
  userEmail?: string;
}) {
  const {
    cuentas,
    prestamos,
    contactos,
    movimientos,
    pagos,
    totals,
    loading,
    error,
    openModal,
    loadData,
    preferencias,
    guardarPreferencias,
    setSuccessNotice,
  } = useDashboard();
  const { espacioId } = useEspacio();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs font-semibold text-on-surface-variant">Cargando tus datos financieros...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-error-container text-on-error-container border border-error/20">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      key={page}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="max-w-7xl mx-auto w-full flex flex-col gap-6"
    >
      {page === "inicio" && (
        <DashboardView
          cuentas={cuentas}
          prestamos={prestamos}
          movimientos={movimientos}
          totals={totals}
          openModal={(m) => openModal(m)}
        />
      )}
      {page === "contactos" && (
        <ContactosView
          contactos={contactos}
          prestamos={prestamos}
          openModal={() => openModal("contact")}
        />
      )}
      {page === "prestamos" && (
        <PrestamosView
          prestamos={prestamos}
          openModal={() => openModal("loan")}
          onStatusChange={async (prestamoId, estado) => {
            if (!espacioId) return;
            const result = await actualizarEstadoPrestamo(prestamoId, espacioId, estado);
            if (result.error) {
              setSuccessNotice(result.error);
              return;
            }
            await loadData();
          }}
        />
      )}
      {page === "pagos" && (
        <PagosView
          pagos={pagos}
          openModal={() => openModal("payment")}
        />
      )}
      {page === "cuentas" && (
        <CuentasView
          cuentas={cuentas}
          openModal={() => openModal("account")}
        />
      )}
      {page === "movimientos" && (
        <MovimientosView
          movimientos={movimientos}
          openModal={() => openModal("movement")}
        />
      )}
      {page === "reportes" && (
        <ReportesBiDashboard
          totals={totals}
          prestamos={prestamos}
          pagos={pagos}
          cuentas={cuentas}
          movimientos={movimientos}
          contactos={contactos}
          preferencias={preferencias}
        />
      )}
      {page === "configuracion" && (
        <ConfiguracionView preferencias={preferencias} guardarPreferencias={guardarPreferencias} />
      )}
    </motion.div>
  );
}

// ─── Configuración de Globos/Badges para Tipos de Movimiento ─────────────────

interface TipoMovimientoBadge {
  label: string;
  badgeClass: string;
  Icon: React.ComponentType<{ className?: string }>;
}

function getTipoMovimientoBadge(tipo: string, ajusteSentido?: string | null): TipoMovimientoBadge {
  switch (tipo) {
    case "ingreso":
      return {
        label: "Ingreso",
        badgeClass: "badge-ingreso",
        Icon: ArrowDownLeft,
      };
    case "gasto":
      return {
        label: "Gasto",
        badgeClass: "badge-gasto",
        Icon: ArrowUpRight,
      };
    case "entrega_prestamo":
      return {
        label: "Préstamo entregado",
        badgeClass: "badge-entrega",
        Icon: HandCoins,
      };
    case "pago_prestamo":
      return {
        label: "Cobro de préstamo",
        badgeClass: "badge-cobro",
        Icon: CheckCircle2,
      };
    case "transferencia_entrada":
      return {
        label: "Transferencia ↓",
        badgeClass: "badge-entrada",
        Icon: ArrowDownLeft,
      };
    case "transferencia_salida":
      return {
        label: "Transferencia ↑",
        badgeClass: "badge-salida",
        Icon: ArrowUpRight,
      };
    case "ajuste":
      return {
        label: ajusteSentido ? `Ajuste (${ajusteSentido})` : "Ajuste",
        badgeClass: "badge-ajuste",
        Icon: Scale,
      };
    default:
      return {
        label: tipo.charAt(0).toUpperCase() + tipo.slice(1).replace("_", " "),
        badgeClass: "badge-neutral",
        Icon: ArrowLeftRight,
      };
  }
}

// ─── Componentes de Vistas por Página ─────────────────────────────────────────

function DashboardView({
  cuentas, prestamos, movimientos, totals, openModal,
}: {
  cuentas: Cuenta[];
  prestamos: Prestamo[];
  movimientos: Movimiento[];
  totals: ReturnType<typeof Object.assign>;
  openModal: (m: "loan" | "payment") => void;
}) {
  const upcoming = prestamos.filter((p) => p.estado !== "pagado").slice(0, 5);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-1">
            <span className="inline-flex items-center gap-1.5 text-primary bg-secondary-container/40 px-2.5 py-0.5 rounded-full border border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Panel de control financiero
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">Panel de control</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Resumen consolidado de tus finanzas y cartera de préstamos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold text-xs transition-all shadow-2xs cursor-pointer"
            type="button"
            onClick={() => openModal("payment")}
          >
            <ReceiptText className="w-4 h-4 text-primary" />
            <span>Registrar cobro</span>
          </button>
          <button
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-xs cursor-pointer"
            type="button"
            onClick={() => openModal("loan")}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo préstamo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (2x2 en móviles, 4 cols en desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: "Total en cuentas", value: totals.available, icon: WalletCards, colorClass: "kpi-icon-emerald", sub: "Saldo disponible" },
          { label: "Por cobrar", value: totals.pending, icon: HandCoins, colorClass: "kpi-icon-amber", sub: `${totals.activeLoansCount} pré${totals.activeLoansCount === 1 ? 'stamo activo' : 'stamos activos'}` },
          { label: "Ya cobrado", value: totals.collected, icon: BadgeCheck, colorClass: "kpi-icon-teal", sub: `${totals.paidLoansCount} saldado${totals.paidLoansCount !== 1 ? 's' : ''}` },
          { label: "Interés cobrado", value: totals.interestPaid, icon: Percent, colorClass: "kpi-icon-blue", sub: "Acumulado real" },
        ].map((kpi, i) => {
          const Ic = kpi.icon;
          return (
            <motion.div
              className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-5 border border-surface-container-high/70 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono truncate">{kpi.label}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${kpi.colorClass} flex items-center justify-center shrink-0`}><Ic className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="font-heading text-lg sm:text-2xl font-extrabold text-on-surface tracking-tight truncate">{money(kpi.value)}</div>
                <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-surface-container-low text-[10px] sm:text-[11px] text-on-surface-variant font-medium truncate">{kpi.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Deudores y Préstamos Recientes (Estilo Landing / Bento Table) */}
      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
          <div className="flex items-center gap-2.5">
            <WalletCards className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface">
              Deudores y Préstamos Recientes
            </h2>
          </div>
          <Link
            href="/prestamos"
            className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-mono text-xs font-semibold border border-surface-container-high/40 hover:bg-surface-container-high transition-colors"
          >
            Ver todos ({prestamos.length})
          </Link>
        </div>

        {prestamos.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-6">No hay préstamos registrados aún.</p>
        ) : (
          <>
            {/* Vista Móvil (Tarjetas táctiles sin scroll horizontal forzado) */}
            <div className="sm:hidden space-y-3">
              {(upcoming.length > 0 ? upcoming : prestamos.slice(0, 5)).map((p) => {
                const contactoNombre = rel(p.contactos)?.nombre ?? "—";
                const balance = loanBalance(p);
                const isLate = p.estado === "atrasado";
                const isPaid = p.estado === "pagado";
                return (
                  <div
                    key={p.id}
                    className="bg-surface-container-low/50 border border-surface-container-high/60 rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ContactAvatar
                          name={contactoNombre}
                          size={34}
                          className="rounded-full shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-on-surface truncate leading-tight">{contactoNombre}</p>
                          <p className="text-[11px] text-on-surface-variant truncate">{p.nombre}</p>
                        </div>
                      </div>
                      <span className="shrink-0">
                        {isLate ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold badge-atrasado">
                            Con atraso
                          </span>
                        ) : isPaid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold badge-saldado">
                            Saldado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold badge-al-dia">
                            Al día
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-high/50 text-[11px]">
                      <div>
                        <span className="text-on-surface-variant text-[10px] block uppercase font-medium">Por cobrar</span>
                        <span className="font-mono font-bold text-on-surface text-xs">
                          {money(balance > 0 ? balance : Number(p.monto_principal))}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-on-surface-variant text-[10px] block uppercase font-medium">Vencimiento</span>
                        <span className={`font-medium ${isLate ? "text-error font-bold" : "text-on-surface"}`}>
                          {p.vence_hoy
                            ? "Hoy"
                            : p.fecha_proximo_pago
                            ? formatDateEs(p.fecha_proximo_pago)
                            : `Día ${p.dia_pago}`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vista Desktop / Tablet (Tabla) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[580px]">
                <thead>
                  <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3.5 rounded-l-lg">Contacto</th>
                    <th className="py-3 px-3.5">Capital</th>
                    <th className="py-3 px-3.5">Interés</th>
                    <th className="py-3 px-3.5">Próximo Pago</th>
                    <th className="py-3 px-3.5 rounded-r-lg text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface divide-y divide-surface-container-low">
                  {(upcoming.length > 0 ? upcoming : prestamos.slice(0, 5)).map((p) => {
                    const contactoNombre = rel(p.contactos)?.nombre ?? "—";
                    const balance = loanBalance(p);
                    const isLate = p.estado === "atrasado";
                    const isPaid = p.estado === "pagado";
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-surface-container-low/40 transition-colors"
                      >
                        <td className="py-3.5 px-3.5 flex items-center gap-3">
                          <ContactAvatar
                            name={contactoNombre}
                            size={36}
                            className="rounded-full shadow-2xs shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm leading-snug truncate">{contactoNombre}</p>
                            <p className="text-xs text-on-surface-variant truncate">{p.nombre}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 font-mono font-semibold text-sm">
                          {money(balance > 0 ? balance : Number(p.monto_principal))}
                        </td>
                        <td className="py-3.5 px-3.5 font-mono text-xs text-primary font-medium">
                          {p.cobra_interes ? (
                            <span>+{p.tasa_interes_mensual}% mes ({money(monthlyInterest(p))})</span>
                          ) : (
                            <span className="text-on-surface-variant font-sans">Sin interés</span>
                          )}
                        </td>
                        <td
                          className={`py-3.5 px-3.5 text-xs ${
                            isLate ? "text-error font-semibold" : "text-on-surface-variant"
                          }`}
                        >
                          {p.vence_hoy
                            ? "Hoy (Día de cobro)"
                            : p.fecha_proximo_pago
                            ? formatDateEs(p.fecha_proximo_pago)
                            : `Día ${p.dia_pago}`}
                        </td>
                        <td className="py-3.5 px-3.5 text-right">
                          {isLate ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-atrasado">
                              Con atraso
                            </span>
                          ) : isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-saldado">
                              Saldado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold badge-al-dia">
                              Al día
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Recent Movements */}
      {movimientos.length > 0 && (
        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
            <h2 className="font-heading text-base font-bold text-on-surface">Movimientos recientes</h2>
            <Link href="/movimientos" className="text-xs font-bold text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {movimientos.slice(0, 5).map((m) => {
              const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
                || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
              const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
              const BadgeIcon = badge.Icon;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-surface-container-low/50 last:border-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-xl border shrink-0 ${badge.badgeClass}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-on-surface truncate">{fixSpanishEncoding(m.descripcion || badge.label)}</p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant truncate">{formatDateEs(m.ocurrido_en)} · {rel(m.cuentas_dinero)?.nombre}</p>
                    </div>
                  </div>
                  <span className={`font-mono text-xs font-bold shrink-0 ${isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"}`}>
                    {isPositive ? "+" : "-"}{money(Number(m.monto))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ContactosView({ contactos, prestamos, openModal }: { contactos: Contacto[]; prestamos: Prestamo[]; openModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Contactos & Deudores</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Directorio de personas y seguimiento del estado de deuda.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Nuevo contacto</span>
        </button>
      </div>
      {/* Vista Móvil (Tarjetas de contactos) */}
      <div className="sm:hidden space-y-2.5">
        {contactos.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
            Sin contactos aún. Crea el primero.
          </div>
        ) : (
          contactos.map((c) => {
            const allLoans = prestamos.filter((l) => rel(l.contactos)?.id === c.id);
            const activeLoans = allLoans.filter((l) => l.estado === "activo" || l.estado === "atrasado");
            const paidLoans = allLoans.filter((l) => l.estado === "pagado");
            const balance = activeLoans.reduce((sum, l) => sum + loanBalance(l), 0);
            const isLate = activeLoans.some((l) => l.estado === "atrasado");
            return (
              <div key={c.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ContactAvatar name={c.nombre} size={38} className="rounded-full shadow-xs shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate">{c.nombre}</h4>
                      {c.telefono && (
                        <a href={`tel:${c.telefono}`} className="text-xs text-primary font-medium block truncate hover:underline">
                          {c.telefono}
                        </a>
                      )}
                      {c.email && <span className="text-[11px] text-on-surface-variant block truncate">{c.email}</span>}
                    </div>
                  </div>
                  <div>
                    {activeLoans.length > 0 ? isLate ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-atrasado inline-flex items-center">Con atraso</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-al-dia inline-flex items-center">Al día</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-saldado inline-flex items-center">Sin deuda</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-low text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Préstamos</span>
                    <span className="font-semibold text-on-surface">
                      {allLoans.length} {allLoans.length === 1 ? "préstamo" : "préstamos"}
                      {paidLoans.length > 0 && <span className="text-[10px] text-on-surface-variant font-normal"> ({paidLoans.length} saldados)</span>}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-on-surface-variant block">Total por cobrar</span>
                    <span className="font-mono font-bold text-sm text-primary">{money(balance)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vista Desktop / Tablet (Tabla) */}
      <div className="hidden sm:block bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-sm min-w-[620px]">
          <thead>
            <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-lg">Persona</th>
              <th className="py-3 px-4">Teléfono</th>
              <th className="py-3 px-4">Préstamos</th>
              <th className="py-3 px-4">Por cobrar</th>
              <th className="py-3 px-4 rounded-r-lg text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {contactos.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-xs text-on-surface-variant">Sin contactos aún. Crea el primero.</td></tr>
            ) : contactos.map((c) => {
              const allLoans = prestamos.filter((l) => rel(l.contactos)?.id === c.id);
              const activeLoans = allLoans.filter((l) => l.estado === "activo" || l.estado === "atrasado");
              const paidLoans = allLoans.filter((l) => l.estado === "pagado");
              const balance = activeLoans.reduce((sum, l) => sum + loanBalance(l), 0);
              const isLate = activeLoans.some((l) => l.estado === "atrasado");
              return (
                <tr key={c.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <ContactAvatar name={c.nombre} size={36} className="rounded-full shadow-xs shrink-0" />
                      <div>
                        <span className="font-semibold text-sm block leading-tight">{c.nombre}</span>
                        {c.email && <span className="text-[11px] text-on-surface-variant">{c.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-on-surface-variant">{c.telefono || "—"}</td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold">{allLoans.length}</span>
                    {paidLoans.length > 0 && (
                      <span className="ml-1.5 text-[10px] text-on-surface-variant">({paidLoans.length} saldados)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-sm">
                    {money(balance)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {activeLoans.length > 0 ? isLate ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-atrasado inline-flex items-center">Con atraso</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-al-dia inline-flex items-center">Al día</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold badge-saldado inline-flex items-center">Sin deuda activa</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EstadoPrestamoSelect({
  estado,
  nombre,
  onChange,
}: {
  estado: "activo" | "pagado" | "atrasado" | "cancelado";
  nombre: string;
  onChange: (nuevoEstado: "activo" | "pagado" | "atrasado" | "cancelado") => void;
}) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={estado}
        onChange={(event) => onChange(event.target.value as "activo" | "pagado" | "atrasado" | "cancelado")}
        className={`appearance-none w-[124px] pl-3.5 pr-8 py-1.5 rounded-full text-xs font-bold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs ${
          estado === "atrasado" ? "badge-atrasado" :
          estado === "pagado" ? "badge-saldado" :
          estado === "cancelado" ? "badge-neutral" :
          "badge-al-dia"
        }`}
        aria-label={`Estado de ${nombre}`}
      >
        <option value="activo" className="bg-surface text-on-surface">Activo</option>
        <option value="atrasado" className="bg-surface text-on-surface">Atrasado</option>
        <option value="pagado" className="bg-surface text-on-surface">Pagado</option>
        <option value="cancelado" className="bg-surface text-on-surface">Cancelado</option>
      </select>
      <ChevronDown className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-current opacity-70" />
    </div>
  );
}

function PrestamosView({
  prestamos,
  openModal,
  onStatusChange,
}: {
  prestamos: Prestamo[];
  openModal: () => void;
  onStatusChange: (prestamoId: string, estado: "activo" | "pagado" | "atrasado" | "cancelado") => Promise<void>;
}) {
  const [tab, setTab] = useState<"activos" | "pagados">("activos");
  const activos = prestamos.filter((p) => p.estado === "activo" || p.estado === "atrasado");
  const pagados = prestamos.filter((p) => p.estado === "pagado" || p.estado === "cancelado");
  const vencenHoy = activos.filter((p) => p.vence_hoy);
  const displayed = tab === "activos" ? activos : pagados;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Préstamos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Registro de préstamos con cálculo mensual de intereses.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Nuevo préstamo</span>
        </button>
      </div>

      {/* Tabs activos / saldados */}
      <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 bg-surface-container-low p-1 rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setTab("activos")}
          className={`px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
            tab === "activos" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Por cobrar
          {activos.length > 0 && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              tab === "activos" ? "bg-white/20" : "bg-surface-container text-on-surface-variant"
            }`}>{activos.length}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("pagados")}
          className={`px-4 py-2 sm:py-1.5 text-xs font-semibold rounded-lg transition-all text-center ${
            tab === "pagados" ? "bg-primary text-on-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Saldados
          {pagados.length > 0 && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              tab === "pagados" ? "bg-white/20" : "bg-surface-container text-on-surface-variant"
            }`}>{pagados.length}</span>
          )}
        </button>
      </div>
      {vencenHoy.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          <Calendar className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            <strong>{vencenHoy.length} {vencenHoy.length === 1 ? "préstamo vence" : "préstamos vencen"} hoy.</strong>{" "}
            Es el día de abono esperado; si no registras un cobro, mañana aparecerá automáticamente como atrasado.
          </p>
        </div>
      )}

      {/* Vista Móvil (Tarjetas táctiles sin scroll horizontal forzado) */}
      <div className="sm:hidden space-y-3">
        {displayed.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
            {tab === "activos" ? "No hay préstamos activos pendientes." : "No hay préstamos saldados aún."}
          </div>
        ) : (
          displayed.map((l) => {
            const nombre = rel(l.contactos)?.nombre ?? "—";
            const isPaid = l.estado === "pagado" || l.estado === "cancelado";
            return (
              <div
                key={l.id}
                className={`bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-2xs space-y-3 ${
                  isPaid ? "opacity-75" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ContactAvatar name={nombre} size={36} className="rounded-full shadow-xs shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-on-surface truncate">{nombre}</h4>
                      <p className="text-xs text-on-surface-variant truncate">{l.nombre}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-on-surface-variant font-medium block">
                      {tab === "activos" ? "Por cobrar" : "Capital pagado"}
                    </span>
                    <span className="font-mono text-base font-bold text-primary">
                      {isPaid ? money(Number(l.monto_capital_pagado)) : money(loanBalance(l))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-low text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Capital inicial</span>
                    <span className="font-mono font-medium text-on-surface">{money(Number(l.monto_principal))}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Interés mensual</span>
                    <span className="font-mono font-medium text-on-surface">
                      {l.cobra_interes ? `${l.tasa_interes_mensual}% (${money(monthlyInterest(l))})` : "Sin interés"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Cobro</span>
                    <span className="font-medium text-on-surface">Día {l.dia_pago} de cada mes</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block">Próximo abono</span>
                    <span className={`font-medium ${l.vence_hoy ? "text-amber-600 font-bold" : "text-on-surface"}`}>
                      {l.vence_hoy ? "Hoy" : l.fecha_proximo_pago ? formatDateEs(l.fecha_proximo_pago) : "Al día"}
                    </span>
                    {l.meses_atrasados > 0 && (
                      <span className="text-[10px] text-error font-semibold block">
                        {l.meses_atrasados} periodo{l.meses_atrasados > 1 ? "s" : ""} atrasado
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-surface-container-low flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-on-surface-variant">Estado:</span>
                  <EstadoPrestamoSelect
                    estado={l.estado}
                    nombre={l.nombre}
                    onChange={(nuevoEstado) => onStatusChange(l.id, nuevoEstado)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vista Desktop / Tablet (Tabla) */}
      <div className="hidden sm:block bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead>
            <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-lg">Persona</th>
              <th className="py-3 px-4">Préstamo</th>
              <th className="py-3 px-4">Capital inicial</th>
              <th className="py-3 px-4">{tab === "activos" ? "Por cobrar" : "Capital pagado"}</th>
              <th className="py-3 px-4">Interés mensual</th>
              <th className="py-3 px-4">Día cobro</th>
              <th className="py-3 px-4">Próximo vencimiento</th>
              <th className="py-3 px-4 rounded-r-lg text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {displayed.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-xs text-on-surface-variant">
                {tab === "activos" ? "No hay préstamos activos pendientes." : "No hay préstamos saldados aún."}
              </td></tr>
            ) : displayed.map((l) => {
              const nombre = rel(l.contactos)?.nombre ?? "—";
              const isPaid = l.estado === "pagado" || l.estado === "cancelado";
              return (
                <tr key={l.id} className={`hover:bg-surface-container-low/40 transition-colors ${
                  isPaid ? "opacity-70" : ""
                }`}>
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-2.5">
                      <ContactAvatar name={nombre} size={32} className="rounded-full shadow-xs shrink-0" />
                      <span className="font-semibold text-sm">{nombre}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-middle text-xs text-on-surface-variant">{l.nombre}</td>
                  <td className="py-3.5 px-4 align-middle font-mono font-medium text-xs">{money(Number(l.monto_principal))}</td>
                  <td className="py-3.5 px-4 align-middle font-mono font-semibold text-sm">
                    {isPaid
                      ? <span className="text-emerald-600">{money(Number(l.monto_capital_pagado))}</span>
                      : money(loanBalance(l))}
                  </td>
                  <td className="py-3.5 px-4 align-middle font-mono text-xs text-primary font-semibold">
                    {l.cobra_interes
                      ? <span>{l.tasa_interes_mensual}% ({money(monthlyInterest(l))})<span className="block text-[10px] text-on-surface-variant font-normal mt-0.5">Cobrado: {money(l.interes_pagado_total)}</span></span>
                      : <span className="text-on-surface-variant font-sans">Sin interés</span>}
                  </td>
                  <td className="py-3.5 px-4 align-middle text-xs font-medium text-on-surface-variant">Día {l.dia_pago}</td>
                  <td className="py-3.5 px-4 align-middle text-xs font-medium text-on-surface-variant">
                    {l.vence_hoy ? "Hoy · día de abono" : l.fecha_proximo_pago ? formatDateEs(l.fecha_proximo_pago) : "Sin pendientes"}
                    {l.meses_atrasados > 0 && (
                      <span className="block text-[10px] text-error mt-0.5">
                        {l.meses_atrasados} periodo{l.meses_atrasados === 1 ? "" : "s"} atrasado{l.meses_atrasados === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 align-middle text-left">
                    <EstadoPrestamoSelect
                      estado={l.estado}
                      nombre={l.nombre}
                      onChange={(nuevoEstado) => onStatusChange(l.id, nuevoEstado)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PagosView({ pagos, openModal }: { pagos: Pago[]; openModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cobros recibidos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Registro del dinero que realmente recibiste de tus préstamos.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Registrar cobro</span>
        </button>
      </div>
      {/* Vista Móvil (Tarjetas de cobros) */}
      <div className="sm:hidden space-y-2.5">
        {pagos.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
            Sin cobros registrados aún.
          </div>
        ) : (
          pagos.map((p) => {
            const prestamo = rel(p.prestamos);
            const contacto = rel(prestamo?.contactos);
            return (
              <div key={p.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-on-surface truncate">{contacto?.nombre ?? "—"}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{prestamo?.nombre ?? "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-bold text-primary block">+{money(Number(p.monto_total))}</span>
                    <span className="text-[10px] text-on-surface-variant">{formatDateEs(p.recibido_en)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-surface-container-low text-[11px] text-on-surface-variant">
                  <span>Capital: <strong className="text-on-surface font-mono">{money(Number(p.monto_principal))}</strong> · Interés: <strong className="text-on-surface font-mono">{money(Number(p.monto_interes))}</strong></span>
                  <span className="font-medium text-on-surface bg-surface-container-low px-2 py-0.5 rounded-md border border-surface-container-high/40">{rel(p.cuentas_dinero)?.nombre ?? "—"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vista Desktop / Tablet (Tabla) */}
      <div className="hidden sm:block bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr className="bg-surface-container-low/70 text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-lg">Vencimiento</th>
              <th className="py-3 px-4">Cobrado</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Préstamo</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Capital</th>
              <th className="py-3 px-4">Interés</th>
              <th className="py-3 px-4 rounded-r-lg">Cuenta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {pagos.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-xs text-on-surface-variant">Sin cobros registrados aún.</td></tr>
            ) : pagos.map((p) => {
              const prestamo = rel(p.prestamos);
              const contacto = rel(prestamo?.contactos);
              return (
                <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                    {formatDateEs(p.fecha_esperada)}{p.fecha_esperada && p.recibido_en > p.fecha_esperada ? " · atrasado" : ""}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{formatDateEs(p.recibido_en)}</td>
                  <td className="py-3.5 px-4 font-semibold text-sm">{contacto?.nombre ?? "—"}</td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{prestamo?.nombre ?? "—"}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-sm text-primary">{money(Number(p.monto_total))}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{money(Number(p.monto_principal))}</td>
                  <td className="py-3.5 px-4 font-mono text-xs">{money(Number(p.monto_interes))}</td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{rel(p.cuentas_dinero)?.nombre ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AccountTheme {
  id: string;
  name: string;
  description: string;
  dot: string;
  cardCls: string;
  badgeCls: string;
  balanceCls: string;
}

const ACCOUNT_CARD_THEMES: AccountTheme[] = [
  {
    id: "turquoise",
    name: "Turquesa Al Día",
    description: "Estilo insignia con la frescura y liquidez de FinPal",
    dot: "#00a896",
    cardCls: "bg-teal-100/90 border-teal-300 hover:border-teal-400 dark:bg-teal-950/50 dark:border-teal-700/60 dark:hover:border-teal-600 shadow-2xs transition-colors",
    badgeCls: "badge-turquesa",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "emerald",
    name: "Esmeralda Vivo",
    description: "Rendimientos estables, capital y crecimiento continuo",
    dot: "#059669",
    cardCls: "bg-emerald-100/90 border-emerald-300 hover:border-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-700/60 dark:hover:border-emerald-600 shadow-2xs transition-colors",
    badgeCls: "badge-emerald",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "ocean",
    name: "Azul Océano",
    description: "Solidez bancaria, cuentas de nómina e instituciones",
    dot: "#2563eb",
    cardCls: "bg-blue-100/90 border-blue-300 hover:border-blue-400 dark:bg-blue-950/50 dark:border-blue-700/60 dark:hover:border-blue-600 shadow-2xs transition-colors",
    badgeCls: "badge-blue",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "violet",
    name: "Violeta Real",
    description: "Fondos de inversión, reservas y metas patrimoniales",
    dot: "#7c3aed",
    cardCls: "bg-violet-100/90 border-violet-300 hover:border-violet-400 dark:bg-violet-950/50 dark:border-violet-700/60 dark:hover:border-violet-600 shadow-2xs transition-colors",
    badgeCls: "badge-violet",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "amber",
    name: "Ámbar Cálido",
    description: "Fondos de emergencia, ahorro líquido y reserva diaria",
    dot: "#d97706",
    cardCls: "bg-amber-100/90 border-amber-300 hover:border-amber-400 dark:bg-amber-950/50 dark:border-amber-700/60 dark:hover:border-amber-600 shadow-2xs transition-colors",
    badgeCls: "badge-amber",
    balanceCls: "text-slate-800 dark:text-white",
  },
  {
    id: "rose",
    name: "Coral Carmesí",
    description: "Gastos activos, billeteras QR y consumo personal",
    dot: "#e11d48",
    cardCls: "bg-rose-100/90 border-rose-300 hover:border-rose-400 dark:bg-rose-950/50 dark:border-rose-700/60 dark:hover:border-rose-600 shadow-2xs transition-colors",
    badgeCls: "badge-rose",
    balanceCls: "text-slate-800 dark:text-white",
  },
];

function AccountCardItem({
  c,
  index,
  tipoLabel,
  themeId,
}: {
  c: Cuenta;
  index: number;
  tipoLabel: string;
  themeId: string;
}) {
  const normalizedId = themeId === "blue" ? "ocean" : themeId;
  const currentTheme = ACCOUNT_CARD_THEMES.find((t) => t.id === normalizedId) ?? ACCOUNT_CARD_THEMES[index % ACCOUNT_CARD_THEMES.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.07, 0.35), ease: "easeOut" }}
      className={`rounded-2xl border p-5 shadow-xs transition-colors relative flex flex-col justify-between ${currentTheme.cardCls}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${currentTheme.badgeCls}`}>
            {tipoLabel}
          </span>
        </div>
        <p className="font-heading text-lg font-extrabold text-slate-800 dark:text-white mt-3 tracking-tight">{c.nombre}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 flex items-baseline justify-between">
        <div>
          <span className="text-[10px] text-slate-600 dark:text-slate-300 block uppercase font-bold tracking-wider">Saldo disponible</span>
          <p className="font-mono text-2xl font-extrabold mt-0.5 text-slate-800 dark:text-white">{money(c.saldo)}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-800 dark:text-white border border-black/10 dark:border-white/15 font-mono">
          {c.codigo_moneda}
        </span>
      </div>
    </motion.div>
  );
}

function ModalPersonalizarColores({
  cuentas,
  selectedAccountId,
  onSelectAccount,
  themeMap,
  onSelectTheme,
  onClose,
}: {
  cuentas: Cuenta[];
  selectedAccountId: string;
  onSelectAccount: (id: string) => void;
  themeMap: Record<string, string>;
  onSelectTheme: (cuentaId: string, themeId: string) => void;
  onClose: () => void;
}) {
  const currentAccount = cuentas.find((c) => c.id === selectedAccountId) ?? cuentas[0];
  const activeThemeId = currentAccount ? (themeMap[currentAccount.id] ?? "turquoise") : "turquoise";
  const activeTheme = ACCOUNT_CARD_THEMES.find((t) => t.id === activeThemeId) ?? ACCOUNT_CARD_THEMES[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-on-surface">Personalizar colores de cuentas</h2>
              <p className="text-xs text-on-surface-variant">Estilos vibrantes y armónicos inspirados en la estética de FinPal.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de cuenta si hay más de 1 */}
        {cuentas.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Selecciona la cuenta a personalizar:</label>
            <div className="flex flex-wrap gap-2">
              {cuentas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectAccount(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    currentAccount?.id === c.id
                      ? "bg-primary text-on-primary border-primary shadow-xs"
                      : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant border-outline/15"
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vista previa en vivo de la tarjeta */}
        {currentAccount && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-on-surface-variant">Vista previa en tiempo real:</span>
              <span className="text-[11px] text-primary font-medium">{activeTheme.name}</span>
            </div>
            <div className={`rounded-2xl border p-4 shadow-xs transition-all ${activeTheme.cardCls}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${activeTheme.badgeCls}`}>
                  {currentAccount.tipo}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-800 dark:text-white border border-black/10 dark:border-white/15 font-mono">
                  {currentAccount.codigo_moneda}
                </span>
              </div>
              <p className="font-heading text-base font-extrabold text-slate-800 dark:text-white mt-2.5 tracking-tight">{currentAccount.nombre}</p>
              <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 flex items-baseline justify-between">
                <span className="text-[10px] text-slate-600 dark:text-slate-300 uppercase font-bold tracking-wider">Saldo disponible</span>
                <p className="font-mono text-xl font-extrabold text-slate-800 dark:text-white">{money(currentAccount.saldo)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Opciones predefinidas vibrantes */}
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-2">Elige un estilo predefinido:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ACCOUNT_CARD_THEMES.map((t) => {
              const isSelected = activeThemeId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => currentAccount && onSelectTheme(currentAccount.id, t.id)}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xs"
                      : "border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 mt-0.5 ring-2 ring-white/80 dark:ring-black/40 shadow-xs"
                    style={{ backgroundColor: t.dot }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-on-surface block truncate">{t.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="text-[11px] text-on-surface-variant block mt-0.5 line-clamp-1">{t.description}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-surface-container-high/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

function CuentasView({ cuentas, openModal }: { cuentas: Cuenta[]; openModal: () => void }) {
  const [modalColoresOpen, setModalColoresOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(cuentas[0]?.id ?? "");
  const [themeMap, setThemeMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    cuentas.forEach((c, i) => {
      const saved = localStorage.getItem(`finpal_account_color_${c.id}`);
      map[c.id] = saved || ACCOUNT_CARD_THEMES[i % ACCOUNT_CARD_THEMES.length].id;
    });
    setThemeMap(map);
  }, [cuentas]);

  const handleSelectTheme = (accountId: string, themeId: string) => {
    setThemeMap((prev) => ({ ...prev, [accountId]: themeId }));
    try {
      localStorage.setItem(`finpal_account_color_${accountId}`, themeId);
    } catch {}
  };

  const handleOpenColorModal = (accountId?: string) => {
    if (accountId) setSelectedAccountId(accountId);
    else if (cuentas.length > 0) setSelectedAccountId(cuentas[0].id);
    setModalColoresOpen(true);
  };

  const TIPO_LABELS: Record<string, string> = {
    efectivo: "Efectivo", banco: "Cuenta bancaria", billetera_movil: "Billetera móvil", ahorro: "Cuenta de ahorro", otra: "Otra",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cuentas de Dinero</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Efectivo, bancos, billeteras y personalización de fondo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cuentas.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenColorModal()}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Palette className="w-4 h-4 text-primary" />
              <span>Editar colores</span>
            </button>
          )}
          <button
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer transition-colors"
            onClick={openModal}
          >
            <Plus className="w-4 h-4" />
            <span>Nueva cuenta</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cuentas.length === 0 && (
          <p className="text-xs text-on-surface-variant col-span-3 text-center py-8">Sin cuentas registradas aún.</p>
        )}
        {cuentas.map((c, i) => (
          <AccountCardItem
            key={c.id}
            c={c}
            index={i}
            tipoLabel={TIPO_LABELS[c.tipo] ?? c.tipo}
            themeId={themeMap[c.id] ?? ACCOUNT_CARD_THEMES[i % ACCOUNT_CARD_THEMES.length].id}
          />
        ))}
      </div>

      {modalColoresOpen && (
        <ModalPersonalizarColores
          cuentas={cuentas}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
          themeMap={themeMap}
          onSelectTheme={handleSelectTheme}
          onClose={() => setModalColoresOpen(false)}
        />
      )}
    </div>
  );
}

function MovimientosView({ movimientos, openModal }: { movimientos: Movimiento[]; openModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Movimientos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Todos los flujos de dinero del espacio.</p>
        </div>
        <button className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Registrar movimiento</span>
        </button>
      </div>
      {/* Vista Móvil (Tarjetas de movimientos) */}
      <div className="sm:hidden space-y-2.5">
        {movimientos.length === 0 ? (
          <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 text-center text-xs text-on-surface-variant">
            Sin movimientos registrados aún.
          </div>
        ) : (
          movimientos.map((m) => {
            const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
              || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
            const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
            const BadgeIcon = badge.Icon;
            const cuentaNombre = (Array.isArray(m.cuentas_dinero)
              ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
              : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "—";
            return (
              <div key={m.id} className="bg-surface-container-lowest border border-surface-container-high/70 rounded-xl p-3.5 shadow-2xs flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${badge.badgeClass}`}>
                      <BadgeIcon className="w-2.5 h-2.5 shrink-0" />
                      <span>{badge.label}</span>
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-on-surface truncate">{m.descripcion ? fixSpanishEncoding(m.descripcion) : badge.label}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">{formatDateEs(m.ocurrido_en)} · {cuentaNombre}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-mono text-xs font-bold block ${isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"}`}>
                    {isPositive ? "+" : "-"}{money(Number(m.monto))}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vista Desktop / Tablet (Tabla) */}
      <div className="hidden sm:block bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Fecha</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Cuenta</th>
              <th className="py-3 px-4 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low text-on-surface">
            {movimientos.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-xs text-on-surface-variant">Sin movimientos registrados aún.</td></tr>
            ) : movimientos.map((m) => {
              const isPositive = ["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo)
                || (m.tipo === "ajuste" && m.ajuste_sentido === "sumar");
              const badge = getTipoMovimientoBadge(m.tipo, m.ajuste_sentido);
              const BadgeIcon = badge.Icon;
              return (
                <tr key={m.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{formatDateEs(m.ocurrido_en)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${badge.badgeClass}`}>
                      <BadgeIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{badge.label}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-sm font-medium text-on-surface">{m.descripcion ? fixSpanishEncoding(m.descripcion) : "—"}</td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                    {(Array.isArray(m.cuentas_dinero)
                      ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
                      : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "—"}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${isPositive ? "text-primary" : "text-rose-600 dark:text-rose-400"}`}>
                    {isPositive ? "+" : "-"}{money(Number(m.monto))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ConfiguracionView({
  preferencias,
  guardarPreferencias,
}: {
  preferencias: { colorAcento: string; modoOscuro: boolean; tasaInteresPredeterminada: number };
  guardarPreferencias: (colorAcento: string, modoOscuro: boolean, tasaInteresPredeterminada: number) => Promise<string | null>;
}) {
  const [color, setColor] = useState(preferencias.colorAcento);
  const [tasa, setTasa] = useState(preferencias.tasaInteresPredeterminada);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    setColor(preferencias.colorAcento);
    setTasa(preferencias.tasaInteresPredeterminada);
  }, [preferencias.colorAcento, preferencias.tasaInteresPredeterminada]);

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    const error = await guardarPreferencias(color, preferencias.modoOscuro, tasa);
    setGuardando(false);
    setMensaje(error ?? "Preferencias guardadas.");
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-surface-container-high/60">
        <h1 className="font-heading text-2xl font-extrabold text-on-surface">Configuración</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Ajustes del espacio de trabajo.</p>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 shadow-2xs p-6">
        <div className="space-y-5 max-w-xl">
          <div>
            <h2 className="font-heading text-base font-bold text-on-surface">Apariencia</h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Estas preferencias se guardan en tu perfil y se aplican en todos tus espacios.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-2">Color de resaltado</label>
            <div className="flex flex-wrap gap-2">
              {[
                ["verde", "#006948"],
                ["azul", "#2563eb"],
                ["violeta", "#7c3aed"],
                ["naranja", "#c2410c"],
                ["rosa", "#e11d48"],
              ].map(([value, colorValue]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColor(value)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold capitalize ${
                    color === value ? "border-primary ring-2 ring-primary/20" : "border-surface-container-high"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: colorValue }} />
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Interés predeterminado para nuevos préstamos (% mensual)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={tasa}
              onChange={(event) => setTasa(Number(event.target.value))}
              className="w-40 h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary"
            />
            <p className="text-[11px] text-on-surface-variant mt-1">
              Sólo rellena nuevos formularios; no cambia préstamos existentes.
            </p>
          </div>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar preferencias"}
          </button>
          {mensaje && <p className="text-xs text-on-surface-variant">{mensaje}</p>}
        </div>
        <p className="text-sm text-on-surface-variant mt-8">La configuración avanzada del espacio (nombre, moneda, zona horaria) estará disponible pronto.</p>
        <Link href="/espacios" className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-primary hover:underline">
          <ArrowRight className="w-4 h-4" /> Volver a espacios
        </Link>
      </div>
    </div>
  );
}
