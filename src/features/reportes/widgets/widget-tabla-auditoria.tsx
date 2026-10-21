"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
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

        {/* Campo de búsqueda y controles de ordenamiento */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-full sm:w-56">
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
        </div>
      </div>

      {/* Responsive Table */}
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
                title="Porcentaje del capital original devuelto (el interés cobrado no reduce el capital)"
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
            {tableRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-on-surface-variant text-xs">
                  No se encontraron registros coincidentes con los filtros actuales.
                </td>
              </tr>
            ) : (
              tableRecords.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-low/40 transition-colors">
                  {/* Contact */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <ContactAvatar name={r.contactoNombre} size={32} className="rounded-full shadow-2xs shrink-0" />
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
              ))
            )}
          </tbody>
          {/* Pie de tabla con totales consolidados */}
          {tableRecords.length > 0 && (
            <tfoot>
              <tr className="bg-surface-container-low font-bold text-on-surface border-t-2 border-surface-container-high">
                <td className="py-3 px-4" colSpan={2}>
                  Total ({tableRecords.length} préstamos)
                </td>
                <td className="py-3 px-4 font-mono">
                  {money(tableRecords.reduce((sum, r) => sum + r.principal, 0))}
                </td>
                <td className="py-3 px-4 font-mono">
                  {money(tableRecords.reduce((sum, r) => sum + r.pagado, 0))}
                </td>
                <td className="py-3 px-4 font-mono text-primary">
                  {money(tableRecords.reduce((sum, r) => sum + r.saldo, 0))}
                </td>
                <td className="py-3 px-4 font-mono" colSpan={3}>
                  —
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
