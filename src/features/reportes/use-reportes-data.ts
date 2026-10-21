"use client";

import { useState, useMemo, useCallback } from "react";
import {
  rel,
  loanBalance,
  monthlyInterest,
  type Prestamo,
  type Pago,
  type Cuenta,
  type Movimiento,
  type Contacto,
} from "@/lib/dashboard-context";
import type { PeriodoFilter, EstadoFilter, ChartType } from "./types";
import type { TopDebtorItem } from "./widgets/widget-top-deudores";
import type { PortfolioHealthItem } from "./widgets/widget-chart-salud";
import type { AccountLiquidityItem } from "./widgets/widget-liquidez-cuentas";

export interface UseReportesDataProps {
  prestamos: Prestamo[];
  pagos: Pago[];
  cuentas: Cuenta[];
  movimientos: Movimiento[];
  contactos: Contacto[];
}

export function parseLocalDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date(0);
  if (dateStr.length === 10 && dateStr.includes("-")) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

export function useReportesData({
  prestamos,
  pagos,
  cuentas,
  movimientos,
  contactos,
}: UseReportesDataProps) {
  // Estados de filtros analíticos
  const [periodo, setPeriodo] = useState<PeriodoFilter>("todo");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [contactoFilter, setContactoFilter] = useState<string>("todos");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [tipoProyeccion, setTipoProyeccion] = useState<"mes" | "semestre">("mes");
  const [proyeccionMesOffset, setProyeccionMesOffset] = useState<number>(0);

  // Determinar límites de fechas activas en hora local
  const dateThreshold = useMemo(() => {
    if (periodo === "todo") return null;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (periodo === "30d") {
      d.setDate(d.getDate() - 30);
    } else if (periodo === "90d") {
      d.setDate(d.getDate() - 90);
    } else if (periodo === "anio") {
      d.setMonth(0, 1);
    }
    return d;
  }, [periodo]);

  // 1. Filtered Prestamos
  const filteredPrestamos = useMemo(() => {
    return prestamos.filter((p) => {
      // Filtro por contacto
      const contactObj = rel(p.contactos);
      if (contactoFilter !== "todos" && contactObj?.id !== contactoFilter) {
        return false;
      }

      // Estado filter
      const isSaldado = p.estado === "pagado" || loanBalance(p) <= 0.01;
      const isAtrasado = p.estado === "atrasado";
      const isAlDia = !isSaldado && !isAtrasado && p.estado !== "cancelado";

      if (estadoFilter === "al_dia" && !isAlDia) return false;
      if (estadoFilter === "atrasado" && !isAtrasado) return false;
      if (estadoFilter === "saldado" && !isSaldado) return false;

      // Filtro por período (por fecha_inicio o created_at)
      if (dateThreshold) {
        const itemDate = parseLocalDate(p.fecha_inicio || p.created_at);
        if (itemDate < dateThreshold) return false;
      }

      return true;
    });
  }, [prestamos, contactoFilter, estadoFilter, dateThreshold]);

  // 2. Filtered Pagos
  const filteredPagos = useMemo(() => {
    return pagos.filter((pago) => {
      // Filtro por período
      if (dateThreshold) {
        const pDate = parseLocalDate(pago.recibido_en || pago.created_at);
        if (pDate < dateThreshold) return false;
      }

      // Filtro por contacto
      const prestamoRel = rel(pago.prestamos);
      const contactRel = prestamoRel ? rel(prestamoRel.contactos) : null;
      if (contactoFilter !== "todos" && contactRel?.id !== contactoFilter) {
        return false;
      }

      return true;
    });
  }, [pagos, dateThreshold, contactoFilter]);

  // 3. Filtered Movimientos (para Ingresos y Gastos del período seleccionado)
  const filteredMovimientos = useMemo(() => {
    return (movimientos || []).filter((m) => {
      // Filtro por período
      if (dateThreshold) {
        const mDate = parseLocalDate(m.ocurrido_en || m.created_at);
        if (mDate < dateThreshold) return false;
      }
      return true;
    });
  }, [movimientos, dateThreshold]);

  // ─── Agregaciones de KPIs Ejecutivos ───────────────────────────────────────
  const metrics = useMemo(() => {
    const gastosMovimientos = filteredMovimientos.filter(
      (m) =>
        m.tipo === "gasto" ||
        m.tipo === "transferencia_salida" ||
        (m.tipo === "ajuste" && m.ajuste_sentido === "restar")
    );
    const totalGastos = gastosMovimientos.reduce(
      (sum, m) => sum + Number(m.monto || 0),
      0
    );
    const gastosCount = gastosMovimientos.length;

    const ingresosDirectosMov = filteredMovimientos.filter(
      (m) =>
        m.tipo === "ingreso" ||
        (m.tipo === "ajuste" && m.ajuste_sentido === "sumar")
    );
    const totalIngresosDirectos = ingresosDirectosMov.reduce(
      (sum, m) => sum + Number(m.monto || 0),
      0
    );
    const ingresosDirectosCount = ingresosDirectosMov.length;

    // Real interest collected to date in scope
    const totalInteresCobrado = filteredPagos.reduce(
      (sum, p) => sum + Number(p.monto_interes || 0),
      0
    );

    // Ingresos Totales = Ingresos directos + Intereses reales ganados en préstamos
    const totalIngresos = totalIngresosDirectos + totalInteresCobrado;

    // Resultado / Margen Neto Operativo
    const resultadoNeto = totalIngresos - totalGastos;

    // Métricas de Cartera Crediticia
    const totalCapitalColocado = filteredPrestamos.reduce(
      (sum, p) => sum + Number(p.monto_principal || 0),
      0
    );

    const totalCapitalPagado = filteredPrestamos.reduce(
      (sum, p) => sum + Number(p.monto_capital_pagado || 0),
      0
    );

    const totalSaldoPendiente = filteredPrestamos.reduce(
      (sum, p) => sum + loanBalance(p),
      0
    );

    const recoveryRate =
      totalCapitalColocado > 0
        ? (totalCapitalPagado / totalCapitalColocado) * 100
        : 0;

    const interesMensualEstimado = filteredPrestamos
      .filter((p) => p.estado === "activo" || p.estado === "atrasado")
      .reduce((sum, p) => sum + monthlyInterest(p), 0);

    const prestamosMora = filteredPrestamos.filter((p) => p.estado === "atrasado");
    const capitalEnMora = prestamosMora.reduce((sum, p) => sum + loanBalance(p), 0);
    const moraRate =
      totalSaldoPendiente > 0 ? (capitalEnMora / totalSaldoPendiente) * 100 : 0;

    const totalLiquidez = cuentas
      .filter((c) => c.es_activa)
      .reduce((sum, c) => sum + Number(c.saldo || 0), 0);

    const activeAccountsCount = cuentas.filter((c) => c.es_activa && Number(c.saldo || 0) > 0).length;

    const deudoresUnicos = new Set(
      filteredPrestamos
        .map((p) => rel(p.contactos)?.id)
        .filter(Boolean)
    ).size;

    return {
      totalIngresos,
      totalIngresosDirectos,
      ingresosDirectosCount,
      totalGastos,
      gastosCount,
      resultadoNeto,
      totalCapitalColocado,
      totalCapitalPagado,
      totalSaldoPendiente,
      recoveryRate,
      totalInteresCobrado,
      interesMensualEstimado,
      capitalEnMora,
      moraCount: prestamosMora.length,
      moraRate,
      totalLiquidez,
      activeAccountsCount,
      deudoresUnicos,
    };
  }, [filteredPrestamos, filteredPagos, cuentas, filteredMovimientos]);

  // ─── Proyección de Flujo Neto Dinámica por Mes ────────────────────────────
  const targetDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + proyeccionMesOffset, 1);
  }, [proyeccionMesOffset]);

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  const mesActualNombre = useMemo(() => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return meses[targetMonth];
  }, [targetMonth]);

  const flujoNetoData = useMemo(() => {
    const isCurrentMonth = proyeccionMesOffset === 0;

    const pagosMes = filteredPagos.filter((p) => {
      const d = parseLocalDate(p.recibido_en || p.created_at);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const capitalCobradoMes = pagosMes.reduce((sum, p) => sum + Number(p.monto_principal || 0), 0);
    const interesCobradoMes = pagosMes.reduce((sum, p) => sum + Number(p.monto_interes || 0), 0);

    const interesProyectado = proyeccionMesOffset >= 0
      ? (metrics.interesMensualEstimado > 0 ? metrics.interesMensualEstimado : interesCobradoMes)
      : interesCobradoMes;

    const capitalDevuelto = capitalCobradoMes;
    const totalFlujoEsperado = capitalDevuelto + interesProyectado;

    return {
      totalFlujoEsperado,
      capitalDevuelto,
      interesProyectado,
      capitalCobradoMes,
      interesCobradoMes,
      isCurrentMonth,
    };
  }, [filteredPagos, metrics, targetMonth, targetYear, proyeccionMesOffset]);

  // Desglose día a día
  const timelineProyeccionMes = useMemo(() => {
    const now = new Date();
    const isCurrentMonth = proyeccionMesOffset === 0;
    const isFutureMonth = proyeccionMesOffset > 0;
    const curDay = now.getDate();
    const totalDiasMes = new Date(targetYear, targetMonth + 1, 0).getDate();

    const pagosMes = filteredPagos.filter((p) => {
      const d = parseLocalDate(p.recibido_en || p.created_at);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const cobrosPorDia = new Map<number, { capital: number; interes: number; total: number }>();
    for (const p of pagosMes) {
      const d = parseLocalDate(p.recibido_en || p.created_at);
      const dia = d.getDate();
      const prev = cobrosPorDia.get(dia) || { capital: 0, interes: 0, total: 0 };
      prev.capital += Number(p.monto_principal || 0);
      prev.interes += Number(p.monto_interes || 0);
      prev.total += Number(p.monto_total || (Number(p.monto_principal || 0) + Number(p.monto_interes || 0)));
      cobrosPorDia.set(dia, prev);
    }

    const prestamosActivos = filteredPrestamos.filter(
      (p) => p.estado === "activo" || p.estado === "atrasado"
    );

    const programadosPorDia = new Map<
      number,
      {
        interes: number;
        detalles: Array<{ nombre: string; deudor: string; monto: number }>;
      }
    >();

    for (const p of prestamosActivos) {
      const dia = Math.min(totalDiasMes, Math.max(1, Number(p.dia_pago) || 15));
      const estInteres = monthlyInterest(p);
      const deudor = rel(p.contactos)?.nombre || "Sin deudor";
      const prev = programadosPorDia.get(dia) || { interes: 0, detalles: [] };
      prev.interes += estInteres;
      prev.detalles.push({
        nombre: p.nombre,
        deudor,
        monto: estInteres,
      });
      programadosPorDia.set(dia, prev);
    }

    let acumulador = 0;
    const dias = [];

    for (let d = 1; d <= totalDiasMes; d++) {
      const cobroReal = cobrosPorDia.get(d)?.total || 0;
      const prog = programadosPorDia.get(d);
      const interesProg = prog?.interes || 0;

      let flujoDia = 0;
      if (isCurrentMonth) {
        flujoDia = d <= curDay ? cobroReal : interesProg;
      } else if (isFutureMonth) {
        flujoDia = interesProg;
      } else {
        flujoDia = cobroReal;
      }

      acumulador += flujoDia;

      dias.push({
        dia: d,
        diaLabel: `Día ${d}`,
        flujoDia: Number(flujoDia.toFixed(2)),
        acumulado: Number(acumulador.toFixed(2)),
        cobrado: Number(cobroReal.toFixed(2)),
        programado: Number(interesProg.toFixed(2)),
        esHoy: isCurrentMonth && d === curDay,
        esPasado: isCurrentMonth ? d < curDay : !isFutureMonth,
        esFuturo: isCurrentMonth ? d > curDay : isFutureMonth,
        detalles: prog?.detalles || [],
      });
    }

    return dias;
  }, [filteredPagos, filteredPrestamos, targetYear, targetMonth, proyeccionMesOffset]);

  // Proyección a 6 meses
  const proyeccionSemestral = useMemo(() => {
    const meses = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    const items = [];
    const now = new Date();

    for (let i = 0; i < 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthIndex = futureDate.getMonth();
      const year = futureDate.getFullYear();
      const label = `${meses[monthIndex]} ${year}`;

      const interes = Number(metrics.interesMensualEstimado.toFixed(2));
      const capital = i === 0 ? Number(flujoNetoData.capitalDevuelto.toFixed(2)) : 0;
      const total = Number((interes + capital).toFixed(2));

      items.push({
        periodo: label,
        mesNombre: meses[monthIndex],
        interes,
        capital,
        total,
        esActual: i === 0,
      });
    }

    return items;
  }, [metrics.interesMensualEstimado, flujoNetoData.capitalDevuelto]);

  // ─── Datos de Gráfico 1: Flujo Temporal de Cobros ──────────────────────────
  const cobrosMensuales = useMemo(() => {
    const map = new Map<string, { capital: number; interes: number; total: number; sortKey: string }>();

    for (const pago of filteredPagos) {
      const dateStr = pago.recibido_en || pago.created_at;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const year = d.getFullYear();
      const month = d.getMonth();
      const sortKey = `${year}-${String(month + 1).padStart(2, "0")}`;

      const monthNames = [
        "Ene", "Feb", "Mar", "Abr", "May", "Jun",
        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
      ];
      const label = `${monthNames[month]} ${year}`;

      const curr = map.get(label) || { capital: 0, interes: 0, total: 0, sortKey };
      curr.capital += Number(pago.monto_principal || 0);
      curr.interes += Number(pago.monto_interes || 0);
      curr.total += Number(pago.monto_total || 0);
      map.set(label, curr);
    }

    const items = Array.from(map.entries()).map(([periodo, val]) => ({
      periodo,
      capital: Number(val.capital.toFixed(2)),
      interes: Number(val.interes.toFixed(2)),
      total: Number(val.total.toFixed(2)),
      sortKey: val.sortKey,
    }));

    items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    if (items.length === 0) {
      return [
        { periodo: "Sin datos", capital: 0, interes: 0, total: 0, sortKey: "0" },
      ];
    }

    return items;
  }, [filteredPagos]);

  // ─── Datos de Gráfico 2: Composición y Salud de la Cartera (Dona) ──────────
  const portfolioHealth = useMemo<PortfolioHealthItem[]>(() => {
    let alDiaAmount = 0;
    let alDiaCount = 0;
    let moraAmount = 0;
    let moraCount = 0;
    let saldadoAmount = 0;
    let saldadoCount = 0;

    for (const p of filteredPrestamos) {
      const balance = loanBalance(p);
      const isSaldado = p.estado === "pagado" || balance <= 0.01;
      const isMora = p.estado === "atrasado";

      if (isSaldado) {
        saldadoAmount += Number(p.monto_principal);
        saldadoCount += 1;
      } else if (isMora) {
        moraAmount += balance;
        moraCount += 1;
      } else {
        alDiaAmount += balance;
        alDiaCount += 1;
      }
    }

    const total = alDiaAmount + moraAmount + saldadoAmount;

    return [
      {
        name: "Al día",
        value: Number(alDiaAmount.toFixed(2)),
        count: alDiaCount,
        color: "#059669",
        pct: total > 0 ? (alDiaAmount / total) * 100 : 0,
      },
      {
        name: "En mora",
        value: Number(moraAmount.toFixed(2)),
        count: moraCount,
        color: "#f43f5e",
        pct: total > 0 ? (moraAmount / total) * 100 : 0,
      },
      {
        name: "Saldados",
        value: Number(saldadoAmount.toFixed(2)),
        count: saldadoCount,
        color: "#3b82f6",
        pct: total > 0 ? (saldadoAmount / total) * 100 : 0,
      },
    ].filter((item) => item.value > 0 || item.count > 0);
  }, [filteredPrestamos]);

  // ─── Datos de Gráfico 3: Principales Deudores por Saldo (Barras) ────────────
  const topDebtors = useMemo<TopDebtorItem[]>(() => {
    const map = new Map<
      string,
      {
        id: string;
        nombre: string;
        saldo: number;
        capital: number;
        prestamos: number;
        fechaMasAntigua: string;
        diasAtrasoMax: number;
      }
    >();

    for (const p of filteredPrestamos) {
      const contactObj = rel(p.contactos);
      const name = contactObj?.nombre || "Sin deudor asignado";
      const id = contactObj?.id || name;
      const balance = loanBalance(p);
      const fechaPrestamo = p.fecha_inicio || p.created_at || "";
      const diasAtraso = Number(p.dias_atraso) || 0;

      const curr = map.get(id) || {
        id,
        nombre: name,
        saldo: 0,
        capital: 0,
        prestamos: 0,
        fechaMasAntigua: fechaPrestamo,
        diasAtrasoMax: 0,
      };

      curr.saldo += balance;
      curr.capital += Number(p.monto_principal || 0);
      curr.prestamos += 1;

      if (fechaPrestamo && (!curr.fechaMasAntigua || fechaPrestamo < curr.fechaMasAntigua)) {
        curr.fechaMasAntigua = fechaPrestamo;
      }
      if (diasAtraso > curr.diasAtrasoMax) {
        curr.diasAtrasoMax = diasAtraso;
      }

      map.set(id, curr);
    }

    return Array.from(map.values())
      .filter((d) => d.saldo > 0)
      .sort((a, b) => {
        const diffSaldo = b.saldo - a.saldo;
        if (Math.abs(diffSaldo) > 0.001) return diffSaldo;
        if (b.diasAtrasoMax !== a.diasAtrasoMax) return b.diasAtrasoMax - a.diasAtrasoMax;
        if (a.fechaMasAntigua && b.fechaMasAntigua && a.fechaMasAntigua !== b.fechaMasAntigua) {
          return a.fechaMasAntigua.localeCompare(b.fechaMasAntigua);
        }
        return a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });
      })
      .slice(0, 5)
      .map((d) => ({
        ...d,
        nombreCorto: d.nombre.length > 16 ? d.nombre.slice(0, 15) + "…" : d.nombre,
      }));
  }, [filteredPrestamos]);

  // ─── Paleta y Generador Dinámico de Colores para Cuentas Financieras ───────
  const PALETA_CUENTAS = useMemo(
    () => [
      "#006948",
      "#0284c7",
      "#7c3aed",
      "#f59e0b",
      "#0d9488",
      "#e11d48",
      "#4f46e5",
      "#ea580c",
      "#0891b2",
      "#65a30d",
      "#c026d3",
      "#059669",
      "#9333ea",
      "#d97706",
      "#2563eb",
      "#db2777",
    ],
    []
  );

  const getAccountColor = useCallback(
    (index: number): string => {
      if (index < PALETA_CUENTAS.length) {
        return PALETA_CUENTAS[index];
      }
      const hue = Math.round((index * 137.508) % 360);
      return `hsl(${hue}, 70%, 45%)`;
    },
    [PALETA_CUENTAS]
  );

  // ─── Datos de Gráfico 4: Distribución de Liquidez por Cuenta ───────────────
  const liquidityByAccount = useMemo<AccountLiquidityItem[]>(() => {
    return cuentas
      .filter((c) => c.es_activa)
      .map((c) => ({
        id: c.id,
        nombre: c.nombre,
        nombreCorto: c.nombre.length > 14 ? c.nombre.slice(0, 13) + "…" : c.nombre,
        saldo: Math.max(0, Number(c.saldo || 0)),
        tipo: c.tipo,
      }))
      .sort((a, b) => b.saldo - a.saldo)
      .map((c, index) => ({
        ...c,
        color: getAccountColor(index),
      }));
  }, [cuentas, getAccountColor]);

  // Mapeo de contactos para búsquedas rápidas
  const contactMap = useMemo(() => new Map(contactos.map((c) => [c.id, c])), [contactos]);

  return {
    // Slicers / Filtros
    periodo,
    setPeriodo,
    estadoFilter,
    setEstadoFilter,
    contactoFilter,
    setContactoFilter,
    chartType,
    setChartType,
    tipoProyeccion,
    setTipoProyeccion,
    proyeccionMesOffset,
    setProyeccionMesOffset,
    // Datos filtrados
    filteredPrestamos,
    filteredPagos,
    filteredMovimientos,
    // Métricas y Datasets
    metrics,
    flujoNetoData,
    mesActualNombre,
    targetYear,
    timelineProyeccionMes,
    proyeccionSemestral,
    cobrosMensuales,
    portfolioHealth,
    topDebtors,
    liquidityByAccount,
    contactMap,
  };
}
