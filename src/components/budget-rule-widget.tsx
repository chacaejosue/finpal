"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart,
  Sparkles,
  Home,
  PartyPopper,
  PiggyBank,
  Check,
  RotateCcw,
  SlidersHorizontal,
  DollarSign,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  X,
  WalletCards,
} from "lucide-react";
import { money, useDashboard, type Movimiento, type Pago } from "@/lib/dashboard-context";
import { formatMonthYear, getLocalDateString } from "@/lib/format-date";

export type BudgetModelKey = "50_30_20" | "60_20_20" | "custom";
export type BudgetBaseMode = "smart" | "fixed";
export type LoanInterestMode = "interest_only" | "full" | "projected" | "none";

interface BudgetModelConfig {
  id: BudgetModelKey;
  label: string;
  needs: number;
  wants: number;
  savings: number;
}

export interface BudgetBaseConfig {
  mode: BudgetBaseMode;
  fixedAmount: number;
  loanMode: LoanInterestMode;
  includeRegularIncome: boolean;
  includeAdjustments: boolean;
  manualExtra: number;
  excludedMovementIds: string[];
}

export const DEFAULT_BASE_CONFIG: BudgetBaseConfig = {
  mode: "smart",
  fixedAmount: 0,
  loanMode: "interest_only", // Por defecto: sólo ganancias netas por intereses cobrados
  includeRegularIncome: true,
  includeAdjustments: false,
  manualExtra: 0,
  excludedMovementIds: [],
};

const BUDGET_MODELS: Record<BudgetModelKey, BudgetModelConfig> = {
  "50_30_20": {
    id: "50_30_20",
    label: "50 / 30 / 20",
    needs: 50,
    wants: 30,
    savings: 20,
  },
  "60_20_20": {
    id: "60_20_20",
    label: "60 / 20 / 20",
    needs: 60,
    wants: 20,
    savings: 20,
  },
  custom: {
    id: "custom",
    label: "Personalizada",
    needs: 50,
    wants: 25,
    savings: 25,
  },
};

const WANTS_REGEX =
  /(ocio|diversion|salida|salidas|fiesta|bar|cerveza|trago|restaurante|cafe|cafeteria|delivery|pedidosya|uber|cine|pelicula|streaming|netflix|spotify|disney|juego|videojuego|ropa|vestimenta|zapato|zapatos|moda|viaje|vacacion|hotel|hobby|hobbies|regalo|gusto|antojo|compras|shopping|belleza|peluqueria|spa)/i;

const SAVINGS_REGEX =
  /(ahorro|inversion|fondo|plazo fijo|bolsa|acciones|cripto|dolar|dolares|reserva|emergencia|recapitalizacion)/i;

export interface BudgetRuleWidgetProps {
  movimientos: Movimiento[];
  pagos?: Pago[];
  zonaHoraria?: string;
  className?: string;
  compact?: boolean;
}

export function BudgetRuleWidget({
  movimientos,
  pagos: propsPagos,
  zonaHoraria = "America/La_Paz",
  className = "",
}: BudgetRuleWidgetProps) {
  // Contexto central para obtener préstamos y pagos registrados
  const dashboard = useDashboard();
  const totals = dashboard?.totals;
  const allPagos = useMemo(
    () => propsPagos ?? dashboard?.pagos ?? [],
    [propsPagos, dashboard?.pagos]
  );

  const [modelKey, setModelKey] = useState<BudgetModelKey>(() => {
    if (typeof window === "undefined") return "50_30_20";
    try {
      const saved = localStorage.getItem("finpal_budget_rule_model") as BudgetModelKey;
      return saved && BUDGET_MODELS[saved] ? saved : "50_30_20";
    } catch {
      return "50_30_20";
    }
  });

  const [periodo, setPeriodo] = useState<"mes_actual" | "ultimos_30d">("mes_actual");
  const [customNeeds, setCustomNeeds] = useState<number>(50);
  const [customWants, setCustomWants] = useState<number>(25);
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Configuración de la Base del Presupuesto (fuentes, exclusiones, intereses o monto manual fijo)
  const [baseConfig, setBaseConfig] = useState<BudgetBaseConfig>(() => {
    if (typeof window === "undefined") return DEFAULT_BASE_CONFIG;
    try {
      const saved = localStorage.getItem("finpal_budget_base_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_BASE_CONFIG, ...parsed };
      }
      // Retrocompatibilidad con mesada extra guardada previamente
      const legacyExtra = Number(localStorage.getItem("finpal_budget_manual_extra"));
      if (!isNaN(legacyExtra) && legacyExtra > 0) {
        return { ...DEFAULT_BASE_CONFIG, manualExtra: legacyExtra };
      }
      return DEFAULT_BASE_CONFIG;
    } catch {
      return DEFAULT_BASE_CONFIG;
    }
  });

  const [showBaseConfig, setShowBaseConfig] = useState<boolean>(false);
  const [showIncomeList, setShowIncomeList] = useState<boolean>(false);
  const [tempFixedAmount, setTempFixedAmount] = useState<string>(() =>
    baseConfig.fixedAmount > 0 ? String(baseConfig.fixedAmount) : ""
  );
  const [tempManualExtra, setTempManualExtra] = useState<string>(() =>
    baseConfig.manualExtra > 0 ? String(baseConfig.manualExtra) : ""
  );

  const [prevBaseSync, setPrevBaseSync] = useState({
    fixedAmount: baseConfig.fixedAmount,
    manualExtra: baseConfig.manualExtra,
  });

  if (
    prevBaseSync.fixedAmount !== baseConfig.fixedAmount ||
    prevBaseSync.manualExtra !== baseConfig.manualExtra
  ) {
    setPrevBaseSync({
      fixedAmount: baseConfig.fixedAmount,
      manualExtra: baseConfig.manualExtra,
    });
    setTempFixedAmount(baseConfig.fixedAmount > 0 ? String(baseConfig.fixedAmount) : "");
    setTempManualExtra(baseConfig.manualExtra > 0 ? String(baseConfig.manualExtra) : "");
  }

  const updateBaseConfig = (updater: (prev: BudgetBaseConfig) => BudgetBaseConfig) => {
    setBaseConfig((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("finpal_budget_base_config", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const customSavings = Math.max(0, 100 - customNeeds - customWants);

  const currentConfig: BudgetModelConfig = useMemo(() => {
    if (modelKey === "custom") {
      return {
        id: "custom",
        label: "Personalizada",
        needs: customNeeds,
        wants: customWants,
        savings: customSavings,
      };
    }
    return BUDGET_MODELS[modelKey];
  }, [modelKey, customNeeds, customWants, customSavings]);

  const handleSelectModel = (key: BudgetModelKey) => {
    setModelKey(key);
    try {
      localStorage.setItem("finpal_budget_rule_model", key);
    } catch {}
  };

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getLocalDateString(now, zonaHoraria), [now, zonaHoraria]);
  const currentYearMonth = todayStr.slice(0, 7);
  const mesNombre = useMemo(() => formatMonthYear(currentYearMonth), [currentYearMonth]);

  // Movimientos filtrados para el periodo
  const movimientosPeriodo = useMemo(() => {
    if (periodo === "mes_actual") {
      return movimientos.filter((m) => (m.ocurrido_en || "").slice(0, 7) === currentYearMonth);
    }
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return movimientos.filter((m) => (m.ocurrido_en || "").slice(0, 10) >= cutoff);
  }, [movimientos, periodo, currentYearMonth, now]);

  // Cobros de préstamos filtrados para el periodo
  const pagosPeriodo = useMemo(() => {
    if (!allPagos || allPagos.length === 0) return [];
    if (periodo === "mes_actual") {
      return allPagos.filter((p) => (p.recibido_en || "").slice(0, 7) === currentYearMonth);
    }
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return allPagos.filter((p) => (p.recibido_en || "").slice(0, 10) >= cutoff);
  }, [allPagos, periodo, currentYearMonth, now]);

  // Motor analítico inteligente y configurable de presupuesto
  const analytics = useMemo(() => {
    let gastoNeeds = 0;
    let gastoWants = 0;
    let gastoSavings = 0;

    const ingresosRegularesList: Array<{
      id: string;
      monto: number;
      descripcion: string;
      fecha: string;
      categoria: string;
      tipo: string;
    }> = [];

    const ajustesPositivosList: Array<{
      id: string;
      monto: number;
      descripcion: string;
      fecha: string;
      categoria: string;
      tipo: string;
    }> = [];

    let cobrosMovimientosBruto = 0;

    movimientosPeriodo.forEach((m) => {
      const monto = Number(m.monto) || 0;
      if (monto <= 0) return;

      const catName = Array.isArray(m.categorias)
        ? (m.categorias[0] as unknown as { nombre?: string })?.nombre || ""
        : (m.categorias as unknown as { nombre?: string })?.nombre || "";
      const desc = m.descripcion || "";
      const text = `${catName} ${desc}`.toLowerCase();

      // Gastos clasificados en las 3 cubetas
      if (m.tipo === "gasto" || (m.tipo === "ajuste" && m.ajuste_sentido === "restar")) {
        if (SAVINGS_REGEX.test(text)) {
          gastoSavings += monto;
        } else if (WANTS_REGEX.test(text)) {
          gastoWants += monto;
        } else {
          gastoNeeds += monto;
        }
        return;
      }

      // Cobros registrados en movimientos
      if (m.tipo === "pago_prestamo") {
        cobrosMovimientosBruto += monto;
        return;
      }

      // Ingresos ordinarios registrados
      if (m.tipo === "ingreso") {
        ingresosRegularesList.push({
          id: m.id,
          monto,
          descripcion: desc || "Ingreso sin descripción",
          fecha: (m.ocurrido_en || "").slice(0, 10),
          categoria: catName || "General",
          tipo: m.tipo,
        });
        return;
      }

      // Ajustes positivos a favor
      if (m.tipo === "ajuste" && m.ajuste_sentido === "sumar") {
        ajustesPositivosList.push({
          id: m.id,
          monto,
          descripcion: desc || "Ajuste de saldo a favor",
          fecha: (m.ocurrido_en || "").slice(0, 10),
          categoria: "Ajuste (+)",
          tipo: m.tipo,
        });
        return;
      }
    });

    const totalGastado = gastoNeeds + gastoWants + gastoSavings;

    // Métricas de cobros de préstamos en el periodo
    let totalCobradoPrestamos = 0;
    let capitalDevueltoPrestamos = 0;
    let interesCobradoPrestamos = 0;

    pagosPeriodo.forEach((p) => {
      totalCobradoPrestamos += Number(p.monto_total) || 0;
      capitalDevueltoPrestamos += Number(p.monto_principal) || 0;
      interesCobradoPrestamos += Number(p.monto_interes) || 0;
    });

    // Fallback si no hay registros en tabla pagos pero sí en movimientos
    if (totalCobradoPrestamos === 0 && cobrosMovimientosBruto > 0) {
      totalCobradoPrestamos = cobrosMovimientosBruto;
    }

    const interesProyectado = Number(totals?.interest) || 0;

    // Totales brutos disponibles
    const ingresosRegularesBruto = ingresosRegularesList.reduce((sum, item) => sum + item.monto, 0);
    const ajustesPositivosBruto = ajustesPositivosList.reduce((sum, item) => sum + item.monto, 0);

    // Cálculo dinámico de componentes según configuración del usuario
    let aporteIngresos = 0;
    if (baseConfig.includeRegularIncome) {
      aporteIngresos = ingresosRegularesList
        .filter((item) => !baseConfig.excludedMovementIds.includes(item.id))
        .reduce((sum, item) => sum + item.monto, 0);
    }

    let aporteAjustes = 0;
    if (baseConfig.includeAdjustments) {
      aporteAjustes = ajustesPositivosList
        .filter((item) => !baseConfig.excludedMovementIds.includes(item.id))
        .reduce((sum, item) => sum + item.monto, 0);
    }

    let aportePrestamos = 0;
    if (baseConfig.loanMode === "interest_only") {
      aportePrestamos = interesCobradoPrestamos;
    } else if (baseConfig.loanMode === "full") {
      aportePrestamos = totalCobradoPrestamos;
    } else if (baseConfig.loanMode === "projected") {
      aportePrestamos = interesProyectado;
    } else if (baseConfig.loanMode === "none") {
      aportePrestamos = 0;
    }

    const aporteMesada = Math.max(0, baseConfig.manualExtra);

    // Base de cálculo final
    let baseCalculo = 0;
    if (baseConfig.mode === "fixed") {
      baseCalculo = Math.max(0, baseConfig.fixedAmount);
    } else {
      baseCalculo = aporteIngresos + aportePrestamos + aporteAjustes + aporteMesada;
    }

    // Si aún no hay base definida pero sí hay gastos, tomamos el gasto como referencia proporcional
    const usandoFallbackGasto = baseCalculo <= 0 && totalGastado > 0;
    if (usandoFallbackGasto) {
      baseCalculo = totalGastado;
    }

    // Ahorro libre real disponible = Base - Gastos de necesidades y deseos
    const ahorroDisponible = Math.max(0, baseCalculo - gastoNeeds - gastoWants);

    // Cupos ideales en dinero según la regla activa
    const cupoNeeds = (baseCalculo * currentConfig.needs) / 100;
    const cupoWants = (baseCalculo * currentConfig.wants) / 100;
    const metaSavings = (baseCalculo * currentConfig.savings) / 100;

    // Porcentajes de la barra (siempre suman 100%)
    let pctNeeds = 0;
    let pctWants = 0;
    let pctSavings = 0;

    if (baseCalculo > 0) {
      if (totalGastado <= baseCalculo) {
        pctNeeds = Math.round((gastoNeeds / baseCalculo) * 100);
        pctWants = Math.round((gastoWants / baseCalculo) * 100);
        pctSavings = Math.max(0, 100 - pctNeeds - pctWants);
      } else {
        const totalOut = gastoNeeds + gastoWants;
        pctNeeds = totalOut > 0 ? Math.round((gastoNeeds / totalOut) * 100) : 100;
        pctWants = totalOut > 0 ? 100 - pctNeeds : 0;
        pctSavings = 0;
      }
    }

    const disponibleNeeds = cupoNeeds - gastoNeeds;
    const disponibleWants = cupoWants - gastoWants;
    const isExceeded = baseCalculo > 0 && totalGastado > baseCalculo;

    return {
      ingresosRegularesList,
      ajustesPositivosList,
      ingresosRegularesBruto,
      ajustesPositivosBruto,
      totalCobradoPrestamos,
      capitalDevueltoPrestamos,
      interesCobradoPrestamos,
      interesProyectado,
      aporteIngresos,
      aportePrestamos,
      aporteAjustes,
      aporteMesada,
      baseCalculo,
      usandoFallbackGasto,
      totalGastado,
      gastoNeeds,
      gastoWants,
      ahorroDisponible,
      cupoNeeds,
      cupoWants,
      metaSavings,
      pctNeeds,
      pctWants,
      pctSavings,
      disponibleNeeds,
      disponibleWants,
      isExceeded,
      hasData: baseCalculo > 0 || totalGastado > 0,
    };
  }, [movimientosPeriodo, pagosPeriodo, currentConfig, totals?.interest, baseConfig]);

  // Manejadores de configuración de la base
  const handleToggleIncome = (id: string) => {
    updateBaseConfig((prev) => {
      const isExcluded = prev.excludedMovementIds.includes(id);
      return {
        ...prev,
        excludedMovementIds: isExcluded
          ? prev.excludedMovementIds.filter((item) => item !== id)
          : [...prev.excludedMovementIds, id],
      };
    });
  };

  const handleSelectAllIncomes = (select: boolean) => {
    updateBaseConfig((prev) => ({
      ...prev,
      excludedMovementIds: select ? [] : analytics.ingresosRegularesList.map((m) => m.id),
    }));
  };

  const handleSaveFixedAmount = () => {
    const val = Math.max(0, Number(tempFixedAmount) || 0);
    updateBaseConfig((prev) => ({
      ...prev,
      mode: "fixed",
      fixedAmount: val,
    }));
  };

  const handleSaveManualExtra = () => {
    const val = Math.max(0, Number(tempManualExtra) || 0);
    updateBaseConfig((prev) => ({
      ...prev,
      manualExtra: val,
    }));
    try {
      localStorage.setItem("finpal_budget_manual_extra", String(val));
    } catch {}
  };

  const handleResetBaseConfig = () => {
    updateBaseConfig(() => DEFAULT_BASE_CONFIG);
    try {
      localStorage.removeItem("finpal_budget_manual_extra");
      localStorage.removeItem("finpal_budget_base_config");
    } catch {}
    setShowBaseConfig(false);
  };

  const isBasePersonalizada = useMemo(() => {
    return (
      baseConfig.mode === "fixed" ||
      baseConfig.manualExtra > 0 ||
      baseConfig.loanMode !== "interest_only" ||
      !baseConfig.includeRegularIncome ||
      baseConfig.includeAdjustments ||
      baseConfig.excludedMovementIds.length > 0
    );
  }, [baseConfig]);

  // Diagnóstico simple, breve y conciso (máximo 1 línea)
  const consejoSimple = useMemo(() => {
    if (!analytics.hasData) {
      return "Configura tu presupuesto base o registra movimientos para activar el análisis.";
    }

    if (analytics.usandoFallbackGasto) {
      return "No has ingresado ingresos ni mesada aún; analizando sobre tus gastos reales actuales.";
    }

    if (analytics.isExceeded) {
      return `Tus gastos (${money(analytics.totalGastado)}) superan tu base analizada (${money(analytics.baseCalculo)}). Puedes ajustar tu mesada o ingresos en 'Personalizar base'.`;
    }

    if (analytics.disponibleNeeds < 0) {
      return `Superaste la meta de necesidades por ${money(Math.abs(analytics.disponibleNeeds))}. La regla 60/20/20 te otorgaría más margen en costos fijos.`;
    }

    if (analytics.disponibleWants < 0) {
      return `Te excediste en ocio por ${money(Math.abs(analytics.disponibleWants))}. Conviene moderar gustos lo que resta del mes.`;
    }

    if (analytics.ahorroDisponible >= analytics.metaSavings) {
      return `¡Excelente disciplina! Te quedan ${money(analytics.ahorroDisponible)} de ahorro libre (${analytics.pctSavings}% de tu base), alcanzando tu meta del ${currentConfig.savings}%.`;
    }

    return `Tu presupuesto está en equilibrio. Te quedan ${money(analytics.ahorroDisponible)} disponibles para ahorrar.`;
  }, [analytics, currentConfig]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 ${className}`}
    >
      {/* Cabecera limpia con botón para personalizar la base */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-surface-container-high/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base font-bold text-on-surface">
                Regla de Finanzas
              </h2>
              <span className="tech-pill font-mono font-bold text-primary text-[11px]">
                {currentConfig.needs}/{currentConfig.wants}/{currentConfig.savings}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap pt-0.5">
              <span>
                Base analizada:{" "}
                <strong className="font-mono text-on-surface">{money(analytics.baseCalculo)}</strong>
              </span>

              {/* Botón dinámico para personalizar o ver la base */}
              <button
                type="button"
                onClick={() => setShowBaseConfig(!showBaseConfig)}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
                  showBaseConfig
                    ? "bg-primary text-on-primary border-primary shadow-2xs"
                    : isBasePersonalizada
                    ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20"
                    : "bg-surface-container text-on-surface-variant border-surface-container-high/60 hover:text-on-surface"
                }`}
                title="Configurar qué ingresos, intereses o mesada componen tu base de presupuesto"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>
                  {baseConfig.mode === "fixed"
                    ? `Fija: ${money(baseConfig.fixedAmount)}`
                    : baseConfig.manualExtra > 0
                    ? `+${money(baseConfig.manualExtra)} mesada / base`
                    : isBasePersonalizada
                    ? "Base personalizada"
                    : "Personalizar base"}
                </span>
              </button>

              <span className="text-on-surface-variant/40">·</span>
              <span>
                Gastos: <strong className="font-mono text-on-surface">{money(analytics.totalGastado)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Selector de Regla y Periodo */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="inline-flex p-0.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSelectModel("50_30_20")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                modelKey === "50_30_20"
                  ? "bg-surface-container-lowest text-primary shadow-2xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              50/30/20
            </button>
            <button
              type="button"
              onClick={() => handleSelectModel("60_20_20")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                modelKey === "60_20_20"
                  ? "bg-surface-container-lowest text-primary shadow-2xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              60/20/20
            </button>
            <button
              type="button"
              onClick={() => {
                handleSelectModel("custom");
                setShowConfig(!showConfig);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                modelKey === "custom"
                  ? "bg-surface-container-lowest text-primary shadow-2xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Custom
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPeriodo(periodo === "mes_actual" ? "ultimos_30d" : "mes_actual")}
            className="tech-pill text-[11px] cursor-pointer"
          >
            {periodo === "mes_actual" ? "Este mes" : "30 días"}
          </button>
        </div>
      </div>

      {/* PANEL INTELIGENTE: PERSONALIZAR BASE DEL PRESUPUESTO */}
      <AnimatePresence>
        {showBaseConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-surface-container-low/80 border border-primary/25 space-y-4 text-xs overflow-hidden"
          >
            {/* Cabecera del Panel */}
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/60">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span className="font-heading font-bold text-sm text-on-surface">
                  Personalizar Base del Presupuesto
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBaseConfig(false)}
                className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer transition-colors"
                title="Cerrar panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Modo: Por Fuentes vs Monto Fijo */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-on-surface-variant font-medium">Modo de base:</span>
              <div className="inline-flex p-0.5 rounded-lg bg-surface-container-lowest border border-surface-container-high/80 text-xs">
                <button
                  type="button"
                  onClick={() => updateBaseConfig((p) => ({ ...p, mode: "smart" }))}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    baseConfig.mode === "smart"
                      ? "bg-primary text-on-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Por selección de fuentes</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateBaseConfig((p) => ({ ...p, mode: "fixed" }))}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    baseConfig.mode === "fixed"
                      ? "bg-primary text-on-primary font-bold shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Monto fijo manual</span>
                </button>
              </div>
            </div>

            {/* CASO A: MONTO FIJO DIRECTO */}
            {baseConfig.mode === "fixed" && (
              <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-3">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">
                    Tu presupuesto base fijo del mes ({mesNombre}):
                  </label>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Escribe directamente el monto total disponible para este mes. Tus porcentajes ({currentConfig.needs}/{currentConfig.wants}/{currentConfig.savings}) se calcularán con precisión sobre esta base, sin importar qué cobros o ingresos se registren.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[150px] max-w-[220px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-mono font-bold">
                      Bs
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={tempFixedAmount}
                      onChange={(e) => setTempFixedAmount(e.target.value)}
                      placeholder="Ej. 2500"
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-surface-container border border-outline/25 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveFixedAmount}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar base fija</span>
                  </button>
                </div>

                {/* Accesos rápidos de monto */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-on-surface-variant">
                  <span className="text-[10px] uppercase font-semibold">Sugerencias:</span>
                  {[500, 1000, 1500, 2000, 3000, 5000].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        setTempFixedAmount(String(sug));
                        updateBaseConfig((p) => ({ ...p, mode: "fixed", fixedAmount: sug }));
                      }}
                      className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-[11px] transition-colors cursor-pointer"
                    >
                      {money(sug)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CASO B: POR SELECCIÓN DE FUENTES */}
            {baseConfig.mode === "smart" && (
              <div className="space-y-3.5">
                {/* 1. Tratamiento de Préstamos y sus Intereses */}
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <WalletCards className="w-3.5 h-3.5 text-primary" />
                      <span className="font-bold text-xs text-on-surface">
                        Cobros de Préstamos en el periodo
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      Total cobrado: {money(analytics.totalCobradoPrestamos)}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Cuando cobras un préstamo, recuperar el capital prestado no es una ganancia nueva disponible para gastar, ¡es tu propio dinero retornando! Elige cómo considerarlo en tu regla:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Opción 1: Solo intereses cobrados (Recomendada) */}
                    <button
                      type="button"
                      onClick={() => updateBaseConfig((p) => ({ ...p, loanMode: "interest_only" }))}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        baseConfig.loanMode === "interest_only"
                          ? "bg-primary/10 border-primary shadow-2xs ring-1 ring-primary/30"
                          : "bg-surface-container border-surface-container-high/60 hover:border-surface-container-high"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] text-on-surface flex items-center gap-1">
                          ⭐ Solo intereses cobrados
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          +{money(analytics.interesCobradoPrestamos)}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant pt-1 leading-snug">
                        Recomendado: Solo suma la ganancia real por interés. Ignora el capital devuelto para no inflar tu presupuesto.
                      </p>
                    </button>

                    {/* Opción 2: Cobro total (Capital + Intereses) */}
                    <button
                      type="button"
                      onClick={() => updateBaseConfig((p) => ({ ...p, loanMode: "full" }))}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        baseConfig.loanMode === "full"
                          ? "bg-primary/10 border-primary shadow-2xs ring-1 ring-primary/30"
                          : "bg-surface-container border-surface-container-high/60 hover:border-surface-container-high"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] text-on-surface">
                          Cobro total (Capital + Interés)
                        </span>
                        <span className="font-mono font-bold text-on-surface text-xs">
                          +{money(analytics.totalCobradoPrestamos)}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant pt-1 leading-snug">
                        Suma todo el dinero que ingresa por cobros de préstamos en el periodo.
                      </p>
                    </button>

                    {/* Opción 3: Intereses proyectados activos */}
                    <button
                      type="button"
                      onClick={() => updateBaseConfig((p) => ({ ...p, loanMode: "projected" }))}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        baseConfig.loanMode === "projected"
                          ? "bg-primary/10 border-primary shadow-2xs ring-1 ring-primary/30"
                          : "bg-surface-container border-surface-container-high/60 hover:border-surface-container-high"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] text-on-surface">
                          Intereses proyectados del mes
                        </span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                          +{money(analytics.interesProyectado)}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant pt-1 leading-snug">
                        Usa el rendimiento mensual esperado de todos tus préstamos activos vigentes.
                      </p>
                    </button>

                    {/* Opción 4: No incluir préstamos */}
                    <button
                      type="button"
                      onClick={() => updateBaseConfig((p) => ({ ...p, loanMode: "none" }))}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        baseConfig.loanMode === "none"
                          ? "bg-primary/10 border-primary shadow-2xs ring-1 ring-primary/30"
                          : "bg-surface-container border-surface-container-high/60 hover:border-surface-container-high"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] text-on-surface">
                          No incluir préstamos
                        </span>
                        <span className="font-mono font-bold text-on-surface-variant text-xs">
                          +Bs 0
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant pt-1 leading-snug">
                        Excluye totalmente los préstamos de este indicador de presupuesto.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Mesada mensual o ingreso adicional manual */}
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-on-surface">
                      Mesada mensual / Sueldo previsto / Aporte personal
                    </span>
                    {baseConfig.manualExtra > 0 && (
                      <span className="font-mono font-bold text-primary text-xs">
                        +{money(baseConfig.manualExtra)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Si recibes mesada mensual en efectivo, sueldo estimado o aportes que no tienes registrados como transacción bancaria, agrégalo aquí:
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-mono font-bold">
                        Bs
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={tempManualExtra}
                        onChange={(e) => setTempManualExtra(e.target.value)}
                        placeholder="Ej. 1000"
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-surface-container border border-outline/25 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveManualExtra}
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar mesada</span>
                    </button>
                    {baseConfig.manualExtra > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempManualExtra("");
                          updateBaseConfig((p) => ({ ...p, manualExtra: 0 }));
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs text-on-surface-variant transition-colors cursor-pointer"
                        title="Quitar mesada manual"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px] text-on-surface-variant">
                    <span className="text-[10px] uppercase font-semibold">Accesos rápidos:</span>
                    {[200, 500, 1000, 1500, 2000].map((extra) => (
                      <button
                        key={extra}
                        type="button"
                        onClick={() => {
                          setTempManualExtra(String(extra));
                          updateBaseConfig((p) => ({ ...p, manualExtra: extra }));
                        }}
                        className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface font-mono text-[11px] transition-colors cursor-pointer"
                      >
                        +{money(extra)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Ingresos Ordinarios Registrados (con selector individual para excluir devoluciones) */}
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={baseConfig.includeRegularIncome}
                        onChange={(e) =>
                          updateBaseConfig((p) => ({ ...p, includeRegularIncome: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="font-bold text-xs text-on-surface">
                        Incluir ingresos registrados de movimientos
                      </span>
                    </label>
                    <span className="font-mono font-bold text-xs text-on-surface">
                      +{money(analytics.aporteIngresos)}
                    </span>
                  </div>

                  {baseConfig.includeRegularIncome && analytics.ingresosRegularesList.length > 0 && (
                    <div className="pt-1 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => setShowIncomeList(!showIncomeList)}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
                        >
                          {showIncomeList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          <span>
                            {showIncomeList
                              ? "Ocultar lista de ingresos individuales"
                              : `Elegir ingresos individuales (${analytics.ingresosRegularesList.length - baseConfig.excludedMovementIds.length} de ${analytics.ingresosRegularesList.length} seleccionados)`}
                          </span>
                        </button>

                        {showIncomeList && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSelectAllIncomes(true)}
                              className="text-primary hover:underline cursor-pointer"
                            >
                              Marcar todos
                            </button>
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => handleSelectAllIncomes(false)}
                              className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                            >
                              Desmarcar todos
                            </button>
                          </div>
                        )}
                      </div>

                      {showIncomeList && (
                        <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container-high/60 max-h-48 overflow-y-auto space-y-1.5">
                          <p className="text-[10px] text-on-surface-variant pb-1 border-b border-surface-container-high/40">
                            💡 Si alguien te devolvió dinero de una salida compartida o una compra, desmárcalo aquí para que no infle tus metas de gasto y ahorro:
                          </p>
                          {analytics.ingresosRegularesList.map((item) => {
                            const isExcluded = baseConfig.excludedMovementIds.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleToggleIncome(item.id)}
                                className={`flex items-center justify-between p-2 rounded-md transition-colors cursor-pointer select-none text-xs ${
                                  isExcluded
                                    ? "opacity-50 line-through bg-surface-container-high/20"
                                    : "bg-surface-container hover:bg-surface-container-high/80"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                  {isExcluded ? (
                                    <Square className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                                  ) : (
                                    <CheckSquare className="w-3.5 h-3.5 text-primary shrink-0" />
                                  )}
                                  <div className="truncate">
                                    <span className="font-medium text-on-surface truncate block">
                                      {item.descripcion}
                                    </span>
                                    <span className="text-[10px] text-on-surface-variant font-mono">
                                      {item.fecha} · {item.categoria}
                                    </span>
                                  </div>
                                </div>
                                <span className={`font-mono font-bold shrink-0 ${isExcluded ? "text-on-surface-variant" : "text-emerald-600 dark:text-emerald-400"}`}>
                                  {isExcluded ? "(Excluido) " : "+"}{money(item.monto)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {baseConfig.includeRegularIncome && analytics.ingresosRegularesList.length === 0 && (
                    <p className="text-[11px] text-on-surface-variant/70 italic">
                      No hay transacciones de ingreso ordinarias registradas en este periodo.
                    </p>
                  )}
                </div>

                {/* 4. Ajustes de saldo a favor */}
                <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 flex items-center justify-between">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={baseConfig.includeAdjustments}
                        onChange={(e) =>
                          updateBaseConfig((p) => ({ ...p, includeAdjustments: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="font-bold text-xs text-on-surface">
                        Incluir ajustes manuales de saldo (+) a favor
                      </span>
                    </label>
                    <p className="text-[10px] text-on-surface-variant pl-6 pt-0.5">
                      Desactivado por defecto para no distorsionar con correcciones de cuentas.
                    </p>
                  </div>
                  {baseConfig.includeAdjustments && (
                    <span className="font-mono font-bold text-xs text-on-surface">
                      +{money(analytics.aporteAjustes)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Resumen Visual de la Base Resultante */}
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-primary block">
                  Base resultante para el cálculo del 50/30/20:
                </span>
                <div className="text-[10px] text-on-surface-variant font-mono flex flex-wrap gap-x-2 gap-y-0.5 pt-0.5">
                  {baseConfig.mode === "fixed" ? (
                    <span>Monto fijo manual establecido</span>
                  ) : (
                    <>
                      <span>Mesada: +{money(analytics.aporteMesada)}</span>
                      <span>·</span>
                      <span>Préstamos: +{money(analytics.aportePrestamos)}</span>
                      <span>·</span>
                      <span>Ingresos elegidos: +{money(analytics.aporteIngresos)}</span>
                      {analytics.aporteAjustes > 0 && (
                        <>
                          <span>·</span>
                          <span>Ajustes: +{money(analytics.aporteAjustes)}</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="font-mono font-black text-base text-primary self-start sm:self-auto">
                {money(analytics.baseCalculo)}
              </div>
            </div>

            {/* Botones de acción del panel */}
            <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/40">
              <button
                type="button"
                onClick={handleResetBaseConfig}
                className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface cursor-pointer py-1"
                title="Restablecer a valores automáticos sugeridos"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer automáticos</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBaseConfig(false)}
                className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Listo y aplicar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliders solo si elige Custom en los porcentajes */}
      <AnimatePresence>
        {modelKey === "custom" && showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60 space-y-3 overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between font-semibold text-on-surface">
              <span>Personalizar metas</span>
              <span className="font-mono text-on-surface-variant">Total: 100%</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase font-semibold text-on-surface-variant block mb-1">
                  Necesidades ({customNeeds}%)
                </label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  step="5"
                  value={customNeeds}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCustomNeeds(val);
                    if (val + customWants > 95) setCustomWants(Math.max(5, 95 - val));
                  }}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-on-surface-variant block mb-1">
                  Deseos ({customWants}%)
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={customWants}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (customNeeds + val <= 95) setCustomWants(val);
                  }}
                  className="w-full accent-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-semibold text-on-surface-variant block mb-1">
                  Ahorro ({customSavings}%)
                </label>
                <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 pt-1">
                  {customSavings}% restante
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra Única y Limpia de Distribución (Siempre 100%) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] text-on-surface-variant">
            Distribución de tu dinero:
          </span>
          <div className="flex items-center gap-3 text-[11px] font-mono font-semibold">
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {analytics.pctNeeds}% Fijos
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {analytics.pctWants}% Ocio
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {analytics.pctSavings}% Ahorro
            </span>
          </div>
        </div>

        {/* Barra de progreso única */}
        <div className="h-2 w-full bg-surface-container-high/60 rounded-full overflow-hidden flex gap-0.5">
          {analytics.hasData ? (
            <>
              {analytics.pctNeeds > 0 && (
                <motion.div
                  layout
                  className="h-full bg-blue-500 rounded-l-full transition-all duration-300"
                  style={{ width: `${analytics.pctNeeds}%` }}
                  title={`Necesidades: ${analytics.pctNeeds}% (${money(analytics.gastoNeeds)})`}
                />
              )}
              {analytics.pctWants > 0 && (
                <motion.div
                  layout
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${analytics.pctWants}%` }}
                  title={`Ocio y Deseos: ${analytics.pctWants}% (${money(analytics.gastoWants)})`}
                />
              )}
              {analytics.pctSavings > 0 && (
                <motion.div
                  layout
                  className="h-full bg-emerald-500 rounded-r-full transition-all duration-300"
                  style={{ width: `${analytics.pctSavings}%` }}
                  title={`Ahorro libre: ${analytics.pctSavings}% (${money(analytics.ahorroDisponible)})`}
                />
              )}
            </>
          ) : (
            <div className="h-full w-full bg-surface-container rounded-full opacity-40" />
          )}
        </div>
      </div>

      {/* Grid de las 3 Cubetas: Sencillas, Claras y Sin Sobrecarga */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Cubeta 1: Necesidades */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-container-high/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Home className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs text-on-surface">Necesidades</h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                analytics.disponibleNeeds >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {analytics.disponibleNeeds >= 0 ? "En meta" : "Excedido"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-extrabold text-on-surface">
                {money(analytics.gastoNeeds)}
              </span>
              <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                Meta: {money(analytics.cupoNeeds)} ({currentConfig.needs}%)
              </span>
            </div>

            <p className="text-[11px] text-on-surface-variant pt-1 border-t border-surface-container-high/40 mt-1">
              {analytics.disponibleNeeds >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  Te quedan {money(analytics.disponibleNeeds)}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono">
                  Excedido por +{money(Math.abs(analytics.disponibleNeeds))}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Cubeta 2: Deseos & Ocio */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-container-high/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <PartyPopper className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs text-on-surface">Deseos & Ocio</h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                analytics.disponibleWants >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {analytics.disponibleWants >= 0 ? "Bajo control" : "Excedido"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-extrabold text-on-surface">
                {money(analytics.gastoWants)}
              </span>
              <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                Meta: {money(analytics.cupoWants)} ({currentConfig.wants}%)
              </span>
            </div>

            <p className="text-[11px] text-on-surface-variant pt-1 border-t border-surface-container-high/40 mt-1">
              {analytics.disponibleWants >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  Te quedan {money(analytics.disponibleWants)}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono">
                  Excedido por +{money(Math.abs(analytics.disponibleWants))}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Cubeta 3: Ahorro */}
        <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-container-high/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <PiggyBank className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-xs text-on-surface">Ahorro</h3>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                analytics.ahorroDisponible >= analytics.metaSavings && analytics.ahorroDisponible > 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {analytics.ahorroDisponible >= analytics.metaSavings && analytics.ahorroDisponible > 0
                ? "Cumplido"
                : "Bajo meta"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {money(analytics.ahorroDisponible)}
              </span>
              <span className="text-[11px] font-mono text-on-surface-variant font-medium">
                Meta: {money(analytics.metaSavings)} ({currentConfig.savings}%)
              </span>
            </div>

            <p className="text-[11px] text-on-surface-variant pt-1 border-t border-surface-container-high/40 mt-1 font-mono">
              {analytics.ahorroDisponible >= analytics.metaSavings && analytics.ahorroDisponible > 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Meta alcanzada (+{money(analytics.ahorroDisponible - analytics.metaSavings)})
                </span>
              ) : analytics.ahorroDisponible > 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Faltan {money(analytics.metaSavings - analytics.ahorroDisponible)}
                </span>
              ) : (
                <span className="text-rose-500 font-semibold">
                  Sin remanente (gastos &gt; base)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Consejo conciso de 1 línea */}
      <div className="p-2.5 rounded-xl bg-surface-container-low/40 border border-surface-container-high/40 flex items-center gap-2 text-xs">
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <p className="text-on-surface-variant leading-tight">
          {consejoSimple}
        </p>
      </div>
    </motion.div>
  );
}
