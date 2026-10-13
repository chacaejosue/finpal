"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
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

export type PageName =
  | "inicio"
  | "contactos"
  | "prestamos"
  | "pagos"
  | "cuentas"
  | "movimientos"
  | "reportes"
  | "configuracion";

// ─── Main View Switcher Component ─────────────────────────────────────────────

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
              window.alert(result.error);
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
      {page === "reportes" && <ReportesView totals={totals} prestamos={prestamos} />}
      {page === "configuracion" && (
        <ConfiguracionView preferencias={preferencias} guardarPreferencias={guardarPreferencias} />
      )}
    </motion.div>
  );
}

// ─── Page View Components ─────────────────────────────────────────────────────

function DashboardView({
  cuentas, prestamos, movimientos, totals, openModal,
}: {
  cuentas: Cuenta[];
  prestamos: Prestamo[];
  movimientos: Movimiento[];
  totals: ReturnType<typeof Object.assign>;
  openModal: (m: "loan" | "payment") => void;
}) {
  const upcoming = prestamos.filter((p) => p.estado !== "pagado").slice(0, 3);
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant mb-1">
            <span className="inline-flex items-center gap-1.5 text-primary bg-secondary-container/40 px-2.5 py-0.5 rounded-full border border-primary/10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Panel de control financiero
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-on-surface tracking-tight">Panel de control</h1>
          <p className="text-sm text-on-surface-variant mt-1">Resumen consolidado de tus finanzas y cartera de préstamos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-lowest hover:bg-surface-container text-on-surface font-semibold text-xs transition-all shadow-2xs"
            type="button"
            onClick={() => openModal("payment")}
          >
            <ReceiptText className="w-4 h-4 text-primary" />
            <span>Registrar cobro</span>
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-xs"
            type="button"
            onClick={() => openModal("loan")}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo préstamo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total en cuentas", value: totals.available, icon: WalletCards, colorClass: "bg-emerald-50 text-primary", sub: "Saldo disponible" },
          { label: "Por cobrar", value: totals.pending, icon: HandCoins, colorClass: "bg-amber-50 text-amber-700", sub: `${totals.activeLoansCount} pré${totals.activeLoansCount === 1 ? 'stamo activo' : 'stamos activos'}` },
          { label: "Ya cobrado", value: totals.collected, icon: BadgeCheck, colorClass: "bg-emerald-50 text-emerald-700", sub: `${totals.paidLoansCount} saldado${totals.paidLoansCount !== 1 ? 's' : ''}` },
          { label: "Interés cobrado", value: totals.interestPaid, icon: Percent, colorClass: "bg-blue-50 text-blue-700", sub: "Acumulado de cobros reales" },
        ].map((kpi, i) => {
          const Ic = kpi.icon;
          return (
            <motion.div
              className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/70 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
              key={kpi.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-mono">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-xl ${kpi.colorClass} flex items-center justify-center`}><Ic className="w-4 h-4" /></div>
              </div>
              <div className="mt-3">
                <div className="font-heading text-2xl font-extrabold text-on-surface tracking-tight">{money(kpi.value)}</div>
                <div className="mt-2 pt-2 border-t border-surface-container-low text-[11px] text-on-surface-variant font-medium">{kpi.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Upcoming Payments */}
      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
          <h2 className="font-heading text-base font-bold text-on-surface">Préstamos activos</h2>
          <Link href="/prestamos" className="text-xs font-bold text-primary hover:underline">Ver todos</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-4">No hay préstamos activos</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((p) => {
              const contactoNombre = rel(p.contactos)?.nombre ?? "?";
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high/30">
                  <div className="flex items-center gap-3">
                    <ContactAvatar name={contactoNombre} size={32} className="rounded-full shadow-xs" />
                    <div>
                      <p className="text-xs font-bold text-on-surface">{contactoNombre}</p>
                      <p className="text-[11px] text-on-surface-variant">{p.nombre} · Día {p.dia_pago}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-primary block">{money(loanBalance(p))}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      p.estado === "atrasado" ? "bg-error-container text-on-error-container" :
                      p.estado === "pagado" ? "bg-surface-container text-on-surface-variant" :
                      "bg-secondary-container/50 text-on-secondary-container"
                    }`}>
                      {p.estado === "pagado" ? "Saldado" : p.estado === "atrasado" ? "Atrasado" : "Al día"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Movements */}
      {movimientos.length > 0 && (
        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-surface-container-low mb-4">
            <h2 className="font-heading text-base font-bold text-on-surface">Movimientos recientes</h2>
            <Link href="/movimientos" className="text-xs font-bold text-primary hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-2">
            {movimientos.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-surface-container-low/50 last:border-0">
                <div>
                  <p className="text-xs font-semibold text-on-surface">{fixSpanishEncoding(m.descripcion || m.tipo)}</p>
                  <p className="text-[11px] text-on-surface-variant">{formatDateEs(m.ocurrido_en)} · {rel(m.cuentas_dinero)?.nombre}</p>
                </div>
                <span className={`font-mono text-xs font-bold ${["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo) ? "text-primary" : "text-error"}`}>
                  {["ingreso", "pago_prestamo", "transferencia_entrada"].includes(m.tipo) ? "+" : "-"}{money(Number(m.monto))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContactosView({ contactos, prestamos, openModal }: { contactos: Contacto[]; prestamos: Prestamo[]; openModal: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Contactos & Deudores</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Directorio de personas y seguimiento del estado de deuda.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Nuevo contacto</span>
        </button>
      </div>
      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Persona</th>
              <th className="py-3 px-4">Teléfono</th>
              <th className="py-3 px-4">Préstamos</th>
              <th className="py-3 px-4">Por cobrar</th>
              <th className="py-3 px-4 text-right">Estado</th>
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
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-error-container text-on-error-container border border-error/20">Con atraso</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-container/50 text-on-secondary-container border border-primary/20">Al día</span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant border border-surface-container-high/40">Sin deuda activa</span>
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
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Préstamos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Registro de préstamos con cálculo mensual de intereses.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Nuevo préstamo</span>
        </button>
      </div>

      {/* Tabs activos / saldados */}
      <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab("activos")}
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
          className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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

      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Persona</th>
              <th className="py-3 px-4">Préstamo</th>
              <th className="py-3 px-4">Capital inicial</th>
              <th className="py-3 px-4">{tab === "activos" ? "Por cobrar" : "Capital pagado"}</th>
              <th className="py-3 px-4">Interés mensual</th>
              <th className="py-3 px-4">Día cobro</th>
              <th className="py-3 px-4">Próximo vencimiento</th>
              <th className="py-3 px-4 text-right">Estado</th>
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
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <ContactAvatar name={nombre} size={32} className="rounded-full shadow-xs shrink-0" />
                      <span className="font-semibold text-sm">{nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-on-surface-variant">{l.nombre}</td>
                  <td className="py-3 px-4 font-mono font-medium text-xs">{money(Number(l.monto_principal))}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-sm">
                    {isPaid
                      ? <span className="text-emerald-600">{money(Number(l.monto_capital_pagado))}</span>
                      : money(loanBalance(l))}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-primary font-semibold">
                    {l.cobra_interes
                      ? <span>{l.tasa_interes_mensual}% ({money(monthlyInterest(l))})<span className="block text-[10px] text-on-surface-variant font-normal mt-0.5">Cobrado: {money(l.interes_pagado_total)}</span></span>
                      : <span className="text-on-surface-variant font-sans">Sin interés</span>}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-on-surface-variant">Día {l.dia_pago}</td>
                  <td className="py-3 px-4 text-xs font-medium text-on-surface-variant">
                    {l.vence_hoy ? "Hoy · día de abono" : l.fecha_proximo_pago ? formatDateEs(l.fecha_proximo_pago) : "Sin pendientes"}
                    {l.meses_atrasados > 0 && (
                      <span className="block text-[10px] text-error mt-0.5">
                        {l.meses_atrasados} periodo{l.meses_atrasados === 1 ? "" : "s"} atrasado{l.meses_atrasados === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={l.estado}
                      onChange={(event) => onStatusChange(l.id, event.target.value as "activo" | "pagado" | "atrasado" | "cancelado")}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border bg-transparent cursor-pointer ${
                      l.estado === "atrasado" ? "bg-error-container text-on-error-container border-error/20" :
                      l.estado === "pagado" ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" :
                      l.estado === "cancelado" ? "bg-surface-container text-on-surface-variant border-surface-container-high/40" :
                      "bg-secondary-container/50 text-on-secondary-container border-primary/20"
                    }`}
                      aria-label={`Estado de ${l.nombre}`}
                    >
                      <option value="activo">Activo</option>
                      <option value="atrasado">Atrasado</option>
                      <option value="pagado">Pagado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
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
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cobros recibidos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Registro del dinero que realmente recibiste de tus préstamos.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Registrar cobro</span>
        </button>
      </div>
      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-surface-container-low text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              <th className="py-3 px-4">Vencimiento</th>
              <th className="py-3 px-4">Cobrado</th>
              <th className="py-3 px-4">Contacto</th>
              <th className="py-3 px-4">Préstamo</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Capital</th>
              <th className="py-3 px-4">Interés</th>
              <th className="py-3 px-4">Cuenta</th>
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

function CuentasView({ cuentas, openModal }: { cuentas: Cuenta[]; openModal: () => void }) {
  const TIPO_LABELS: Record<string, string> = {
    efectivo: "Efectivo", banco: "Cuenta bancaria", billetera_movil: "Billetera móvil", ahorro: "Cuenta de ahorro", otra: "Otra",
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Cuentas de Dinero</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Efectivo, bancos, billeteras y su saldo actual.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Nueva cuenta</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cuentas.length === 0 && (
          <p className="text-xs text-on-surface-variant col-span-3 text-center py-8">Sin cuentas registradas aún.</p>
        )}
        {cuentas.map((c, i) => {
          const colors = ["bg-emerald-50 border-emerald-200/60", "bg-blue-50 border-blue-200/60", "bg-amber-50 border-amber-200/60", "bg-violet-50 border-violet-200/60"];
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, delay: Math.min(i * 0.07, 0.35), ease: "easeOut" }}
              className={`rounded-2xl border p-5 shadow-2xs ${colors[i % colors.length]}`}
            >
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{TIPO_LABELS[c.tipo] ?? c.tipo}</p>
              <p className="font-heading text-lg font-extrabold text-on-surface mt-1">{c.nombre}</p>
              <p className="font-mono text-2xl font-bold text-primary mt-3">{money(c.saldo)}</p>
              <p className="text-[11px] text-on-surface-variant mt-1">{c.codigo_moneda}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MovimientosView({ movimientos, openModal }: { movimientos: Movimiento[]; openModal: () => void }) {
  const TIPO_LABELS: Record<string, string> = {
    ingreso: "Ingreso", gasto: "Gasto", transferencia_entrada: "Transferencia ↓",
    transferencia_salida: "Transferencia ↑", ajuste: "Ajuste",
    entrega_prestamo: "Préstamo entregado", pago_prestamo: "Cobro de préstamo",
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-on-surface">Movimientos</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Todos los flujos de dinero del espacio.</p>
        </div>
        <button className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container flex items-center gap-2" onClick={openModal}>
          <Plus className="w-4 h-4" /><span>Registrar movimiento</span>
        </button>
      </div>
      <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-sm">
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
              const tipoLabel = m.tipo === "ajuste" && m.ajuste_sentido
                ? `Ajuste (${m.ajuste_sentido})`
                : TIPO_LABELS[m.tipo] ?? m.tipo;
              return (
                <tr key={m.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">{formatDateEs(m.ocurrido_en)}</td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-on-surface-variant">{tipoLabel}</td>
                  <td className="py-3.5 px-4 text-sm font-medium text-on-surface">{m.descripcion ? fixSpanishEncoding(m.descripcion) : "—"}</td>
                  <td className="py-3.5 px-4 text-xs text-on-surface-variant">
                    {(Array.isArray(m.cuentas_dinero)
                      ? (m.cuentas_dinero[0] as unknown as { nombre?: string })?.nombre
                      : (m.cuentas_dinero as unknown as { nombre?: string })?.nombre) ?? "—"}
                  </td>
                  <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${isPositive ? "text-primary" : "text-error"}`}>
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

function ReportesView({ totals, prestamos }: { totals: ReturnType<typeof Object.assign>; prestamos: Prestamo[] }) {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-surface-container-high/60">
        <h1 className="font-heading text-2xl font-extrabold text-on-surface">Reportes</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">Próximamente: exportación PDF, gráficas avanzadas y comparativas.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Capital en cuentas", value: totals.available },
          { label: "Capital prestado pendiente", value: totals.pending },
          { label: "Interés mensual est.", value: totals.interest },
          { label: "Préstamos atrasados", value: totals.lateCount, isMoney: false },
        ].map((item) => (
          <div key={item.label} className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/70 shadow-2xs">
            <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">{item.label}</p>
            <p className="font-mono text-xl font-extrabold text-on-surface mt-2">{item.isMoney === false ? item.value : money(item.value)}</p>
          </div>
        ))}
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
  const [oscuro, setOscuro] = useState(preferencias.modoOscuro);
  const [tasa, setTasa] = useState(preferencias.tasaInteresPredeterminada);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    const error = await guardarPreferencias(color, oscuro, tasa);
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
          <label className="flex items-center justify-between gap-4 rounded-xl border border-surface-container-high p-3 text-sm font-semibold text-on-surface">
            <span>
              Modo oscuro
              <span className="block text-xs font-normal text-on-surface-variant mt-0.5">Reduce el brillo de la interfaz.</span>
            </span>
            <input
              type="checkbox"
              checked={oscuro}
              onChange={(event) => setOscuro(event.target.checked)}
              className="w-5 h-5 accent-primary"
            />
          </label>
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
              className="w-40 h-10 px-3 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-sm"
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
