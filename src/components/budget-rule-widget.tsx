"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart,
  Sparkles,
  Home,
  PartyPopper,
  PiggyBank,
  Pencil,
  Check,
  RotateCcw,
  Plus,
} from "lucide-react";
import { money, useDashboard, type Movimiento } from "@/lib/dashboard-context";
import { formatMonthYear, getLocalDateString } from "@/lib/format-date";

export type BudgetModelKey = "50_30_20" | "60_20_20" | "custom";

interface BudgetModelConfig {
  id: BudgetModelKey;
  label: string;
  needs: number;
  wants: number;
  savings: number;
}

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
}: BudgetRuleWidgetProps) {
  // Contexto central para obtener intereses proyectados de préstamos activos
  const { totals } = useDashboard();

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

  // Ingreso manual adicional (mesada, sueldo estimado, ingresos previstos)
  const [manualExtra, setManualExtra] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const saved = localStorage.getItem("finpal_budget_manual_extra");
      const num = Number(saved);
      return !isNaN(num) && num > 0 ? num : 0;
    } catch {
      return 0;
    }
  });
  const [showManualBase, setShowManualBase] = useState<boolean>(false);
  const [tempManualExtra, setTempManualExtra] = useState<string>(() =>
    manualExtra > 0 ? String(manualExtra) : ""
  );

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

  const handleSaveManualExtra = () => {
    const val = Math.max(0, Number(tempManualExtra) || 0);
    setManualExtra(val);
    try {
      localStorage.setItem("finpal_budget_manual_extra", String(val));
    } catch {}
    setShowManualBase(false);
  };

  const handleClearManualExtra = () => {
    setManualExtra(0);
    setTempManualExtra("");
    try {
      localStorage.removeItem("finpal_budget_manual_extra");
    } catch {}
    setShowManualBase(false);
  };

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getLocalDateString(now, zonaHoraria), [now, zonaHoraria]);
  const currentYearMonth = todayStr.slice(0, 7);
  const mesNombre = useMemo(() => formatMonthYear(currentYearMonth), [currentYearMonth]);

  const movimientosPeriodo = useMemo(() => {
    if (periodo === "mes_actual") {
      return movimientos.filter((m) => (m.ocurrido_en || "").slice(0, 7) === currentYearMonth);
    }
    const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return movimientos.filter((m) => (m.ocurrido_en || "").slice(0, 10) >= cutoff);
  }, [movimientos, periodo, currentYearMonth, now]);

  // Motor analítico inteligente: Combina ingresos reales + intereses automáticos de préstamos + mesada/adicional manual
  const analytics = useMemo(() => {
    let ingresosCobrados = 0;
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

      // Ingresos reales cobrados
      if (m.tipo === "ingreso" || m.tipo === "pago_prestamo") {
        ingresosCobrados += monto;
        return;
      }

      if (m.tipo === "ajuste" && m.ajuste_sentido === "sumar") {
        ingresosCobrados += monto;
        return;
      }

      // Gastos clasificados en las 3 cubetas
      if (m.tipo === "gasto" || (m.tipo === "ajuste" && m.ajuste_sentido === "restar")) {
        if (SAVINGS_REGEX.test(text)) {
          gastoSavings += monto;
        } else if (WANTS_REGEX.test(text)) {
          gastoWants += monto;
        } else {
          gastoNeeds += monto;
        }
      }
    });

    const totalGastado = gastoNeeds + gastoWants + gastoSavings;

    // Rendimiento automático proyectado por intereses de préstamos activos cargados en Finpal
    const interesProyectado = Number(totals?.interest) || 0;
    // La base automática toma lo cobrado o lo proyectado por intereses del mes
    const baseAutomatica = Math.max(ingresosCobrados, interesProyectado);

    // Base total calculada: Base automática (cobros/intereses) + Monto adicional manual (mesada / previsto)
    let baseCalculo = baseAutomatica + manualExtra;
    if (baseCalculo <= 0 && totalGastado > 0) {
      baseCalculo = totalGastado;
    }

    // En la regla 50/30/20, el ahorro real es lo que te queda disponible de tu base después de tus gastos:
    // Ahorro = Base - Gastos
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
      ingresosCobrados,
      interesProyectado,
      manualExtra,
      baseCalculo,
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
  }, [movimientosPeriodo, currentConfig, totals?.interest, manualExtra]);

  // Diagnóstico simple, breve y conciso (máximo 1 línea)
  const consejoSimple = useMemo(() => {
    if (!analytics.hasData) {
      return "Registra tus ingresos o ajusta tu presupuesto base para activar el cálculo.";
    }

    if (analytics.isExceeded) {
      return `Tus gastos (${money(analytics.totalGastado)}) superan la base analizada (${money(analytics.baseCalculo)}). Puedes agregar tus demás ingresos o mesada prevista arriba.`;
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
      {/* Cabecera limpia con botón para agregar mesada o ajustar base */}
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
              <button
                type="button"
                onClick={() => setShowManualBase(!showManualBase)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                title="Configurar mesada o ingresos previstos"
              >
                <Pencil className="w-3 h-3" />
                <span>{manualExtra > 0 ? `+${money(manualExtra)} mesada/extra` : "+ Agregar mesada / sueldo"}</span>
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

      {/* Mini-Panel Desplegable: Agregar Mesada / Ajustar Base de Ingreso */}
      <AnimatePresence>
        {showManualBase && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-xl bg-surface-container-low/70 border border-primary/25 space-y-2.5 text-xs overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-on-surface">
                Ajustar presupuesto base del mes
              </span>
              <button
                type="button"
                onClick={() => setShowManualBase(false)}
                className="text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Si recibes mesada mensual, sueldo fijo o esperas dinero que aún no cobraste, agrégalo aquí para que tus metas no se distorsionen:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-mono">
                  Bs
                </span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={tempManualExtra}
                  onChange={(e) => setTempManualExtra(e.target.value)}
                  placeholder="Ej. 100"
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-outline/25 text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveManualExtra}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar a la base</span>
              </button>
              {manualExtra > 0 && (
                <button
                  type="button"
                  onClick={handleClearManualExtra}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs text-on-surface-variant transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              )}
            </div>
            <div className="text-[10px] text-on-surface-variant font-mono pt-1 border-t border-surface-container-high/40 flex flex-wrap gap-2">
              <span>Cobrado en movimientos: {money(analytics.ingresosCobrados)}</span>
              {analytics.interesProyectado > 0 && (
                <span>· Intereses de préstamos: {money(analytics.interesProyectado)}</span>
              )}
              {manualExtra > 0 && (
                <span className="text-primary font-bold">· Mesada / Extra agregado: +{money(manualExtra)}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sliders solo si elige Custom */}
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
