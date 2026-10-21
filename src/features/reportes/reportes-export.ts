import * as XLSX from "xlsx";
import { sanitizeSpreadsheetCell } from "@/lib/security";
import { rel, loanBalance, monthlyInterest, type Prestamo, type Pago, type Cuenta, type Movimiento } from "@/lib/dashboard-context";

export interface ReportMetricsExport {
  totalIngresos: number;
  totalIngresosDirectos: number;
  totalGastos: number;
  resultadoNeto: number;
  totalLiquidez: number;
  totalCapitalColocado: number;
  totalCapitalPagado: number;
  totalSaldoPendiente: number;
  recoveryRate: number;
  totalInteresCobrado: number;
  interesMensualEstimado: number;
  capitalEnMora: number;
  moraRate: number;
  deudoresUnicos: number;
}

export interface TableRecordExport {
  contactoNombre: string;
  nombre: string;
  principal: number;
  pagado: number;
  saldo: number;
  pct: number;
  estado: string;
  fechaInicio: string;
}

export function exportarExcel({
  metrics,
  filteredPrestamos,
  filteredPagos,
  cuentas,
  filteredMovimientos,
  onSuccess,
  onError,
}: {
  metrics: ReportMetricsExport;
  filteredPrestamos: Prestamo[];
  filteredPagos: Pago[];
  cuentas: Cuenta[];
  filteredMovimientos: Movimiento[];
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}) {
  try {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen de KPIs Ejecutivos
    const summaryData = [
      { "Métrica Clave": "Ingresos Totales Percibidos", "Valor": metrics.totalIngresos, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Ingresos Directos Registrados", "Valor": metrics.totalIngresosDirectos, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Gastos Registrados en Bitácora", "Valor": metrics.totalGastos, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Resultado Neto (Superávit / Déficit)", "Valor": metrics.resultadoNeto, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Liquidez Total Disponible", "Valor": metrics.totalLiquidez, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Cartera Total Colocada", "Valor": metrics.totalCapitalColocado, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Capital Devuelto / Pagado", "Valor": metrics.totalCapitalPagado, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Saldo Pendiente por Cobrar", "Valor": metrics.totalSaldoPendiente, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Porcentaje de Capital Devuelto", "Valor": `${metrics.recoveryRate.toFixed(2)}%`, "Unidad / Formato": "Porcentaje" },
      { "Métrica Clave": "Interés Real Percibido", "Valor": metrics.totalInteresCobrado, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Interés Estimado Mensual Activo", "Valor": metrics.interesMensualEstimado, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Cartera en Mora", "Valor": metrics.capitalEnMora, "Unidad / Formato": "BOB" },
      { "Métrica Clave": "Tasa de Mora sobre Cartera", "Valor": `${metrics.moraRate.toFixed(2)}%`, "Unidad / Formato": "Porcentaje" },
      { "Métrica Clave": "Deudores Únicos con Cartera", "Valor": metrics.deudoresUnicos, "Unidad / Formato": "Cantidad" },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Ejecutivo");

    // Hoja 2: Cartera de Préstamos
    const loansData = filteredPrestamos.map((p) => {
      const contactObj = rel(p.contactos);
      const balance = loanBalance(p);
      const principal = Number(p.monto_principal || 0);
      const pagado = Number(p.monto_capital_pagado || 0);
      return {
        "ID Préstamo": sanitizeSpreadsheetCell(p.id),
        "Deudor / Contacto": sanitizeSpreadsheetCell(contactObj?.nombre || "Sin contacto"),
        "Concepto / Préstamo": sanitizeSpreadsheetCell(p.nombre),
        "Capital Prestado (Bs)": principal,
        "Capital Pagado (Bs)": pagado,
        "Saldo Pendiente (Bs)": balance,
        "% Pagado": `${principal > 0 ? ((pagado / principal) * 100).toFixed(1) : 0}%`,
        "Cobra Interés": p.cobra_interes ? "Sí" : "No",
        "Tasa Mensual (%)": Number(p.tasa_interes_mensual || 0),
        "Interés Mensual Est. (Bs)": monthlyInterest(p),
        "Estado": p.estado,
        "Día Cobro": p.dia_pago || "—",
        "Fecha Inicio": p.fecha_inicio || p.created_at,
        "Notas": sanitizeSpreadsheetCell(p.notas || ""),
      };
    });
    const wsLoans = XLSX.utils.json_to_sheet(loansData);
    XLSX.utils.book_append_sheet(wb, wsLoans, "Cartera de Préstamos");

    // Hoja 3: Historial de Cobros
    const paymentsData = filteredPagos.map((pg) => {
      const prestamoObj = rel(pg.prestamos);
      const contactObj = prestamoObj ? rel(prestamoObj.contactos) : null;
      return {
        "ID Cobro": sanitizeSpreadsheetCell(pg.id),
        "Fecha Recibido": pg.recibido_en,
        "Fecha Esperada": pg.fecha_esperada || "",
        "Deudor": sanitizeSpreadsheetCell(contactObj?.nombre || "—"),
        "Préstamo": sanitizeSpreadsheetCell(prestamoObj?.nombre || "—"),
        "Total Cobrado (Bs)": Number(pg.monto_total || 0),
        "Capital (Bs)": Number(pg.monto_principal || 0),
        "Interés (Bs)": Number(pg.monto_interes || 0),
        "Método de Pago": sanitizeSpreadsheetCell(pg.metodo_pago || "Efectivo"),
        "Notas": sanitizeSpreadsheetCell(pg.notas || ""),
      };
    });
    const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, wsPayments, "Historial de Cobros");

    // Hoja 4: Cuentas y Liquidez
    const accountsData = cuentas.map((c) => ({
      "Cuenta": sanitizeSpreadsheetCell(c.nombre),
      "Tipo": sanitizeSpreadsheetCell(c.tipo),
      "Saldo Actual (Bs)": Number(c.saldo || 0),
      "Moneda": c.codigo_moneda,
      "Activa": c.es_activa ? "Sí" : "No",
    }));
    const wsAccounts = XLSX.utils.json_to_sheet(accountsData);
    XLSX.utils.book_append_sheet(wb, wsAccounts, "Cuentas y Liquidez");

    // Hoja 5: Movimientos y Flujo de Caja
    const movementsData = filteredMovimientos.map((m) => {
      const cuentaObj = rel(m.cuentas_dinero);
      const catObj = rel(m.categorias);
      return {
        "ID Movimiento": sanitizeSpreadsheetCell(m.id),
        "Fecha": m.ocurrido_en || m.created_at,
        "Tipo": sanitizeSpreadsheetCell(m.tipo),
        "Sentido Ajuste": sanitizeSpreadsheetCell(m.ajuste_sentido || "—"),
        "Monto (Bs)": Number(m.monto || 0),
        "Cuenta": sanitizeSpreadsheetCell(cuentaObj?.nombre || "—"),
        "Categoría": sanitizeSpreadsheetCell(catObj?.nombre || "Sin categoría"),
        "Descripción": sanitizeSpreadsheetCell(m.descripcion || ""),
      };
    });
    const wsMovements = XLSX.utils.json_to_sheet(movementsData);
    XLSX.utils.book_append_sheet(wb, wsMovements, "Bitácora de Movimientos");

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `FinPal_Reporte_BI_${todayStr}.xlsx`);
    onSuccess?.("Reporte Excel descargado correctamente.");
  } catch (err) {
    console.error("Error al exportar Excel:", err);
    onError?.("No se pudo generar el archivo Excel.");
  }
}

export function exportarCsv({
  tableRecords,
  onSuccess,
  onError,
}: {
  tableRecords: TableRecordExport[];
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}) {
  try {
    const headers = [
      "Contacto",
      "Prestamo",
      "Capital_Prestado",
      "Capital_Pagado",
      "Saldo_Pendiente",
      "Porcentaje_Pagado",
      "Estado",
      "Fecha_Inicio",
    ];
    const rows = tableRecords.map((r) => [
      `"${String(sanitizeSpreadsheetCell(r.contactoNombre)).replace(/"/g, '""')}"`,
      `"${String(sanitizeSpreadsheetCell(r.nombre)).replace(/"/g, '""')}"`,
      r.principal,
      r.pagado,
      r.saldo,
      `${r.pct}%`,
      r.estado,
      r.fechaInicio,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinPal_Resumen_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess?.("Archivo CSV descargado correctamente.");
  } catch (err) {
    console.error("Error exportando CSV:", err);
    onError?.("No se pudo exportar el archivo CSV.");
  }
}
