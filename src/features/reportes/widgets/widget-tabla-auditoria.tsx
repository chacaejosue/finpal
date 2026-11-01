"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { motion } from "motion/react";
import { money, rel, loanBalance, monthlyInterest, type Prestamo, type Contacto } from "@/lib/dashboard-context";
import { ContactAvatar } from "@/components/contact-avatar";
import { formatDateEs } from "@/lib/format-date";

export interface WidgetTablaAuditoriaProps {
  prestamos: Prestamo[];
  contactos: Contacto[];
}

export function WidgetTablaAuditoria({ prestamos, contactos }: WidgetTablaAuditoriaProps) {
  const [searchTable, setSearchTable] = useState<string>("");
  const [sortField, setSortField] = useState<"saldo" | "capital" | "fecha" | "pct">("saldo");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">(() => {
    if (typeof window === "undefined") return "cards";
    try {
      return (localStorage.getItem("finpal_audit_view_mode") as "cards" | "table") || "cards";
    } catch {
      return "cards";
    }
  });

  const contactMap = useMemo(() => new Map(contactos.map((c) => [c.id, c])), [contactos]);

  const tableRecords = useMemo(() => {
    let result = prestamos.map((p) => {
      const contactObj = rel(p.contactos);
      const fullContact = contactObj?.id ? contactMap.get(contactObj.id) : null;
      const balance = loanBalance(p);
      const principal = Number(p.monto_principal || 0);
      const pagado = Number(p.monto_capital_pagado || 0);
      const pct = principal > 0 ? Math.min(100, (pagado / principal) * 100) : 0;
      const estInteres = monthlyInterest(p);

      return {
        id: p.id,
        nombre: p.nombre,
        contactoNombre: contactObj?.nombre || "Sin contacto",
        contactoEmail: fullContact?.email || "",
        principal,
        pagado,
        saldo: balance,
        pct: Number(pct.toFixed(1)),
        estInteres,
        tasa: Number(p.tasa_interes_mensual || 0),
        cobraInteres: Boolean(p.cobra_interes),
        estado: p.estado,
        fechaInicio: p.fecha_inicio || p.created_at,
        diaPago: p.dia_pago,
      };
    });

    // Búsqueda por texto
    if (searchTable.trim()) {
      const q = searchTable.toLowerCase();
      result = result.filter(
        (r) =>
          r.contactoNombre.toLowerCase().includes(q) ||
          r.nombre.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let diff = 0;
      if (sortField === "saldo") diff = a.saldo - b.saldo;
      if (sortField === "capital") diff = a.principal - b.principal;
      if (sortField === "pct") diff = a.pct - b.pct;
      if (sortField === "fecha") diff = new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
      return sortAsc ? diff : -diff;
    });

    return result;
  }, [prestamos, searchTable, sortField, sortAsc, contactMap]);

  const totalPrincipal = useMemo(() => tableRecords.reduce((sum, r) => sum + r.principal, 0), [tableRecords]);
  const totalPagado = useMemo(() => tableRecords.reduce((sum, r) => sum + r.pagado, 0), [tableRecords]);
  const totalSaldo = useMemo(() => tableRecords.reduce((sum, r) => sum + r.saldo, 0), [tableRecords]);
  const pctGlobal = totalPrincipal > 0 ? Math.round((totalPagado / totalPrincipal) * 100) : 0;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 shadow-2xs overflow-hidden min-w-0">
      {/* Barra de herramientas de la tabla */}
      <div className="p-4 border-b border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-bold text-on-surface truncate">
            Matriz Detallada de Cartera
          </h2>
          <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
            Explora cada crédito, tasa, progreso de pago y vencimientos asociados.
          </p>
        </div>

        {/* Campo de búsqueda y controles de ordenamiento y visualización */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Buscar deudor o crédito..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface text-xs font-medium border border-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSortAsc(!sortAsc);
            }}
            className="p-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
            title="Cambiar orden ascendente/descendente"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode("cards");
                try {
                  localStorage.setItem("finpal_audit_view_mode", "cards");
                } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista en tarjetas analíticas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("table");
                try {
                  localStorage.setItem("finpal_audit_view_mode", "table");
                } catch {}
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Vista en tabla de auditoría"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {tableRecords.length === 0 ? (
        <div className="py-12 text-center text-on-surface-variant text-xs">
          No se encontraron registros coincidentes con los filtros actuales.
        </div>
      ) : viewMode === "cards" ? (
        /* VISTA 1: Tarjetas Analíticas Responsive */
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {tableRecords.map((r, i) => {
              const isPaid = r.estado === "pagado" || r.saldo <= 0.01;
              const isLate = r.estado === "atrasado";

              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                  className="p-4 rounded-2xl bg-surface-container-low/40 hover:bg-surface-container-low/80 border border-surface-container-high/60 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    {/* Header: Contacto y Estado */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ContactAvatar
                          name={r.contactoNombre}
                          size={34}
                          className="rounded-full shadow-2xs shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-on-surface truncate leading-tight">
                            {r.contactoNombre}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant truncate">{r.nombre}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          isPaid ? "badge-saldado" : isLate ? "badge-atrasado" : "badge-al-dia"
                        }`}
                      >
                        {isPaid ? "Saldado" : isLate ? "Atrasado" : "Al día"}
                      </span>
                    </div>

                    {/* Barra de progreso de amortización */}
                    <div className="space-y-1 mb-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-on-surface-variant">Devolución de capital</span>
                        <span className="font-mono font-bold text-on-surface">{r.pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isPaid ? "bg-teal-500" : isLate ? "bg-amber-500" : "bg-primary"
                          }`}
                          style={{ width: `${r.pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Desglose de importes */}
                    <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-surface-container-lowest border border-surface-container-high/40 text-[11px]">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-on-surface-variant block">
                          Saldo por cobrar
                        </span>
                        <span className="font-mono font-extrabold text-xs text-on-surface block">
                          {money(r.saldo)}
                        </span>
                        <span className="text-[9px] text-on-surface-variant/80 block">
                          de {money(r.principal)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-semibold text-on-surface-variant block">
                          Tasa / Mes
                        </span>
                        <span className="font-semibold text-xs text-primary block">
                          {r.cobraInteres ? `+${r.tasa}% mensual` : "Sin interés"}
                        </span>
                        <span className="text-[9px] text-on-surface-variant/80 block">
                          Inicio: {formatDateEs(r.fechaInicio)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Resumen Global de Cartera */}
          <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="font-bold text-on-surface">
              Total consolidado: <strong className="text-primary font-mono">{tableRecords.length}</strong> créditos analizados ({pctGlobal}% devuelto)
            </span>
            <div className="flex items-center gap-4 font-mono font-bold text-[11px] sm:text-xs">
              <span className="text-on-surface-variant">Capital: {money(totalPrincipal)}</span>
              <span className="text-teal-600 dark:text-teal-400">Pagado: {money(totalPagado)}</span>
              <span className="text-primary font-extrabold">Saldo: {money(totalSaldo)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA 2: Tabla de Auditoría Tradicional */
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-container-high/60 bg-surface-container-low/50">
                <th className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                  Deudor / Contacto
                </th>
                <th className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                  Concepto
                </th>
                <th
                  onClick={() => {
                    setSortField("capital");
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px] cursor-pointer hover:text-primary transition-colors"
                >
                  Capital Inicial
                </th>
                <th className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                  Capital Pagado
                </th>
                <th
                  onClick={() => {
                    setSortField("saldo");
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px] cursor-pointer hover:text-primary transition-colors"
                >
                  Saldo Pendiente
                </th>
                <th
                  onClick={() => {
                    setSortField("pct");
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px] cursor-pointer hover:text-primary transition-colors"
                  title="Porcentaje del capital original devuelto"
                >
                  % Capital Devuelto
                </th>
                <th className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                  Tasa Mensual
                </th>
                <th className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px] text-right">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {tableRecords.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-low/40 transition-colors">
                  {/* Contact */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <ContactAvatar
                        name={r.contactoNombre}
                        size={32}
                        className="rounded-full shadow-2xs shrink-0"
                      />
                      <div>
                        <span className="font-bold text-on-surface block leading-tight">
                          {r.contactoNombre}
                        </span>
                        {r.contactoEmail && (
                          <span className="text-[10px] text-on-surface-variant block mt-0.5">
                            {r.contactoEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Concept */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-on-surface">{r.nombre}</span>
                    <span className="text-[10px] text-on-surface-variant block mt-0.5">
                      Inicio: {formatDateEs(r.fechaInicio)}
                    </span>
                  </td>

                  {/* Principal */}
                  <td className="py-3 px-4 font-mono font-bold text-on-surface whitespace-nowrap">
                    {money(r.principal)}
                  </td>

                  {/* Pagado */}
                  <td className="py-3 px-4 font-mono text-on-surface font-semibold whitespace-nowrap">
                    {money(r.pagado)}
                  </td>

                  {/* Saldo */}
                  <td className="py-3 px-4 font-mono font-extrabold text-on-surface whitespace-nowrap">
                    {money(r.saldo)}
                  </td>

                  {/* % Capital Devuelto / Amortización */}
                  <td className="py-3 px-4">
                    {r.pct >= 100 ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
                          </div>
                          <span className="font-mono text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                            100%
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Totalmente saldado
                        </span>
                      </div>
                    ) : r.pct > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${r.pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-primary">
                            {r.pct.toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant">
                          {money(r.pagado)} devuelto
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-primary/20 rounded-full" style={{ width: "0%" }} />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-on-surface-variant">
                            0%
                          </span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/80">
                          {r.cobraInteres ? "Solo paga interés" : "Sin abonos de capital"}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Tasa */}
                  <td className="py-3 px-4">
                    {r.cobraInteres ? (
                      <span className="font-mono font-semibold text-primary">
                        {r.tasa}% / mes
                      </span>
                    ) : (
                      <span className="text-on-surface-variant text-[11px]">Sin interés</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="py-3 px-4 text-right">
                    {r.estado === "pagado" || r.saldo <= 0.01 ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-saldado inline-flex items-center">
                        Saldado
                      </span>
                    ) : r.estado === "atrasado" ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-atrasado inline-flex items-center">
                        Atrasado
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold badge-al-dia inline-flex items-center">
                        Al día
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Pie de tabla con totales consolidados */}
            {tableRecords.length > 0 && (
              <tfoot>
                <tr className="bg-surface-container-low font-bold text-on-surface border-t-2 border-surface-container-high">
                  <td className="py-3 px-4" colSpan={2}>
                    Total ({tableRecords.length} préstamos)
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {money(totalPrincipal)}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {money(totalPagado)}
                  </td>
                  <td className="py-3 px-4 font-mono text-primary">
                    {money(totalSaldo)}
                  </td>
                  <td className="py-3 px-4 font-mono" colSpan={3}>
                    —
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}
