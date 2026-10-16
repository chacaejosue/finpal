"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  WalletCards,
  HandCoins,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  Printer,
  Calendar,
  Filter,
  Search,
  ArrowUpDown,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  FileSpreadsheet,
  Landmark,
  Coins,
  Percent,
  AlertOctagon,
  Users,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
} from "lucide-react";
import {
  money,
  loanBalance,
  monthlyInterest,
  rel,
  type Prestamo,
  type Pago,
  type Cuenta,
  type Movimiento,
  type Contacto,
  type Preferencias,
} from "@/lib/dashboard-context";
import { ContactAvatar } from "@/components/contact-avatar";
import { formatDateEs } from "@/lib/format-date";
import { sanitizeSpreadsheetCell } from "@/lib/security";

interface ReportesBiProps {
  totals: {
    available: number;
    pending: number;
    collected: number;
    interest: number;
    expenses: number;
    incomes?: number;
    interestPaid?: number;
    lateCount: number;
    paidLoansCount: number;
    activeLoansCount: number;
  };
  prestamos: Prestamo[];
  pagos: Pago[];
  cuentas: Cuenta[];
  movimientos: Movimiento[];
  contactos: Contacto[];
  preferencias?: Preferencias;
}

type PeriodoFilter = "todo" | "anio" | "90d" | "30d";
type EstadoFilter = "todos" | "al_dia" | "atrasado" | "saldado";
type ChartType = "area" | "bar";

export function ReportesBiDashboard({
  totals,
  prestamos,
  pagos,
  cuentas,
  movimientos,
  contactos,
  preferencias,
}: ReportesBiProps) {
  // Bandera de montaje en cliente para evitar advertencias de hidratación SSR en Recharts
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Estados de filtros analíticos (selectores de período, estado y contacto)
  const [periodo, setPeriodo] = useState<PeriodoFilter>("todo");
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [contactoFilter, setContactoFilter] = useState<string>("todos");
  const [searchTable, setSearchTable] = useState<string>("");
  const [sortField, setSortField] = useState<"saldo" | "capital" | "fecha">("saldo");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [chartType, setChartType] = useState<ChartType>("area");
  const [tipoProyeccion, setTipoProyeccion] = useState<"mes" | "semestre">("mes");

  // Local date parser to prevent UTC midnight timezone displacement
  const parseLocalDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date(0);
    if (dateStr.length === 10 && dateStr.includes("-")) {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
  };

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

  // ─── Agregaciones de KPIs Ejecutivos (Tarjetas de Control) ──────────────────
  /**
   * Agregación analítica de la cartera de crédito y flujo operativo en el alcance filtrado:
   * - totalIngresos: suma de ingresos directos registrados + intereses reales cobrados por préstamos.
   * - totalGastos: egresos y gastos operativos registrados en bitácora.
   * - resultadoNeto: balance superávit/déficit (ingresos totales menos gastos).
   * - totalCapitalColocado: suma de montos principales prestados históricamente.
   * - totalCapitalPagado: suma del capital pagado que ya ha retornado a las cuentas.
   * - totalSaldoPendiente: capital vivo en riesgo activo por cobrar.
   * - recoveryRate: porcentaje de capital recuperado vs colocado.
   * - interesMensualEstimado: rendimiento mensual proyectado sobre el saldo pendiente actual.
   * - moraRate: porcentaje de la cartera en mora respecto al saldo total por cobrar.
   */
  const metrics = useMemo(() => {
    // ─── Flujo de Gastos e Ingresos ──────────────────────────────────────────
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

    // ─── Métricas de Cartera Crediticia ──────────────────────────────────────
    // Total capital placed in filtered scope
    const totalCapitalColocado = filteredPrestamos.reduce(
      (sum, p) => sum + Number(p.monto_principal || 0),
      0
    );

    // Total capital amortized / paid in filtered scope
    const totalCapitalPagado = filteredPrestamos.reduce(
      (sum, p) => sum + Number(p.monto_capital_pagado || 0),
      0
    );

    // Remaining loan balance
    const totalSaldoPendiente = filteredPrestamos.reduce(
      (sum, p) => sum + loanBalance(p),
      0
    );

    // Capital recovery rate %
    const recoveryRate =
      totalCapitalColocado > 0
        ? (totalCapitalPagado / totalCapitalColocado) * 100
        : 0;

    // Interés mensual estimado en curso sobre créditos activos
    const interesMensualEstimado = filteredPrestamos
      .filter((p) => p.estado === "activo" || p.estado === "atrasado")
      .reduce((sum, p) => sum + monthlyInterest(p), 0);

    // Cartera en mora / riesgo
    const prestamosMora = filteredPrestamos.filter((p) => p.estado === "atrasado");
    const capitalEnMora = prestamosMora.reduce((sum, p) => sum + loanBalance(p), 0);
    const moraRate =
      totalSaldoPendiente > 0 ? (capitalEnMora / totalSaldoPendiente) * 100 : 0;

    // Liquidez disponible en efectivo y cuentas bancarias activas
    const totalLiquidez = cuentas
      .filter((c) => c.es_activa)
      .reduce((sum, c) => sum + Number(c.saldo || 0), 0);

    const activeAccountsCount = cuentas.filter((c) => c.es_activa && Number(c.saldo || 0) > 0).length;

    // Debtors count
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

  // ─── Proyección de Flujo Neto del Mes Actual (Paridad con Landing) ─────────
  const mesActualNombre = useMemo(() => {
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return meses[new Date().getMonth()];
  }, []);

  /**
   * Proyección del flujo de caja del mes en curso:
   * - interesProyectado: interés mensual de préstamos activos según su saldo deudor pendiente.
   * - capitalDevuelto: pagos reales de capital recibidos en el mes actual.
   * - totalFlujoEsperado: suma transparente y real de ambos conceptos.
   */
  const flujoNetoData = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();

    const pagosMes = filteredPagos.filter((p) => {
      const d = parseLocalDate(p.recibido_en || p.created_at);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const capitalCobradoMes = pagosMes.reduce((sum, p) => sum + Number(p.monto_principal || 0), 0);
    const interesCobradoMes = pagosMes.reduce((sum, p) => sum + Number(p.monto_interes || 0), 0);

    // Interés mensual contractual programado de los préstamos activos
    const interesProyectado = metrics.interesMensualEstimado > 0
      ? metrics.interesMensualEstimado
      : interesCobradoMes;

    // Capital real devuelto por los deudores en el mes actual (sin inventar porcentajes hardcodeados)
    const capitalDevuelto = capitalCobradoMes;

    // El flujo esperado es el interés programado que esperas recibir del mes más el capital devuelto
    const totalFlujoEsperado = capitalDevuelto + interesProyectado;

    return {
      totalFlujoEsperado,
      capitalDevuelto,
      interesProyectado,
      capitalCobradoMes,
      interesCobradoMes,
    };
  }, [filteredPagos, metrics]);

  /**
   * Genera el desglose realista día a día (1 al último día del mes) del flujo proyectado y cobrado.
   * Ubica los cobros reales en su fecha de pago y los cobros futuros según el 'dia_pago' contractual
   * de cada crédito activo o atrasado.
   */
  const timelineProyeccionMes = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const curDay = now.getDate();
    const totalDiasMes = new Date(curYear, curMonth + 1, 0).getDate();

    // Cobros reales del mes indexados por día calendario
    const pagosMes = filteredPagos.filter((p) => {
      const d = parseLocalDate(p.recibido_en || p.created_at);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
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

    // Préstamos activos o con atraso pendientes de cobro
    const prestamosActivos = filteredPrestamos.filter(
      (p) => p.estado === "activo" || p.estado === "atrasado"
    );

    // Mapeo de vencimientos programados por día del mes
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

      // Si el día ya pasó o es hoy, el flujo del día es el cobro real registrado
      // Si el día es futuro, el flujo esperado es el interés programado
      const flujoDia = d <= curDay ? cobroReal : interesProg;
      acumulador += flujoDia;

      dias.push({
        dia: d,
        diaLabel: `Día ${d}`,
        flujoDia: Number(flujoDia.toFixed(2)),
        acumulado: Number(acumulador.toFixed(2)),
        cobrado: Number(cobroReal.toFixed(2)),
        programado: Number(interesProg.toFixed(2)),
        esHoy: d === curDay,
        esPasado: d < curDay,
        esFuturo: d > curDay,
        detalles: prog?.detalles || [],
      });
    }

    return dias;
  }, [filteredPagos, filteredPrestamos]);

  /**
   * Proyección multimes a 6 meses hacia adelante:
   * Mes actual: cobros reales devueltos + interés programado.
   * Meses futuros: interés contractual proyectado según los saldos vigentes.
   */
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

    // Process all filtered pagos
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

    // Ordenar cronológicamente
    items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // If less than 2 points, ensure we have reasonable structure
    if (items.length === 0) {
      return [
        { periodo: "Sin datos", capital: 0, interes: 0, total: 0, sortKey: "0" },
      ];
    }

    return items;
  }, [filteredPagos]);

  // ─── Datos de Gráfico 2: Composición y Salud de la Cartera (Dona) ──────────
  const portfolioHealth = useMemo(() => {
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
        color: "#10b981", // Emerald
        pct: total > 0 ? (alDiaAmount / total) * 100 : 0,
      },
      {
        name: "En mora",
        value: Number(moraAmount.toFixed(2)),
        count: moraCount,
        color: "#ef4444", // Red / Amber
        pct: total > 0 ? (moraAmount / total) * 100 : 0,
      },
      {
        name: "Saldados",
        value: Number(saldadoAmount.toFixed(2)),
        count: saldadoCount,
        color: "#3b82f6", // Blue
        pct: total > 0 ? (saldadoAmount / total) * 100 : 0,
      },
    ].filter((item) => item.value > 0 || item.count > 0);
  }, [filteredPrestamos]);

  // ─── Datos de Gráfico 3: Principales Deudores por Saldo (Barras) ────────────
  const topDebtors = useMemo(() => {
    const map = new Map<string, { nombre: string; saldo: number; capital: number; prestamos: number }>();

    for (const p of filteredPrestamos) {
      const contactObj = rel(p.contactos);
      const name = contactObj?.nombre || "Sin deudor asignado";
      const id = contactObj?.id || name;
      const balance = loanBalance(p);

      const curr = map.get(id) || { nombre: name, saldo: 0, capital: 0, prestamos: 0 };
      curr.saldo += balance;
      curr.capital += Number(p.monto_principal || 0);
      curr.prestamos += 1;
      map.set(id, curr);
    }

    return Array.from(map.values())
      .filter((d) => d.saldo > 0)
      .sort((a, b) => b.saldo - a.saldo)
      .slice(0, 5)
      .map((d) => ({
        ...d,
        nombreCorto: d.nombre.length > 16 ? d.nombre.slice(0, 15) + "…" : d.nombre,
      }));
  }, [filteredPrestamos]);

  // ─── Paleta y Generador Dinámico de Colores para Cuentas Financieras ───────
  const PALETA_CUENTAS = useMemo(
    () => [
      "#006948", // Esmeralda FinPal
      "#0284c7", // Azul Océano
      "#7c3aed", // Violeta Profundo
      "#f59e0b", // Ámbar Cálido
      "#0d9488", // Teal / Turquesa
      "#e11d48", // Carmesí / Rosa
      "#4f46e5", // Índigo
      "#ea580c", // Naranja Quemado
      "#0891b2", // Cian
      "#65a30d", // Lima Intenso
      "#c026d3", // Fucsia
      "#059669", // Verde Menta
      "#9333ea", // Púrpura
      "#d97706", // Ocre / Dorado
      "#2563eb", // Azul Real
      "#db2777", // Rosa Vivo
    ],
    []
  );

  /**
   * Obtiene un color distintivo para cada cuenta bancaria/billetera.
   * Si el usuario registra más cuentas que los colores base, genera tonos armónicos
   * usando el ángulo áureo (137.5°) para asegurar contraste permanente sin repetición contigua.
   */
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
  const liquidityByAccount = useMemo(() => {
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

  // ─── Registros de la Tabla (Matriz Detallada de Cartera) ───────────────────
  const contactMap = useMemo(() => new Map(contactos.map((c) => [c.id, c])), [contactos]);

  const tableRecords = useMemo(() => {
    let result = filteredPrestamos.map((p) => {
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
      if (sortField === "fecha") diff = new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
      return sortAsc ? diff : -diff;
    });

    return result;
  }, [filteredPrestamos, searchTable, sortField, sortAsc]);

  // ─── Exportación a Excel (.xlsx) ──────────────────────────────────────────
  const handleExportExcel = () => {
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

      // Sheet 2: Loans Detail
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

      // Hoja 5: Movimientos y Flujo de Caja (Ingresos y Gastos)
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
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      alert("No se pudo generar el archivo Excel.");
    }
  };

  // ─── Exportación a CSV ────────────────────────────────────────────────────
  const handleExportCsv = () => {
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
    } catch (err) {
      console.error("Error exportando CSV:", err);
    }
  };

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* ─── Encabezado Superior de Inteligencia de Negocios (BI) ───────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-surface-container-high/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Business Intelligence Lite</span>
            </span>
            <span className="text-xs text-on-surface-variant font-medium hidden sm:inline-block">
              · Sincronizado en tiempo real
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface mt-1.5 tracking-tight">
            Reportes & Analítica Financiera
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Métricas de cartera, rendimiento de intereses, liquidez en cuentas y proyecciones.
          </p>
        </div>

        {/* Action Buttons: Excel, CSV & Print */}
        <div className="flex items-center gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container transition-all cursor-pointer active:scale-[0.98]"
            title="Descargar libro de trabajo completo en Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold border border-surface-container-high/60 transition-colors cursor-pointer"
            title="Descargar resumen en formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-on-surface-variant" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold border border-surface-container-high/60 transition-colors cursor-pointer"
            title="Imprimir o guardar reporte como PDF"
          >
            <Printer className="w-3.5 h-3.5 text-on-surface-variant" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* ─── Interactive BI Slicers / Filters Ribbon ───────────────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs space-y-3.5 print:hidden">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filtros y Segmentación de Datos</span>
          </div>
          <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
            {filteredPrestamos.length} créditos · {filteredPagos.length} cobros en vista
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Período Slicer */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Rango temporal
            </label>
            <div className="grid grid-cols-4 gap-1 bg-surface-container-low p-1 rounded-xl">
              {[
                { id: "todo", label: "Todo" },
                { id: "anio", label: "Este año" },
                { id: "90d", label: "90 d" },
                { id: "30d", label: "30 d" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodo(p.id as PeriodoFilter)}
                  className={`py-1.5 text-center text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    periodo === p.id
                      ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de Cartera Slicer */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Estado de cartera
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
              className="w-full py-2 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold border border-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option className="bg-surface text-on-surface" value="todos">Todos los estados (al día, mora y saldados)</option>
              <option className="bg-surface text-on-surface" value="al_dia">Solo al día (vigentes sin atraso)</option>
              <option className="bg-surface text-on-surface" value="atrasado">Solo atrasados (en mora)</option>
              <option className="bg-surface text-on-surface" value="saldado">Solo saldados (completados)</option>
            </select>
          </div>

          {/* Contacto / Deudor Slicer */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Deudor / Contacto
            </label>
            <select
              value={contactoFilter}
              onChange={(e) => setContactoFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold border border-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option className="bg-surface text-on-surface" value="todos">Todos los deudores ({contactos.length})</option>
              {contactos.map((c) => (
                <option className="bg-surface text-on-surface" key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Tarjetas Ejecutivas de Control (Scorecards de KPIs) ──────────────── */}
      {/* ─── Fila 1: Indicadores Financieros (Ingresos, Gastos, Flujo Neto & Liquidez) ─── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>Flujo Operativo & Resultados (Ingresos vs Gastos)</span>
          </div>
          <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
            {metrics.resultadoNeto >= 0 ? "Superávit neto global" : "Déficit en el período"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Ingresos Totales */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Ingresos Totales
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                {money(metrics.totalIngresos)}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1 font-medium truncate">
                <span>{money(metrics.totalIngresosDirectos)} directos</span>
                <span className="text-on-surface-variant font-normal">·</span>
                <span>{money(metrics.totalInteresCobrado)} intereses</span>
              </p>
            </div>
          </div>

          {/* Card 2: Gastos Registrados */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs hover:border-rose-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Gastos Registrados
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-error tracking-tight">
                {money(metrics.totalGastos)}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 font-medium">
                {metrics.gastosCount} {metrics.gastosCount === 1 ? "gasto registrado" : "gastos registrados"} en bitácora
              </p>
            </div>
          </div>

          {/* Card 3: Resultado / Margen Neto */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs hover:border-blue-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Resultado Neto
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div
                className={`font-mono text-xl sm:text-2xl font-extrabold tracking-tight ${
                  metrics.resultadoNeto >= 0 ? "text-primary" : "text-error"
                }`}
              >
                {metrics.resultadoNeto >= 0 ? "+" : ""}
                {money(metrics.resultadoNeto)}
              </div>
              <p className="text-[11px] mt-1.5 font-medium flex items-center gap-1">
                {metrics.resultadoNeto >= 0 ? (
                  <span className="text-primary font-bold">Superávit operativo</span>
                ) : (
                  <span className="text-error font-bold">Déficit en el período</span>
                )}
              </p>
            </div>
          </div>

          {/* Card 4: Liquidez Disponible */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs hover:border-emerald-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Liquidez Disponible
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                {money(metrics.totalLiquidez)}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 flex items-center gap-1.5 font-medium">
                <WalletCards className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{metrics.activeAccountsCount} cuentas con saldo</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fila 2: Indicadores de Cartera & Préstamos ─── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-on-surface">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-primary" />
            <span>Rendimiento de Cartera & Préstamos</span>
          </div>
          <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
            {metrics.deudoresUnicos} deudores · {filteredPrestamos.length} créditos en vista
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Cartera Colocada */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs hover:border-blue-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Cartera Colocada
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                {money(metrics.totalCapitalColocado)}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1.5 font-medium">
                Saldo activo: <span className="font-mono font-bold text-on-surface">{money(metrics.totalSaldoPendiente)}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Capital Devuelto con Progress Bar */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs hover:border-primary/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Capital Devuelto
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 flex items-center justify-center shrink-0">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-primary tracking-tight">
                  {metrics.recoveryRate.toFixed(1)}%
                </span>
                <span className="text-[10px] text-on-surface-variant font-semibold">
                  {money(metrics.totalCapitalPagado)} devuelto
                </span>
              </div>
              {/* Mini barra visual de progreso */}
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, metrics.recoveryRate))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Rendimiento Intereses */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs hover:border-amber-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Intereses Percibidos
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                {money(metrics.totalInteresCobrado)}
              </div>
              <p className="text-[11px] text-primary font-semibold mt-1.5 flex items-center gap-1 font-medium">
                <span>+{money(metrics.interesMensualEstimado)}</span>
                <span className="text-[10px] text-on-surface-variant font-normal">est. mes</span>
              </p>
            </div>
          </div>

          {/* Card 4: Cartera en Mora / Riesgo */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-surface-container-high/70 shadow-2xs hover:border-rose-500/30 hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Cartera en Mora
              </span>
              <div
                className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center shrink-0 ${
                  metrics.capitalEnMora > 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20"
                    : "bg-surface-container text-on-surface-variant ring-surface-container-high/60"
                }`}
              >
                <AlertOctagon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div
                className={`font-mono text-xl sm:text-2xl font-extrabold tracking-tight ${
                  metrics.capitalEnMora > 0 ? "text-error" : "text-on-surface"
                }`}
              >
                {money(metrics.capitalEnMora)}
              </div>
              <p className="text-[11px] mt-1.5 font-medium">
                {metrics.capitalEnMora > 0 ? (
                  <span className="font-bold text-error">
                    {metrics.moraRate.toFixed(1)}% ({metrics.moraCount} préstamos)
                  </span>
                ) : (
                  <span className="text-primary font-bold">0% · Cartera 100% al día</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Visual Analytics Section 1: Flujo Temporal & Composición ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: Serie Temporal de Cobros (Looker Studio Stream) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/70 shadow-2xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-surface-container-low">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h2 className="font-heading text-base font-bold text-on-surface">
                  Evolución Histórica de Cobros
                </h2>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Desglose de capital pagado vs. intereses percibidos en cada período.
              </p>
            </div>

            {/* Toggle Área / Barras */}
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartType("area")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  chartType === "area"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Área continua
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  chartType === "bar"
                    ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Barras agrupadas
              </button>
            </div>
          </div>

          <div className="w-full h-72 sm:h-80 pt-2">
            {!mounted ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">
                Cargando gráfico analítico...
              </div>
            ) : cobrosMensuales.length === 1 && cobrosMensuales[0].total === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-surface-container-low/40 rounded-xl border border-dashed border-surface-container-high">
                <BarChart3 className="w-8 h-8 text-on-surface-variant/50 mb-2" />
                <p className="text-xs font-semibold text-on-surface">No hay cobros registrados en este período</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 max-w-sm">
                  Al registrar cobros en el sistema, verás la curva de capital pagado e intereses en este panel.
                </p>
              </div>
            ) : chartType === "area" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cobrosMensuales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#006948" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#006948" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorInteres" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-on-surface-variant"
                    tickLine={false}
                    axisLine={{ opacity: 0.2 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    className="text-on-surface-variant"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Bs.${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="capital"
                    name="Capital Pagado"
                    stroke="#006948"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCapital)"
                  />
                  <Area
                    type="monotone"
                    dataKey="interes"
                    name="Intereses Cobrados"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorInteres)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cobrosMensuales} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-on-surface-variant"
                    tickLine={false}
                    axisLine={{ opacity: 0.2 }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "currentColor" }}
                    className="text-on-surface-variant"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `Bs.${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="capital" name="Capital Pagado" fill="#006948" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="interes" name="Intereses Cobrados" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-3 pt-3 border-t border-surface-container-low text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-on-surface">Capital Pagado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-on-surface">Interés Percibido</span>
            </div>
          </div>
        </div>

        {/* Card: Flujo Neto Esperado y Proyección Realista */}
        <div className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-low mb-3">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">
                Flujo Neto Esperado ({mesActualNombre})
              </span>
              <div className="flex items-center bg-surface-container-high/60 p-0.5 rounded-lg border border-surface-container-high">
                <button
                  type="button"
                  onClick={() => setTipoProyeccion("mes")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                    tipoProyeccion === "mes"
                      ? "bg-primary text-on-primary shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Día a Día
                </button>
                <button
                  type="button"
                  onClick={() => setTipoProyeccion("semestre")}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all ${
                    tipoProyeccion === "semestre"
                      ? "bg-primary text-on-primary shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  6 Meses
                </button>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-2">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                  {money(flujoNetoData.totalFlujoEsperado)}
                </span>
                <span className="text-xs font-semibold text-primary inline-flex items-center gap-0.5">
                  ↑ Cobros programados
                </span>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                {tipoProyeccion === "mes" ? "Proyección Mes" : "Pronóstico 6M"}
              </span>
            </div>

            <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">
              {tipoProyeccion === "mes"
                ? `Intereses programados (${money(flujoNetoData.interesProyectado)}) según saldo de créditos activos más capital devuelto (${money(flujoNetoData.capitalDevuelto)}).`
                : `Pronóstico de flujo devengado semestral en base al interés contractual activo (${money(metrics.interesMensualEstimado)}/mes).`}
            </p>

            {/* Barra de progreso de recaudación del mes actual */}
            {tipoProyeccion === "mes" && flujoNetoData.totalFlujoEsperado > 0 && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[10px] font-medium text-on-surface-variant mb-1">
                  <span>
                    Cobrado a la fecha: <b className="text-on-surface font-semibold">{money(flujoNetoData.capitalCobradoMes + flujoNetoData.interesCobradoMes)}</b>
                  </span>
                  <span className="font-mono text-primary font-bold">
                    {Math.min(100, Math.round(((flujoNetoData.capitalCobradoMes + flujoNetoData.interesCobradoMes) / flujoNetoData.totalFlujoEsperado) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((flujoNetoData.capitalCobradoMes + flujoNetoData.interesCobradoMes) / flujoNetoData.totalFlujoEsperado) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Gráfico Analítico de Proyección Realista */}
            <div className="mt-3 h-28 w-full">
              {!mounted ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-on-surface-variant">
                  Cargando proyección...
                </div>
              ) : flujoNetoData.totalFlujoEsperado === 0 && tipoProyeccion === "mes" ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 rounded-xl bg-surface-container-low/40 border border-dashed border-surface-container-high">
                  <TrendingUp className="w-5 h-5 text-on-surface-variant/40 mb-1" />
                  <span className="text-xs font-semibold text-on-surface">Sin cobros programados este mes</span>
                  <span className="text-[10px] text-on-surface-variant">
                    Los préstamos activos con interés o fecha de cobro se graficarán automáticamente.
                  </span>
                </div>
              ) : tipoProyeccion === "mes" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timelineProyeccionMes}
                    margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="chartGradReportes" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#006948" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#006948" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="dia"
                      tick={{ fontSize: 9, fill: "currentColor" }}
                      className="text-on-surface-variant"
                      tickLine={false}
                      axisLine={{ opacity: 0.2 }}
                      interval={4}
                      tickFormatter={(v) => `D${v}`}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "currentColor" }}
                      className="text-on-surface-variant"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip content={<ProyeccionTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="acumulado"
                      name="Flujo Acumulado"
                      stroke="#006948"
                      strokeWidth={2.2}
                      fillOpacity={1}
                      fill="url(#chartGradReportes)"
                      dot={(props: any) => {
                        if (props.payload.flujoDia > 0 || props.payload.esHoy) {
                          return (
                            <circle
                              key={`dot-${props.index}`}
                              cx={props.cx}
                              cy={props.cy}
                              r={props.payload.esHoy ? 3.5 : 2.5}
                              fill={props.payload.esHoy ? "#006948" : "#f59e0b"}
                              stroke="#ffffff"
                              strokeWidth={1.5}
                            />
                          );
                        }
                        return <circle key={`empty-${props.index}`} cx={0} cy={0} r={0} />;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={proyeccionSemestral}
                    margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="mesNombre"
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      className="text-on-surface-variant"
                      tickLine={false}
                      axisLine={{ opacity: 0.2 }}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "currentColor" }}
                      className="text-on-surface-variant"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip content={<ProyeccionTooltip />} />
                    <Bar
                      dataKey="total"
                      name="Flujo Proyectado"
                      fill="#006948"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
            <span>
              Capital Devuelto (Mes): <b className="text-on-surface font-semibold">{money(flujoNetoData.capitalDevuelto)}</b>
            </span>
            <span>
              Interés Programado: <b className="text-primary font-bold">{money(flujoNetoData.interesProyectado)}</b>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Sección Analítica 2: Composición, Mayores Deudores y Liquidez ─ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Chart 2: Salud y Estado de Cartera (Donut Pie) */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/70 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-surface-container-low">
              <PieIcon className="w-4 h-4 text-primary" />
              <h2 className="font-heading text-base font-bold text-on-surface">
                Composición de Cartera
              </h2>
            </div>
            <p className="text-[11px] text-on-surface-variant mt-1">
              Distribución de capital colocado según estado de cobro.
            </p>
          </div>

          <div className="w-full h-56 relative flex items-center justify-center my-auto">
            {!mounted ? (
              <div className="text-xs text-on-surface-variant">Cargando gráfico...</div>
            ) : portfolioHealth.length === 0 ? (
              <div className="text-xs text-on-surface-variant">No hay préstamos para mostrar</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioHealth}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {portfolioHealth.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => money(Number(val))}
                    contentStyle={{
                      backgroundColor: "var(--color-surface-container-lowest, #fff)",
                      borderRadius: "0.75rem",
                      borderColor: "var(--color-surface-container-high, #e5e7eb)",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--color-on-surface, #1f2937)",
                    }}
                    itemStyle={{
                      color: "var(--color-on-surface, #1f2937)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Donut Center Label */}
            {portfolioHealth.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                  Cumplimiento
                </span>
                <span className="font-heading text-lg font-extrabold text-on-surface leading-tight">
                  {(100 - metrics.moraRate).toFixed(0)}%
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-surface-container-low">
            {portfolioHealth.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-on-surface">{item.name}</span>
                  <span className="text-[10px] text-on-surface-variant font-semibold">({item.count})</span>
                </div>
                <div className="font-mono font-bold text-on-surface">
                  {money(item.value)}{" "}
                  <span className="text-[10px] font-normal text-on-surface-variant">
                    ({item.pct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Top 5 Deudores por Exposición (Horizontal Bar) */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/70 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-low mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h2 className="font-heading text-base font-bold text-on-surface">
                  Top 5 Deudores por Saldo Pendiente
                </h2>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Concentración del riesgo de capital adeudado por contacto.
              </p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {topDebtors.length === 0 ? (
              <div className="text-center py-8 text-xs text-on-surface-variant">
                No hay saldos pendientes en el período seleccionado. ¡Excelente salud de cartera!
              </div>
            ) : (
              topDebtors.map((d, index) => {
                const maxBalance = topDebtors[0]?.saldo || 1;
                const ratio = Math.min(100, (d.saldo / maxBalance) * 100);
                return (
                  <div key={d.nombre} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-extrabold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-on-surface truncate font-bold">{d.nombre}</span>
                        <span className="text-[10px] text-on-surface-variant font-normal hidden sm:inline">
                          ({d.prestamos} {d.prestamos === 1 ? "préstamo" : "préstamos"})
                        </span>
                      </div>
                      <span className="font-mono text-xs font-extrabold text-on-surface shrink-0">
                        {money(d.saldo)}
                      </span>
                    </div>
                    {/* Barra visual de proporción */}
                    <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Distribución de Liquidez por Cuenta Financiera */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high/70 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-low mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-primary" />
                <h2 className="font-heading text-base font-bold text-on-surface">
                  Distribución de Liquidez por Cuenta
                </h2>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Ubicación del efectivo y fondos disponibles en bancos o billeteras.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {liquidityByAccount.length === 0 ? (
              <div className="text-center py-8 text-xs text-on-surface-variant">
                No hay cuentas activas registradas.
              </div>
            ) : (
              liquidityByAccount.map((c, index) => {
                const totalLiq = metrics.totalLiquidez || 1;
                const pct = totalLiq > 0 ? (c.saldo / totalLiq) * 100 : 0;
                const barColor = c.color || getAccountColor(index);
                return (
                  <div key={c.nombre} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs transition-transform hover:scale-110"
                          style={{ backgroundColor: barColor }}
                          aria-hidden="true"
                        />
                        <WalletCards className="w-3.5 h-3.5 shrink-0" style={{ color: barColor }} />
                        <span className="text-on-surface font-bold">{c.nombre}</span>
                        <span className="text-[10px] text-on-surface-variant capitalize font-normal">
                          · {c.tipo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-on-surface">
                          {money(c.saldo)}
                        </span>
                        <span
                          className="text-[10px] font-bold w-10 text-right font-mono"
                          style={{ color: barColor }}
                        >
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    {/* Barra visual de progreso con color distintivo por cuenta */}
                    <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── Executive Intelligence & Smart Insights ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Insight 1: Concentración de Cartera */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider">
              Concentración de Riesgo
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              {topDebtors.length > 0 && metrics.totalSaldoPendiente > 0 ? (
                <>
                  El deudor principal (<strong>{topDebtors[0].nombre}</strong>) concentra el{" "}
                  <strong>{((topDebtors[0].saldo / metrics.totalSaldoPendiente) * 100).toFixed(0)}%</strong> del
                  saldo pendiente total.
                </>
              ) : (
                "Cartera sin saldos pendientes acumulados. El riesgo de capital es óptimo."
              )}
            </p>
          </div>
        </div>

        {/* Insight 2: Margen de Interés Mensual */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider">
              Flujo Estimado Mensual
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Los préstamos activos devengan una proyección de{" "}
              <strong>{money(metrics.interesMensualEstimado)}</strong> cada mes en intereses.
            </p>
          </div>
        </div>

        {/* Insight 3: Ratio de Cobertura */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
            <WalletCards className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider">
              Liquidez vs Cartera
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Cuentas con <strong>{money(metrics.totalLiquidez)}</strong> líquidos para soportar nuevas colocaciones o respaldar contingencias.
            </p>
          </div>
        </div>

        {/* Insight 4: Balance Operativo (Ingresos vs Gastos) */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            metrics.resultadoNeto >= 0
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-xs font-bold text-on-surface uppercase tracking-wider">
              Balance Operativo
            </h3>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
              Ingresos de <strong>{money(metrics.totalIngresos)}</strong> frente a <strong>{money(metrics.totalGastos)}</strong> en gastos (balance:{" "}
              <strong className={metrics.resultadoNeto >= 0 ? "text-primary" : "text-error"}>
                {metrics.resultadoNeto >= 0 ? "+" : ""}{money(metrics.resultadoNeto)}
              </strong>).
            </p>
          </div>
        </div>
      </div>

      {/* ─── Matriz Detallada de Cartera (Tabla Interactiva) ───────────────── */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 shadow-2xs overflow-hidden">
        {/* Barra de herramientas de la tabla */}
        <div className="p-4 border-b border-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-bold text-on-surface">
              Matriz Detallada de Cartera
            </h2>
            <p className="text-[11px] text-on-surface-variant mt-0.5">
              Explora cada crédito, tasa, progreso de pago y vencimientos asociados.
            </p>
          </div>

          {/* Campo de búsqueda y controles de ordenamiento */}
          <div className="flex items-center gap-2">
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
              className="p-1.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Cambiar orden ascendente/descendente"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
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
                <th className="py-3 px-4 font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                  % Progreso
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
                    <td className="py-3 px-4 font-mono font-bold text-on-surface">
                      {money(r.principal)}
                    </td>

                    {/* Pagado */}
                    <td className="py-3 px-4 font-mono text-on-surface font-semibold">
                      {money(r.pagado)}
                    </td>

                    {/* Saldo */}
                    <td className="py-3 px-4 font-mono font-extrabold text-on-surface">
                      {money(r.saldo)}
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${r.pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-on-surface">
                          {r.pct}%
                        </span>
                      </div>
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
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100/70 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60">
                          Saldado
                        </span>
                      ) : r.estado === "atrasado" ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-error-container text-on-error-container border border-error/20">
                          Atrasado
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary-container/60 text-on-secondary-container border border-primary/20">
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
    </div>
  );
}

// ─── Tooltip Personalizado para Recharts (Adaptable a tema claro/oscuro) ──
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high/90 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[160px]">
      <p className="font-heading font-extrabold text-on-surface text-sm border-b border-surface-container-low pb-1">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.stroke || entry.fill || entry.color }}
            />
            <span className="text-on-surface-variant font-medium">{entry.name}:</span>
          </div>
          <span className="font-mono font-bold text-on-surface">
            {money(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Tooltip Personalizado para la Proyección de Flujo Neto ─────────────────
interface ProyeccionPayloadItem {
  payload?: {
    dia?: number;
    diaLabel?: string;
    periodo?: string;
    flujoDia?: number;
    acumulado?: number;
    cobrado?: number;
    programado?: number;
    total?: number;
    esHoy?: boolean;
    esPasado?: boolean;
    esFuturo?: boolean;
    detalles?: Array<{ nombre: string; deudor: string; monto: number }>;
  };
}

function ProyeccionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ProyeccionPayloadItem[];
  label?: string | number;
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  const titulo = item.periodo || `Día ${item.dia ?? label}`;

  return (
    <div className="bg-surface-container-lowest border border-surface-container-high/90 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between border-b border-surface-container-low pb-1">
        <span className="font-heading font-bold text-on-surface text-sm">
          {titulo}
        </span>
        {item.esHoy && (
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded border border-primary/20">
            Hoy
          </span>
        )}
      </div>

      <div className="pt-0.5 space-y-1 text-xs">
        {item.flujoDia !== undefined && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant font-medium">Cobro del día:</span>
            <span className="font-mono font-bold text-on-surface">
              {money(item.flujoDia)}
            </span>
          </div>
        )}

        {item.total !== undefined && item.periodo && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant font-medium">Flujo estimado:</span>
            <span className="font-mono font-bold text-primary">
              {money(item.total)}
            </span>
          </div>
        )}

        {item.acumulado !== undefined && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-on-surface-variant font-medium">Acumulado mes:</span>
            <span className="font-mono font-bold text-primary">
              {money(item.acumulado)}
            </span>
          </div>
        )}

        {item.detalles && item.detalles.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-surface-container-low">
            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Vencimientos del día:
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {item.detalles.map((d, idx) => (
                <div key={idx} className="text-[11px] flex items-center justify-between gap-2">
                  <span className="text-on-surface truncate font-medium">
                    {d.deudor || d.nombre}
                  </span>
                  <span className="font-mono text-primary font-semibold shrink-0">
                    {money(d.monto)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
