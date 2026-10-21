"use client";

import { useState, useCallback, useMemo, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  SlidersHorizontal,
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  LayoutGrid,
  RotateCcw,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  X,
  Trash2,
} from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { useDashboard, rel, loanBalance, type Prestamo } from "@/lib/dashboard-context";
import {
  type ReportesBiProps,
  type ReportWidgetItem,
  type ReportWidgetKey,
  type EstadoFilter,
  type PeriodoFilter,
  REPORT_WIDGETS_CATALOG,
} from "./types";
import { useReportesData } from "./use-reportes-data";
import { exportarExcel, exportarCsv } from "./reportes-export";

// Widgets modulares
import { WidgetKpiFlujo } from "./widgets/widget-kpi-flujo";
import { WidgetKpiCartera } from "./widgets/widget-kpi-cartera";
import { WidgetChartHistorico } from "./widgets/widget-chart-historico";
import { WidgetFlujoNeto } from "./widgets/widget-flujo-neto";
import { WidgetChartSalud } from "./widgets/widget-chart-salud";
import { WidgetTopDeudores } from "./widgets/widget-top-deudores";
import { WidgetLiquidezCuentas } from "./widgets/widget-liquidez-cuentas";
import { WidgetSmartInsights } from "./widgets/widget-smart-insights";
import { WidgetTablaAuditoria } from "./widgets/widget-tabla-auditoria";

export type { ReportWidgetKey, ReportWidgetItem, ReportesBiProps };

const STORAGE_KEY = "finpal_reportes_widgets_v1";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ReportesBiDashboard({
  prestamos,
  pagos,
  cuentas,
  movimientos,
  contactos,
}: ReportesBiProps) {
  const { setSuccessNotice } = useDashboard();
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // ─── Estado del Tablero de Widgets Personalizable Looker Studio ─────────
  const [widgets, setWidgets] = useState<ReportWidgetItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const savedMap = new Map(parsed.map((item: ReportWidgetItem) => [item.id, item]));
            return REPORT_WIDGETS_CATALOG.map((cat) => {
              const s = savedMap.get(cat.id);
              return s ? { ...cat, ...s } : cat;
            });
          }
        }
      } catch {
        // ignore
      }
    }
    return REPORT_WIDGETS_CATALOG;
  });

  const [modalPersonalizar, setModalPersonalizar] = useState(false);
  const [showConfirmLimpiar, setShowConfirmLimpiar] = useState(false);
  const [draggedWidgetIndex, setDraggedWidgetIndex] = useState<number | null>(null);
  const [canDragIndex, setCanDragIndex] = useState<number | null>(null);

  const saveWidgets = useCallback((newWidgets: ReportWidgetItem[]) => {
    setWidgets(newWidgets);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
    } catch {
      // ignore
    }
  }, []);

  const visibleWidgets = useMemo(() => widgets.filter((w) => w.visible), [widgets]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedWidgetIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedWidgetIndex === null || draggedWidgetIndex === targetIndex) {
      setDraggedWidgetIndex(null);
      setCanDragIndex(null);
      return;
    }

    const visible = widgets.filter((w) => w.visible);
    const hidden = widgets.filter((w) => !w.visible);

    const newVisible = [...visible];
    const [moved] = newVisible.splice(draggedWidgetIndex, 1);
    newVisible.splice(targetIndex, 0, moved);

    saveWidgets([...newVisible, ...hidden]);
    setDraggedWidgetIndex(null);
    setCanDragIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetIndex(null);
    setCanDragIndex(null);
  };

  const moveWidget = (visibleIndex: number, direction: "up" | "down") => {
    const visible = widgets.filter((w) => w.visible);
    const hidden = widgets.filter((w) => !w.visible);
    const targetIndex = direction === "up" ? visibleIndex - 1 : visibleIndex + 1;
    if (targetIndex < 0 || targetIndex >= visible.length) return;

    const newVisible = [...visible];
    const [moved] = newVisible.splice(visibleIndex, 1);
    newVisible.splice(targetIndex, 0, moved);

    saveWidgets([...newVisible, ...hidden]);
  };

  const toggleWidgetWidth = (id: ReportWidgetKey) => {
    const next = widgets.map((w) => {
      if (w.id === id) {
        return { ...w, colSpan: (w.colSpan === 12 ? 6 : 12) as 12 | 6 };
      }
      return w;
    });
    saveWidgets(next);
  };

  const removeWidget = (id: ReportWidgetKey) => {
    const next = widgets.map((w) => (w.id === id ? { ...w, visible: false } : w));
    saveWidgets(next);
    setSuccessNotice("Widget quitado del reporte");
  };

  const handleConfirmarLimpiar = () => {
    const cleared = widgets.map((w) => ({ ...w, visible: false }));
    saveWidgets(cleared);
    setShowConfirmLimpiar(false);
    setSuccessNotice("Tablero de reportes vaciado a lienzo en blanco");
  };

  // ─── Custom Hook para Datos, Cálculos y Slicers Analíticos ────────────────
  const {
    periodo,
    setPeriodo,
    estadoFilter,
    setEstadoFilter,
    contactoFilter,
    setContactoFilter,
    proyeccionMesOffset,
    setProyeccionMesOffset,
    filteredPrestamos,
    filteredPagos,
    filteredMovimientos,
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
  } = useReportesData({
    prestamos,
    pagos,
    cuentas,
    movimientos,
    contactos,
  });

  // ─── Exportaciones ────────────────────────────────────────────────────────
  const handleExportExcel = () => {
    exportarExcel({
      metrics,
      filteredPrestamos,
      filteredPagos,
      cuentas,
      filteredMovimientos,
      onSuccess: (msg) => setSuccessNotice(msg),
      onError: (msg) => setSuccessNotice(msg),
    });
  };

  const handleExportCsv = () => {
    const tableRecords = filteredPrestamos.map((p: Prestamo) => {
      const contactObj = rel(p.contactos);
      const balance = loanBalance(p);
      const principal = Number(p.monto_principal || 0);
      const pagado = Number(p.monto_capital_pagado || 0);
      const pct = principal > 0 ? Math.min(100, (pagado / principal) * 100) : 0;
      return {
        contactoNombre: contactObj?.nombre || "Sin contacto",
        nombre: p.nombre,
        principal,
        pagado,
        saldo: balance,
        pct: Number(pct.toFixed(1)),
        estado: p.estado,
        fechaInicio: p.fecha_inicio || p.created_at,
      };
    });

    exportarCsv({
      tableRecords,
      onSuccess: (msg) => setSuccessNotice(msg),
      onError: (msg) => setSuccessNotice(msg),
    });
  };

  // ─── Enrutamiento de Contenido por Widget ──────────────────────────────────
  const renderWidgetContent = (id: ReportWidgetKey, colSpan?: 12 | 6) => {
    switch (id) {
      case "kpi_flujo":
        return <WidgetKpiFlujo metrics={metrics} colSpan={colSpan} />;
      case "kpi_cartera":
        return (
          <WidgetKpiCartera
            metrics={metrics}
            filteredPrestamos={filteredPrestamos}
            colSpan={colSpan}
          />
        );
      case "chart_historico":
        return (
          <WidgetChartHistorico
            cobrosMensuales={cobrosMensuales}
            mounted={mounted}
          />
        );
      case "flujo_neto_esperado":
        return (
          <WidgetFlujoNeto
            flujoNetoData={flujoNetoData}
            timelineProyeccionMes={timelineProyeccionMes}
            proyeccionSemestral={proyeccionSemestral}
            mesActualNombre={mesActualNombre}
            targetYear={targetYear}
            proyeccionMesOffset={proyeccionMesOffset}
            setProyeccionMesOffset={setProyeccionMesOffset}
            interesMensualEstimado={metrics.interesMensualEstimado}
            mounted={mounted}
          />
        );
      case "chart_salud":
        return (
          <WidgetChartSalud
            portfolioHealth={portfolioHealth}
            moraRate={metrics.moraRate}
            mounted={mounted}
          />
        );
      case "top_deudores":
        return (
          <WidgetTopDeudores
            topDebtors={topDebtors}
            totalSaldoPendiente={metrics.totalSaldoPendiente}
          />
        );
      case "liquidez_cuentas":
        return (
          <WidgetLiquidezCuentas
            liquidityByAccount={liquidityByAccount}
            totalLiquidez={metrics.totalLiquidez}
          />
        );
      case "smart_insights":
        return (
          <WidgetSmartInsights
            metrics={metrics}
            topDebtors={topDebtors}
            colSpan={colSpan}
          />
        );
      case "tabla_auditoria":
        return (
          <WidgetTablaAuditoria
            prestamos={filteredPrestamos}
            contactos={contactos}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 print:space-y-4 print:pb-0">
      {/* ─── Encabezado Ejecutivo Formal Exclusivo para PDF / Impresión ───────── */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FinPalLogo size={36} className="w-9 h-9" priority />
            <div>
              <div className="flex items-baseline tracking-tight font-heading text-xl">
                <span className="font-extrabold text-slate-900">Fin</span>
                <span className="font-extrabold text-primary">Pal</span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                Financial Management Protocol
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 uppercase tracking-wider">
              Informe Financiero Oficial
            </span>
            <p className="text-[11px] font-mono text-slate-600 mt-1" suppressHydrationWarning>
              Fecha: {new Date().toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div>
            <h1 className="font-heading text-lg font-bold text-slate-900">
              Reporte Ejecutivo de Cartera, Rendimiento y Liquidez
            </h1>
            <p className="text-[11px] text-slate-600">
              Auditoría consolidada de activos, créditos activos y flujo de caja neto.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <p><span className="font-semibold text-slate-800">Filtro temporal:</span> {periodo === "todo" ? "Histórico Total" : periodo.toUpperCase()}</p>
            <p><span className="font-semibold text-slate-800">Moneda Base:</span> BOB (Bolivianos)</p>
          </div>
        </div>
      </div>

      {/* ─── Encabezado Superior de Inteligencia de Negocios (BI) ───────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-surface-container-high/60 print:hidden"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold badge-emerald">
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

        {/* Action Buttons: Personalizar, Limpiar, Excel, CSV & Print */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap print:hidden">
          <button
            type="button"
            onClick={() => setModalPersonalizar(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold border border-surface-container-high/60 transition-colors cursor-pointer"
            title="Configurar y añadir widgets al reporte"
          >
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <span>Personalizar</span>
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold flex items-center justify-center">
              {visibleWidgets.length}
            </span>
          </button>

          {visibleWidgets.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmLimpiar(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-surface-container-low hover:bg-rose-500/10 border border-surface-container-high/60 transition-colors cursor-pointer"
              title="Vaciar todos los widgets del tablero"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Limpiar tablero</span>
            </button>
          )}

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
      </motion.div>

      {/* ─── Interactive BI Slicers / Filters Ribbon ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, delay: 0.04 }}
        className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs space-y-3.5 print:hidden"
      >
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
              Período de análisis
            </label>
            <div className="grid grid-cols-4 gap-1 bg-surface-container-low p-1 rounded-xl border border-surface-container-high/60">
              {(
                [
                  { id: "todo", label: "Todo" },
                  { id: "anio", label: "Este año" },
                  { id: "90d", label: "90 días" },
                  { id: "30d", label: "30 días" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPeriodo(t.id as PeriodoFilter)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                    periodo === t.id
                      ? "bg-primary text-on-primary shadow-2xs font-extrabold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de Préstamos Slicer */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Estado de cartera
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
              className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold border border-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
              className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-low text-on-surface text-xs font-semibold border border-surface-container-high/60 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
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
      </motion.div>

      {/* ─── Lienzo Dinámico y Personalizable Estilo Looker Studio ───────── */}
      {visibleWidgets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, delay: 0.08 }}
          className="bg-surface-container-lowest border-2 border-dashed border-surface-container-high rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 shadow-2xs"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 ring-8 ring-primary/5">
            <LayoutGrid className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-on-surface">
            Tablero de Reportes en Blanco
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-2 max-w-lg mx-auto leading-relaxed">
            Esta página viene vacía por defecto para que armes tu panel con total libertad, tipo Looker Studio. Elige únicamente los indicadores, gráficos y tablas que deseas monitorear. Tus preferencias se guardarán automáticamente en tu dispositivo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setModalPersonalizar(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold shadow-xs hover:bg-primary-container transition-all cursor-pointer active:scale-95"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Elegir widgets para ver</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const allWidgets = widgets.map((w) => ({ ...w, visible: true }));
                saveWidgets(allWidgets);
                setSuccessNotice("Se cargaron todos los widgets disponibles");
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs sm:text-sm font-semibold border border-surface-container-high/60 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-on-surface-variant" />
              <span>Cargar todos los widgets</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {visibleWidgets.map((widget, vIndex) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: Math.min(vIndex * 0.05, 0.3), ease: "easeOut" }}
              className={`flex flex-col min-w-0 ${
                widget.colSpan === 12 ? "col-span-1 md:col-span-12" : "col-span-1 md:col-span-6"
              }`}
            >
              <div
                draggable={canDragIndex === vIndex}
                onDragStart={(e) => handleDragStart(e, vIndex)}
                onDragOver={(e) => handleDragOver(e)}
                onDrop={(e) => handleDrop(e, vIndex)}
                onDragEnd={handleDragEnd}
                className={`transition-all duration-200 group flex flex-col min-w-0 h-full ${
                  draggedWidgetIndex === vIndex ? "opacity-40 scale-[0.99]" : "opacity-100"
                }`}
              >
                {/* Barra de control superior del widget */}
                <div className="print:hidden mb-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-surface-container-low/70 border border-surface-container-high/40 text-[11px] backdrop-blur-xs transition-opacity opacity-75 group-hover:opacity-100 min-w-0 gap-2">
                  <div className="flex items-center gap-2 text-on-surface-variant min-w-0">
                    {/* Handle Drag en Desktop: Solo al presionar y sostener este botón se habilita el arrastre */}
                    <button
                      type="button"
                      onMouseDown={() => setCanDragIndex(vIndex)}
                      onMouseUp={() => setCanDragIndex(null)}
                      onTouchStart={() => setCanDragIndex(vIndex)}
                      onTouchEnd={() => setCanDragIndex(null)}
                      className="hidden md:inline-flex items-center gap-1 cursor-grab active:cursor-grabbing text-on-surface-variant hover:text-on-surface font-semibold select-none shrink-0 px-1 py-0.5 rounded hover:bg-surface-container-high/60 transition-colors"
                      title="Mantén presionado para arrastrar y reordenar este widget"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                      <span>Arrastrar</span>
                    </button>

                    {/* Botones de subir / bajar para Móvil y Desktop */}
                    <div className="inline-flex items-center gap-0.5 bg-surface-container-high/40 rounded-lg p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveWidget(vIndex, "up")}
                        disabled={vIndex === 0}
                        className="p-1 rounded text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Mover widget hacia arriba"
                        aria-label="Mover widget hacia arriba"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveWidget(vIndex, "down")}
                        disabled={vIndex === visibleWidgets.length - 1}
                        className="p-1 rounded text-on-surface-variant hover:text-on-surface disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Mover widget hacia abajo"
                        aria-label="Mover widget hacia abajo"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] text-on-surface-variant/80 font-mono truncate">
                      #{vIndex + 1} · {widget.label.split(":")[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Botón cambiar ancho (12 columnas vs 6 columnas) */}
                    <button
                      type="button"
                      onClick={() => toggleWidgetWidth(widget.id)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title={
                        widget.colSpan === 12
                          ? "Reducir a medio ancho (6 columnas)"
                          : "Expandir a ancho completo (12 columnas)"
                      }
                    >
                      {widget.colSpan === 12 ? (
                        <>
                          <Minimize2 className="w-3 h-3 text-primary" />
                          <span className="hidden sm:inline">Medio ancho</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3 h-3 text-primary" />
                          <span className="hidden sm:inline">Ancho completo</span>
                        </>
                      )}
                    </button>

                    {/* Botón quitar widget */}
                    <button
                      type="button"
                      onClick={() => removeWidget(widget.id)}
                      className="p-1 rounded-md text-on-surface-variant hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Quitar este widget del reporte"
                      aria-label="Quitar este widget"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Render del contenido del widget */}
                <div className="flex-1 w-full min-w-0">
                  {renderWidgetContent(widget.id, widget.colSpan)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Modal Confirmar Limpiar Todo (Protección contra toques involuntarios) ─── */}
      {showConfirmLimpiar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-on-surface">
                ¿Limpiar todos los widgets del tablero?
              </h3>
              <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                Esta acción vaciará el tablero y dejará el lienzo en blanco para que puedas reconfigurarlo. No se eliminará ningún dato ni movimiento de tus préstamos ni cuentas.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmLimpiar(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface bg-surface-container-low hover:bg-surface-container border border-surface-container-high/60 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarLimpiar}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                Sí, limpiar tablero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Personalizar Tablero Looker Studio ─────────────────────── */}
      {modalPersonalizar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest border border-surface-container-high rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-surface-container-high/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-on-surface">
                    Personalizar Tablero de Reportes
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Activa los módulos que deseas ver y ajusta su ancho.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPersonalizar(false)}
                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Acciones Rápidas / Presets */}
            <div className="px-5 sm:px-6 py-3 bg-surface-container-low/50 border-b border-surface-container-high/40 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="text-on-surface-variant font-semibold">Plantillas:</span>
                <button
                  type="button"
                  onClick={() => {
                    const allOn = widgets.map((w) => ({ ...w, visible: true }));
                    saveWidgets(allOn);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-medium transition-colors"
                >
                  Activar todo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const onlyCharts = widgets.map((w) => ({
                      ...w,
                      visible: w.category === "kpi" || w.category === "grafico",
                    }));
                    saveWidgets(onlyCharts);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-medium transition-colors"
                >
                  Solo KPIs & Gráficos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const allOff = widgets.map((w) => ({ ...w, visible: false }));
                    saveWidgets(allOff);
                  }}
                  className="px-2.5 py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-medium transition-colors"
                >
                  Desactivar todo
                </button>
              </div>

              <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {visibleWidgets.length} de {widgets.length} visibles
              </span>
            </div>

            {/* Lista de Widgets del Catálogo */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {widgets.map((item) => {
                const isChecked = item.visible;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isChecked
                        ? "bg-surface-container-lowest border-primary/40 shadow-2xs ring-1 ring-primary/20"
                        : "bg-surface-container-low/40 border-surface-container-high/60 opacity-80"
                    }`}
                  >
                    <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const updated = widgets.map((w) =>
                            w.id === item.id ? { ...w, visible: e.target.checked } : w
                          );
                          saveWidgets(updated);
                        }}
                        className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading text-xs sm:text-sm font-bold text-on-surface">
                            {item.label}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-surface-container text-on-surface-variant uppercase tracking-wider">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </label>

                    {/* Selector de Ancho */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center pl-7 sm:pl-0 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = widgets.map((w) =>
                            w.id === item.id ? { ...w, colSpan: 6 as 12 | 6 } : w
                          );
                          saveWidgets(updated);
                        }}
                        disabled={!isChecked}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          item.colSpan === 6
                            ? "bg-primary text-on-primary shadow-2xs"
                            : "bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        }`}
                        title="Ocupa la mitad del ancho de la pantalla"
                      >
                        6 cols (1/2)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = widgets.map((w) =>
                            w.id === item.id ? { ...w, colSpan: 12 as 12 | 6 } : w
                          );
                          saveWidgets(updated);
                        }}
                        disabled={!isChecked}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          item.colSpan === 12
                            ? "bg-primary text-on-primary shadow-2xs"
                            : "bg-surface-container text-on-surface-variant hover:text-on-surface disabled:opacity-40"
                        }`}
                        title="Ocupa el ancho completo de la pantalla"
                      >
                        12 cols (Full)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-surface-container-high/60 bg-surface-container-low/30 flex items-center justify-between shrink-0">
              <span className="text-xs text-on-surface-variant font-medium">
                Cambios guardados localmente
              </span>
              <button
                type="button"
                onClick={() => setModalPersonalizar(false)}
                className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container transition-all cursor-pointer active:scale-95"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Pie de Reporte Formal para Impresión / PDF ───────── */}
      <div className="hidden print:block mt-8 pt-4 border-t-2 border-slate-300 text-[10px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>FinPal Financial Ledger · Sistema Integral de Gestión de Cartera y Préstamos · Confidencial</span>
          <span>Página 1 · Informe Oficial Generado Electrónicamente</span>
        </div>
      </div>
    </div>
  );
}

export default ReportesBiDashboard;
