import type {
  Prestamo,
  Pago,
  Cuenta,
  Movimiento,
  Contacto,
  Preferencias,
} from "@/lib/dashboard-context";

export interface ReportesBiProps {
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

export type PeriodoFilter = "todo" | "anio" | "90d" | "30d";
export type EstadoFilter = "todos" | "al_dia" | "atrasado" | "saldado";
export type ChartType = "area" | "bar";

export type ReportWidgetKey =
  | "kpi_flujo"
  | "kpi_cartera"
  | "chart_historico"
  | "flujo_neto_esperado"
  | "chart_salud"
  | "top_deudores"
  | "liquidez_cuentas"
  | "smart_insights"
  | "tabla_auditoria";

export interface ReportWidgetItem {
  id: ReportWidgetKey;
  label: string;
  category: "kpi" | "grafico" | "lista" | "tabla" | "insights";
  description: string;
  colSpan: 12 | 6; // 12 = Ancho completo, 6 = Medio ancho
  visible: boolean;
}

export const REPORT_WIDGETS_CATALOG: ReportWidgetItem[] = [
  {
    id: "kpi_flujo",
    label: "Scorecards: Flujo Operativo & Resultados",
    category: "kpi",
    description: "Ingresos totales, gastos de bitácora, margen neto superávit/déficit y liquidez bancaria.",
    colSpan: 12,
    visible: false,
  },
  {
    id: "kpi_cartera",
    label: "Scorecards: Cartera & Rendimiento",
    category: "kpi",
    description: "Capital colocado, capital devuelto con barra de progreso, intereses cobrados y cartera en mora.",
    colSpan: 12,
    visible: false,
  },
  {
    id: "chart_historico",
    label: "Gráfico: Evolución Histórica de Cobros",
    category: "grafico",
    description: "Serie temporal continua o de barras con desglose de capital amortizado e interés mensual.",
    colSpan: 6,
    visible: false,
  },
  {
    id: "flujo_neto_esperado",
    label: "Gráfico: Flujo Neto y Proyección Mensual",
    category: "grafico",
    description: "Timeline día a día con selector de mes para ubicar vencimientos contractuales y cobros reales.",
    colSpan: 6,
    visible: false,
  },
  {
    id: "chart_salud",
    label: "Gráfico: Composición y Salud de Cartera",
    category: "grafico",
    description: "Gráfico de dona con porcentaje de cumplimiento y créditos al día, atrasados y saldados.",
    colSpan: 6,
    visible: false,
  },
  {
    id: "top_deudores",
    label: "Lista: Top 5 Deudores por Saldo Pendiente",
    category: "lista",
    description: "Concentración del riesgo de capital adeudado por contacto con desempate inteligente.",
    colSpan: 6,
    visible: false,
  },
  {
    id: "liquidez_cuentas",
    label: "Lista: Distribución de Liquidez por Cuenta",
    category: "lista",
    description: "Ubicación del dinero disponible por bancos, billeteras móviles y cajas de efectivo.",
    colSpan: 6,
    visible: false,
  },
  {
    id: "smart_insights",
    label: "Inteligencia: Insights y Diagnóstico Ejecutivo",
    category: "insights",
    description: "4 tarjetas inteligentes de análisis automático de riesgo, morosidad y balances.",
    colSpan: 12,
    visible: false,
  },
  {
    id: "tabla_auditoria",
    label: "Tabla: Matriz Detallada de Cartera",
    category: "tabla",
    description: "Explorador completo de préstamos, tasa, progreso devuelto, estados y exportación a Excel.",
    colSpan: 12,
    visible: false,
  },
];
