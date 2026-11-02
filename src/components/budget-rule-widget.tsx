"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart,
  Sliders,
  Sparkles,
  Home,
  PartyPopper,
  PiggyBank,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Percent,
} from "lucide-react";
import { money, type Movimiento } from "@/lib/dashboard-context";
import { formatMonthYear, getLocalDateString } from "@/lib/format-date";

export type BudgetModelKey = "50_30_20" | "60_20_20" | "custom";

interface BudgetModelConfig {
  id: BudgetModelKey;
  label: string;
  description: string;
  needs: number;
  wants: number;
  savings: number;
}

const BUDGET_MODELS: Record<BudgetModelKey, BudgetModelConfig> = {
  "50_30_20": {
    id: "50_30_20",
    label: "Regla 50 / 30 / 20",
    description: "Equilibrio estándar: 50% necesidades básicas, 30% estilo de vida/deseos y 20% ahorro/inversión.",
    needs: 50,
    wants: 30,
    savings: 20,
  },
  "60_20_20": {
    id: "60_20_20",
    label: "Regla 60 / 20 / 20",
    description: "Especial para costos fijos mayores: 60% compromisos fijos, 20% ocio y 20% ahorro.",
    needs: 60,
    wants: 20,
    savings: 20,
  },
  custom: {
    id: "custom",
    label: "Personalizada",
    description: "Configura los porcentajes exactos que mejor se adapten a tus metas personales.",
    needs: 50,
    wants: 25,
    savings: 25,
  },
};

// Expresiones regulares para categorización inteligente de movimientos en español
const NEEDS_REGEX =
  /(alquiler|arriendo|vivienda|casa|depa|luz|agua|gas|electricidad|internet|wifi|celular|telefonia|comida|supermercado|mercado|alimento|almuerzo|desayuno|cena|canasta|transporte|gasolina|combustible|pasaje|micro|bus|seguro|salud|medico|farmacia|medicina|doctor|clinica|dentista|educacion|colegio|universidad|pension|impuesto|tributo|cuota|servicio|mantenimiento)/i;

const WANTS_REGEX =
  /(ocio|diversion|salida|salidas|fiesta|bar|cerveza|trago|restaurante|cafe|cafeteria|delivery|pedidosya|uber|cine|pelicula|streaming|netflix|spotify|disney|juego|videojuego|ropa|vestimenta|zapato|zapatos|moda|viaje|vacacion|hotel|hobby|hobbies|regalo|gusto|antojo|compras|shopping|belleza|peluqueria|spa)/i;

const SAVINGS_REGEX =
  /(ahorro|inversion|fondo|plazo fijo|bolsa|acciones|cripto|dolar|dolares|reserva|emergencia|recapitalizacion)/i;

export interface BudgetRuleWidgetProps {
  movimientos: Movimiento[];
  zonaHoraria?: string;
  className?: string;
  compact?: boolean;
}

export function BudgetRuleWidget({
  movimientos,
  zonaHoraria = "America/La_Paz",
  className = "",
  compact = false,
}: BudgetRuleWidgetProps) {
  // Carga y sincronización de preferencia de modelo en localStorage
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

  const customSavings = Math.max(0, 100 - customNeeds - customWants);

  const currentConfig: BudgetModelConfig = useMemo(() => {
    if (modelKey === "custom") {
      return {
        id: "custom",
        label: "Personalizada",
        description: `Metas definidas por ti: ${customNeeds}% Fijos, ${customWants}% Deseos y ${customSavings}% Ahorro.`,
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

  // Cálculo de fechas
  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getLocalDateString(now, zonaHoraria), [now, zonaHoraria]);
  const currentYearMonth = todayStr.slice(0, 7);
  const mesNombre = useMemo(() => formatMonthYear(currentYearMonth), [currentYearMonth]);

  // Filtrado de movimientos del periodo seleccionado
  const movimientosPeriodo = useMemo(() => {
    if (periodo === "mes_actual") {
      return movimientos.filter((m) => (m.ocurrido_en || "").slice(0, 7) === currentYearMonth);
    }
    // Últimos 30 días
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return movimientos.filter((m) => (m.ocurrido_en || "").slice(0, 10) >= cutoff);
  }, [movimientos, periodo, currentYearMonth, now]);

  // Motor analítico de las 3 cubetas
  const analytics = useMemo(() => {
    let ingresos = 0;
    let gastoNeeds = 0;
    let gastoWants = 0;
    let gastoSavings = 0;

    movimientosPeriodo.forEach((m) => {
      const monto = Number(m.monto) || 0;
      if (monto <= 0) return;

      const catName = Array.isArray(m.categorias)
        ? (m.categorias[0] as unknown as { nombre?: string })?.nombre || ""
        : (m.categorias as unknown as { nombre?: string })?.nombre || "";
      const desc = m.descripcion || "";
      const text = `${catName} ${desc}`.toLowerCase();

      // Ingresos reconocidos
      if (m.tipo === "ingreso" || m.tipo === "pago_prestamo") {
        ingresos += monto;
        return;
      }

      if (m.tipo === "ajuste" && m.ajuste_sentido === "sumar") {
        ingresos += monto;
        return;
      }

      // Desembolso de préstamos se cuenta como inversión de capital (cubeta de ahorro/inversión)
      if (m.tipo === "entrega_prestamo") {
        gastoSavings += monto;
        return;
      }

      // Gastos clasificados en las 3 cubetas
      if (m.tipo === "gasto" || (m.tipo === "ajuste" && m.ajuste_sentido === "restar")) {
        if (SAVINGS_REGEX.test(text)) {
          gastoSavings += monto;
        } else if (WANTS_REGEX.test(text)) {
          gastoWants += monto;
        } else {
          // Por defecto, o si coincide con necesidades
          gastoNeeds += monto;
        }
      }
    });

    const totalGastado = gastoNeeds + gastoWants + gastoSavings;
    // Si los ingresos son mayores a lo gastado, el remanente cuenta como Ahorro efectivo del periodo
    const remanenteAhorro = Math.max(0, ingresos - totalGastado);
    const ahorroTotal = gastoSavings + remanenteAhorro;

    // Base del 100%: si hay ingresos, es sobre ingresos; si no hay ingresos aún, se calcula sobre el total gastado
    const baseTotal = ingresos > 0 ? ingresos : totalGastado;

    const pctNeeds = baseTotal > 0 ? Math.round((gastoNeeds / baseTotal) * 100) : 0;
    const pctWants = baseTotal > 0 ? Math.round((gastoWants / baseTotal) * 100) : 0;
    const pctSavings = baseTotal > 0 ? Math.round((ahorroTotal / baseTotal) * 100) : 0;

    // Cupos ideales según la regla
    const cupoIdealNeeds = (baseTotal * currentConfig.needs) / 100;
    const cupoIdealWants = (baseTotal * currentConfig.wants) / 100;
    const cupoIdealSavings = (baseTotal * currentConfig.savings) / 100;

    const disponibleNeeds = cupoIdealNeeds - gastoNeeds;
    const disponibleWants = cupoIdealWants - gastoWants;

    return {
      ingresos,
      totalGastado,
      baseTotal,
      gastoNeeds,
      gastoWants,
      gastoSavings,
      ahorroTotal,
      remanenteAhorro,
      pctNeeds,
      pctWants,
      pctSavings,
      cupoIdealNeeds,
      cupoIdealWants,
      cupoIdealSavings,
      disponibleNeeds,
      disponibleWants,
      hasData: baseTotal > 0,
    };
  }, [movimientosPeriodo, currentConfig]);

  // Diagnóstico inteligente
  const diagnosis = useMemo(() => {
    if (!analytics.hasData) {
      return {
        type: "neutral",
        text: "Registra tus ingresos y gastos de este mes para analizar en tiempo real el cumplimiento de tu presupuesto.",
      };
    }

    if (analytics.pctWants > currentConfig.wants + 5) {
      const exceso = analytics.pctWants - currentConfig.wants;
      return {
        type: "warning",
        text: `Atención con los deseos y ocio: representan el ${analytics.pctWants}% de tus ingresos (+${exceso}% sobre tu meta del ${currentConfig.wants}%). Te sugerimos moderar consumos discrecionales.`,
      };
    }

    if (analytics.pctNeeds > currentConfig.needs + 5) {
      const exceso = analytics.pctNeeds - currentConfig.needs;
      return {
        type: "warning",
        text: `Tus necesidades y gastos fijos absorben el ${analytics.pctNeeds}% (+${exceso}% de tu meta del ${currentConfig.needs}%). La regla 60/20/20 se adaptaría mejor a tu estructura actual.`,
      };
    }

    if (analytics.pctSavings >= currentConfig.savings) {
      return {
        type: "success",
        text: `¡Excelente disciplina! Estás ahorrando e invirtiendo el ${analytics.pctSavings}% de tus ingresos, alcanzando con éxito tu meta del ${currentConfig.savings}%.`,
      };
    }

    return {
      type: "neutral",
      text: `Tu distribución actual se mantiene equilibrada. Estás a ${Math.max(0, currentConfig.savings - analytics.pctSavings)}% de tu meta óptima de ahorro.`,
    };
  }, [analytics, currentConfig]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className={`bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl p-4 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-5 ${className}`}
    >
      {/* Cabecera del Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container-high/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface">
                Regla de Finanzas
              </h2>
              <span className="tech-pill font-mono font-bold text-primary">
                {currentConfig.needs}/{currentConfig.wants}/{currentConfig.savings}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant">
              Distribución de ingresos en {periodo === "mes_actual" ? mesNombre : "últimos 30 días"}
            </p>
          </div>
        </div>

        {/* Selector de Regla y Periodo */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {/* Selector de Regla */}
          <div className="inline-flex p-0.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleSelectModel("50_30_20")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                modelKey === "50_30_20"
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
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
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
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
                  ? "bg-surface-container-lowest text-primary shadow-2xs"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              title="Personalizar porcentajes de las cubetas"
            >
              Custom
            </button>
          </div>

          {/* Toggle de Periodo */}
          <button
            type="button"
            onClick={() => setPeriodo(periodo === "mes_actual" ? "ultimos_30d" : "mes_actual")}
            className="tech-pill hover:border-primary/40 text-[11px] cursor-pointer"
            title="Alternar entre mes actual y últimos 30 días"
          >
            {periodo === "mes_actual" ? "Este mes" : "30 días"}
          </button>
        </div>
      </div>

      {/* Panel Desplegable de Configuración Custom */}
      <AnimatePresence>
        {modelKey === "custom" && showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-surface-container-low/60 border border-surface-container-high/60 space-y-3 overflow-hidden text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Ajustar porcentajes meta</span>
              <span className="font-mono text-on-surface-variant">Suma total: 100%</span>
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
                    if (val + customWants > 95) {
                      setCustomWants(Math.max(5, 95 - val));
                    }
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
                    if (customNeeds + val <= 95) {
                      setCustomWants(val);
                    }
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

      {/* Micro-Barra Tri-color de Distribución Proporcional */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] text-on-surface-variant font-medium">
            Ingresos base analizados:{" "}
            <strong className="text-on-surface font-mono">{money(analytics.baseTotal)}</strong>
          </span>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {analytics.pctNeeds}% Fijos
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {analytics.pctWants}% Ocio
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {analytics.pctSavings}% Ahorro
            </span>
          </div>
        </div>

        {/* Barra de progreso combinada */}
        <div className="h-2.5 w-full bg-surface-container-high/60 rounded-full overflow-hidden flex p-0.5 gap-0.5">
          {analytics.hasData ? (
            <>
              <div
                className="h-full bg-blue-500 rounded-l-full transition-all duration-500"
                style={{ width: `${Math.max(2, analytics.pctNeeds)}%` }}
                title={`Necesidades básicas: ${analytics.pctNeeds}% (${money(analytics.gastoNeeds)})`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.max(2, analytics.pctWants)}%` }}
                title={`Deseos y estilo de vida: ${analytics.pctWants}% (${money(analytics.gastoWants)})`}
              />
              <div
                className="h-full bg-emerald-500 rounded-r-full transition-all duration-500"
                style={{ width: `${Math.max(2, analytics.pctSavings)}%` }}
                title={`Ahorro e inversión: ${analytics.pctSavings}% (${money(analytics.ahorroTotal)})`}
              />
            </>
          ) : (
            <div className="h-full w-full bg-surface-container rounded-full opacity-40" />
          )}
        </div>
      </div>

      {/* Grid de las 3 Cubetas Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Cubeta 1: Necesidades Básicas */}
        <div className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high/60 flex flex-col justify-between space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Home className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-on-surface">Necesidades</h3>
                <span className="text-[10px] text-on-surface-variant block">Alquiler, comida, servicios</span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                analytics.pctNeeds <= currentConfig.needs
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  analytics.pctNeeds <= currentConfig.needs ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {analytics.pctNeeds <= currentConfig.needs ? "En meta" : "Excedido"}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-extrabold text-on-surface">
                {money(analytics.gastoNeeds)}
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {analytics.pctNeeds}%
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-surface-container-high/40 mt-1">
              <span>Meta: {currentConfig.needs}% ({money(analytics.cupoIdealNeeds)})</span>
              <span className="font-mono font-medium">
                {analytics.disponibleNeeds >= 0
                  ? `Libre: ${money(analytics.disponibleNeeds)}`
                  : `+${money(Math.abs(analytics.disponibleNeeds))}`}
              </span>
            </div>
          </div>
        </div>

        {/* Cubeta 2: Deseos & Ocio */}
        <div className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high/60 flex flex-col justify-between space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <PartyPopper className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-on-surface">Deseos & Ocio</h3>
                <span className="text-[10px] text-on-surface-variant block">Salidas, delivery, gustos</span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                analytics.pctWants <= currentConfig.wants
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  analytics.pctWants <= currentConfig.wants ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {analytics.pctWants <= currentConfig.wants ? "Saludable" : "Excedido"}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-extrabold text-on-surface">
                {money(analytics.gastoWants)}
              </span>
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                {analytics.pctWants}%
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-surface-container-high/40 mt-1">
              <span>Meta: {currentConfig.wants}% ({money(analytics.cupoIdealWants)})</span>
              <span className="font-mono font-medium">
                {analytics.disponibleWants >= 0
                  ? `Cupo: ${money(analytics.disponibleWants)}`
                  : `+${money(Math.abs(analytics.disponibleWants))}`}
              </span>
            </div>
          </div>
        </div>

        {/* Cubeta 3: Ahorro & Inversión */}
        <div className="p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high/60 flex flex-col justify-between space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <PiggyBank className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-on-surface">Ahorro / Inversión</h3>
                <span className="text-[10px] text-on-surface-variant block">Superávit, reserva, créditos</span>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                analytics.pctSavings >= currentConfig.savings
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  analytics.pctSavings >= currentConfig.savings ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {analytics.pctSavings >= currentConfig.savings ? "Cumplido" : "Bajo meta"}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {money(analytics.ahorroTotal)}
              </span>
              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {analytics.pctSavings}%
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-1 border-t border-surface-container-high/40 mt-1">
              <span>Meta: {currentConfig.savings}% ({money(analytics.cupoIdealSavings)})</span>
              <span className="font-mono font-medium">
                {analytics.remanenteAhorro > 0 ? `Superávit libre` : `En reservas`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnóstico & Consejo Inteligente */}
      <div className="p-3 rounded-xl bg-surface-container-low/40 border border-surface-container-high/40 flex items-center gap-2.5 text-xs">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <p className="text-on-surface-variant leading-relaxed">
          {diagnosis.text}
        </p>
      </div>
    </motion.div>
  );
}
