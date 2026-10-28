"use client";

import { useState, useMemo } from "react";
import {
  X,
  Check,
  Copy,
  Printer,
  ReceiptText,
  Calculator,
  HandCoins,
  Calendar,
  Pencil,
  PlusCircle,
  TrendingUp,
  Award,
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
  WalletCards,
  UserCheck,
  Sparkles,
} from "lucide-react";
import {
  money,
  loanBalance,
  monthlyInterest,
  rel,
  type Contacto,
  type Cuenta,
  type Prestamo,
  type Pago,
  type ModalPresetOptions,
} from "@/lib/dashboard-context";
import { formatDateEs, formatMonthYear, getLocalDateString } from "@/lib/format-date";
import { FinPalLogo } from "@/components/finpal-logo";
import { ContactAvatar } from "@/components/contact-avatar";
import { SlideToConfirm } from "@/components/slide-to-confirm";
import {
  actualizarPrestamo,
  ampliarCapitalPrestamo,
  archivarPrestamo,
} from "@/app/(dashboard)/prestamos/actions";
import { actualizarContacto, archivarContacto } from "@/app/(dashboard)/contactos/actions";

const inputCls =
  "w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const selectCls =
  "w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer";

// ═══════════════════════════════════════════════════════════════════════════
// 1. MODAL DE COMPROBANTE / RECIBO DIGITAL DE COBRO
// ═══════════════════════════════════════════════════════════════════════════

export function ModalReciboCobro({
  pago,
  prestamo,
  espacioNombre,
  colorAcento,
  onClose,
}: {
  pago: Pago;
  prestamo?: Prestamo | null;
  espacioNombre?: string;
  colorAcento?: string;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  const prestamoRel = rel(pago.prestamos);
  const contactoRel = rel(prestamoRel?.contactos);
  const cuentaRel = rel(pago.cuentas_dinero);

  const deudorNombre = contactoRel?.nombre ?? (prestamo ? rel(prestamo.contactos)?.nombre : null) ?? "Cliente";
  const prestamoNombre = prestamoRel?.nombre ?? prestamo?.nombre ?? "Préstamo";
  const cuentaNombre = cuentaRel?.nombre ?? "Cuenta registrada";
  const folio = pago.id.slice(0, 8).toUpperCase();
  const saldoActualPrestamo = prestamo
    ? loanBalance(prestamo)
    : prestamoRel?.monto_principal !== undefined && prestamoRel?.monto_capital_pagado !== undefined
    ? Math.max(0, Number(prestamoRel.monto_principal) - Number(prestamoRel.monto_capital_pagado))
    : null;

  const textoResumen = useMemo(() => {
    const lines = [
      `COMPROBANTE DE COBRO — ${espacioNombre || "FinPal"}`,
      `Folio: #${folio}`,
      `Fecha de pago: ${formatDateEs(pago.recibido_en)}`,
      `Deudor: ${deudorNombre}`,
      `Concepto: ${prestamoNombre}`,
      `Período cubierto: ${pago.fecha_esperada ? formatMonthYear(pago.fecha_esperada) : "Abono general"}`,
      `----------------------------------------`,
      `Total recibido: ${money(Number(pago.monto_total))}`,
      `• Abono a capital: ${money(Number(pago.monto_principal))}`,
      `• Interés pagado: ${money(Number(pago.monto_interes))}`,
      ...(saldoActualPrestamo !== null ? [`Saldo de capital restante: ${money(saldoActualPrestamo)}`] : []),
      ...(pago.metodo_pago ? [`Método de pago: ${pago.metodo_pago}`] : []),
      ...(pago.notas ? [`Nota: ${pago.notas}`] : []),
    ];
    return lines.join("\n");
  }, [pago, folio, deudorNombre, prestamoNombre, saldoActualPrestamo, espacioNombre]);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(textoResumen);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Recibo */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-dashed border-surface-container-high">
          <div className="flex items-center gap-2.5">
            <FinPalLogo size={36} className="w-9 h-9 shrink-0" colorAcento={colorAcento} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-base font-extrabold text-on-surface">
                  Fin<span className="text-primary">Pal</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  #{folio}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Comprobante Digital de Cobro · {espacioNombre || "Cartera"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Monto Destacado */}
        <div className="rounded-2xl bg-primary/8 border border-primary/20 p-4 text-center space-y-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pago Recibido
          </span>
          <div className="font-mono text-2xl sm:text-3xl font-extrabold text-on-surface">
            {money(Number(pago.monto_total))}
          </div>
          <p className="text-xs text-on-surface-variant">
            Cobrado el <strong className="text-on-surface">{formatDateEs(pago.recibido_en)}</strong>
          </p>
        </div>

        {/* Detalles del Comprobante */}
        <div className="rounded-2xl bg-surface-container-low/60 border border-surface-container-high/60 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Deudor / Cliente</span>
            <span className="font-bold text-on-surface text-right">{deudorNombre}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Préstamo</span>
            <span className="font-semibold text-on-surface text-right">{prestamoNombre}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Período / Cuota</span>
            <span className="font-semibold text-primary text-right">
              {pago.fecha_esperada ? formatMonthYear(pago.fecha_esperada) : "Abono general"}
            </span>
          </div>
          <div className="border-t border-dashed border-surface-container-high pt-2.5 flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Abono a capital</span>
            <span className="font-mono font-semibold text-on-surface">{money(Number(pago.monto_principal))}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-on-surface-variant">Interés cobrado</span>
            <span className="font-mono font-semibold text-on-surface">{money(Number(pago.monto_interes))}</span>
          </div>
          {saldoActualPrestamo !== null && (
            <div className="border-t border-dashed border-surface-container-high pt-2.5 flex items-center justify-between gap-2">
              <span className="text-on-surface-variant font-medium">Saldo de capital restante</span>
              <span className="font-mono font-extrabold text-on-surface">{money(saldoActualPrestamo)}</span>
            </div>
          )}
          <div className="border-t border-surface-container-low pt-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="text-on-surface-variant">Cuenta receptora</span>
            <span className="font-medium text-on-surface">
              {cuentaNombre}
              {pago.metodo_pago ? ` (${pago.metodo_pago})` : ""}
            </span>
          </div>
          {pago.notas && (
            <div className="pt-2 border-t border-surface-container-low text-[11px]">
              <span className="text-on-surface-variant block mb-0.5">Observaciones:</span>
              <p className="text-on-surface italic">{pago.notas}</p>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 print:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopiar}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              {copiado ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-primary" />
                  <span>Copiar recibo</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-container-high bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-on-surface-variant" />
              <span>Imprimir</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. MODAL SIMULADOR / CALCULADORA DE PRÉSTAMOS
// ═══════════════════════════════════════════════════════════════════════════

export function ModalSimuladorPrestamo({
  tasaPredeterminada = 3,
  onClose,
  onUsarEnPrestamo,
}: {
  tasaPredeterminada?: number;
  onClose: () => void;
  onUsarEnPrestamo: (preset: ModalPresetOptions) => void;
}) {
  const [monto, setMonto] = useState<number>(2000);
  const [tasa, setTasa] = useState<number>(tasaPredeterminada || 3);
  const [plazo, setPlazo] = useState<number>(6);
  const [frecuencia, setFrecuencia] = useState<"mensual" | "quincenal" | "semanal">("mensual");
  const [modalidad, setModalidad] = useState<"solo_interes" | "cuota_fija" | "capital_fijo">("solo_interes");

  const simulacion = useMemo(() => {
    const P = Math.max(0, Number(monto) || 0);
    const rMensual = Math.max(0, Number(tasa) || 0) / 100;
    const n = Math.max(1, Math.min(60, Math.floor(Number(plazo) || 1)));

    // Ajuste de tasa por período según frecuencia
    const factorPeriodo = frecuencia === "mensual" ? 1 : frecuencia === "quincenal" ? 0.5 : 0.25;
    const r = rMensual * factorPeriodo;

    const filas: Array<{
      periodo: number;
      cuota: number;
      capital: number;
      interes: number;
      saldo: number;
    }> = [];

    let saldo = P;
    let totalInteres = 0;
    let totalPagado = 0;

    if (modalidad === "solo_interes") {
      // Modalidad estándar de préstamos personales: cada período paga interés y en el último devuelve el capital
      const interesPeriodo = P * r;
      for (let i = 1; i <= n; i++) {
        const cap = i === n ? P : 0;
        const cuota = cap + interesPeriodo;
        saldo = Math.max(0, saldo - cap);
        totalInteres += interesPeriodo;
        totalPagado += cuota;
        filas.push({ periodo: i, cuota, capital: cap, interes: interesPeriodo, saldo });
      }
    } else if (modalidad === "capital_fijo") {
      // Amortización constante de capital + interés sobre saldo pendiente (Sistema Alemán)
      const capFijo = P / n;
      for (let i = 1; i <= n; i++) {
        const interesPeriodo = saldo * r;
        const cuota = capFijo + interesPeriodo;
        saldo = Math.max(0, saldo - capFijo);
        totalInteres += interesPeriodo;
        totalPagado += cuota;
        filas.push({ periodo: i, cuota, capital: capFijo, interes: interesPeriodo, saldo });
      }
    } else {
      // Cuota fija (Sistema Francés)
      const cuotaFija =
        r > 0 ? (P * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1) : P / n;
      for (let i = 1; i <= n; i++) {
        const interesPeriodo = saldo * r;
        const cap = Math.min(saldo, cuotaFija - interesPeriodo);
        saldo = Math.max(0, saldo - cap);
        totalInteres += interesPeriodo;
        totalPagado += cap + interesPeriodo;
        filas.push({ periodo: i, cuota: cap + interesPeriodo, capital: cap, interes: interesPeriodo, saldo });
      }
    }

    const roi = P > 0 ? (totalInteres / P) * 100 : 0;
    return {
      filas,
      totalInteres,
      totalPagado,
      roi,
      primeraCuota: filas[0]?.cuota ?? 0,
      interesPrimerPeriodo: filas[0]?.interes ?? 0,
    };
  }, [monto, tasa, plazo, frecuencia, modalidad]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-on-surface">
                Simulador y Calculadora de Préstamos
              </h2>
              <p className="text-xs text-on-surface-variant">
                Proyecta intereses, rendimientos y cronograma de cuotas antes de desembolsar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Controles de Simulación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Capital a prestar</label>
              <input
                type="number"
                min={1}
                step="50"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Tasa mensual (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                value={tasa}
                onChange={(e) => setTasa(Number(e.target.value))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">N.º de períodos</label>
              <input
                type="number"
                min={1}
                max={60}
                value={plazo}
                onChange={(e) => setPlazo(Number(e.target.value))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Frecuencia de cobro</label>
              <select
                value={frecuencia}
                onChange={(e) => setFrecuencia(e.target.value as typeof frecuencia)}
                className={selectCls}
              >
                <option value="mensual">Mensual (cada 30 días)</option>
                <option value="quincenal">Quincenal (cada 15 días)</option>
                <option value="semanal">Semanal (cada 7 días)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Modalidad de amortización</label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as typeof modalidad)}
                className={selectCls}
              >
                <option value="solo_interes">Interés periódico + Capital al final (Estándar FinPal)</option>
                <option value="capital_fijo">Abono fijo a capital + Interés sobre saldo</option>
                <option value="cuota_fija">Cuota fija nivelada (Sistema Francés)</option>
              </select>
            </div>
          </div>

          {/* Tarjetas Resumen de la Simulación */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-surface-container-low/80 border border-surface-container-high/60">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                {modalidad === "solo_interes" ? "Interés por período" : "1.ª Cuota estimada"}
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-primary block mt-0.5">
                {money(modalidad === "solo_interes" ? simulacion.interesPrimerPeriodo : simulacion.primeraCuota)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-low/80 border border-surface-container-high/60">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                Ganancia en intereses
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                +{money(simulacion.totalInteres)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-low/80 border border-surface-container-high/60">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                Total a recaudar
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-on-surface block mt-0.5">
                {money(simulacion.totalPagado)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-low/80 border border-surface-container-high/60">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                Rendimiento (ROI)
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-on-surface block mt-0.5">
                +{simulacion.roi.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Tabla de Cronograma Proyectado */}
          <div className="rounded-2xl border border-surface-container-high/70 overflow-hidden">
            <div className="px-3.5 py-2 bg-surface-container-low text-xs font-bold text-on-surface flex items-center justify-between">
              <span>Cronograma proyectado ({simulacion.filas.length} períodos)</span>
              <span className="text-[11px] font-normal text-on-surface-variant capitalize">
                Frecuencia {frecuencia}
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low/50 text-[10px] uppercase text-on-surface-variant font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Cuota Total</th>
                    <th className="py-2 px-3">Capital</th>
                    <th className="py-2 px-3">Interés</th>
                    <th className="py-2 px-3 text-right">Saldo Restante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low font-mono">
                  {simulacion.filas.map((f) => (
                    <tr key={f.periodo} className="hover:bg-surface-container-low/40">
                      <td className="py-2 px-3 font-bold text-on-surface-variant">{f.periodo}</td>
                      <td className="py-2 px-3 font-bold text-on-surface">{money(f.cuota)}</td>
                      <td className="py-2 px-3 text-on-surface-variant">{money(f.capital)}</td>
                      <td className="py-2 px-3 text-primary font-semibold">{money(f.interes)}</td>
                      <td className="py-2 px-3 text-right text-on-surface">{money(f.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-surface-container-low flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container cursor-pointer"
          >
            Cerrar simulador
          </button>
          <button
            type="button"
            onClick={() => {
              onUsarEnPrestamo({
                monto: Number(monto) || undefined,
                tasa: Number(tasa) >= 0 ? Number(tasa) : undefined,
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <HandCoins className="w-4 h-4" />
            <span>Crear préstamo con estos valores</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. MODAL FICHA 360° / KARDEX DEL PRÉSTAMO (DETALLE + AMPLIAR + EDITAR)
// ═══════════════════════════════════════════════════════════════════════════

export function ModalKardexPrestamo({
  prestamo,
  pagos,
  cuentas,
  espacioId,
  onClose,
  onCobrar,
  onVerRecibo,
  onSuccess,
}: {
  prestamo: Prestamo;
  pagos: Pago[];
  cuentas: Cuenta[];
  espacioId: string;
  onClose: () => void;
  onCobrar: (prestamoId: string) => void;
  onVerRecibo: (pago: Pago) => void;
  onSuccess: (msg: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<"kardex" | "ampliar" | "editar">("kardex");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado formulario Editar
  const [nombre, setNombre] = useState(prestamo.nombre);
  const [cobraInteres, setCobraInteres] = useState(prestamo.cobra_interes);
  const [tasa, setTasa] = useState<number | string>(prestamo.tasa_interes_mensual);
  const [diaPago, setDiaPago] = useState(prestamo.dia_pago);
  const [notas, setNotas] = useState(prestamo.notas ?? "");

  // Estado formulario Ampliar Capital
  const [montoAmpliacion, setMontoAmpliacion] = useState<number | "">("");
  const [cuentaAmpliacionId, setCuentaAmpliacionId] = useState(cuentas[0]?.id ?? "");
  const [fechaAmpliacion, setFechaAmpliacion] = useState(getLocalDateString());
  const [notasAmpliacion, setNotasAmpliacion] = useState("");

  const contacto = rel(prestamo.contactos);
  const deudorNombre = contacto?.nombre ?? "Deudor";
  const balance = loanBalance(prestamo);
  const principal = Number(prestamo.monto_principal);
  const pagadoCap = Number(prestamo.monto_capital_pagado);
  const progresoPct = principal > 0 ? Math.min(100, Math.round((pagadoCap / principal) * 100)) : 0;

  const pagosDelPrestamo = useMemo(() => {
    return pagos.filter((p) => {
      const pRel = rel(p.prestamos);
      return p.prestamo_id === prestamo.id || pRel?.id === prestamo.id;
    });
  }, [pagos, prestamo.id]);

  const handleConfirmEditar = async () => {
    if (!nombre.trim()) {
      setError("El concepto del préstamo es obligatorio.");
      return false;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("nombre", nombre.trim());
    fd.append("cobra_interes", String(cobraInteres));
    fd.append("tasa_interes_mensual", String(cobraInteres ? tasa : 0));
    fd.append("dia_pago", String(diaPago));
    fd.append("notas", notas);

    const res = await actualizarPrestamo(prestamo.id, espacioId, fd);
    setSubmitting(false);
    if (res.error) {
      const errs = res.error as Record<string, string[]>;
      setError(errs._global?.[0] ?? Object.values(errs).flat()[0] ?? "Error al actualizar préstamo");
      return false;
    }
    await onSuccess("¡Préstamo actualizado correctamente!");
    onClose();
    return true;
  };

  const handleConfirmAmpliar = async () => {
    if (!montoAmpliacion || Number(montoAmpliacion) <= 0) {
      setError("Ingresa un monto válido para ampliar el capital.");
      return false;
    }
    if (!cuentaAmpliacionId) {
      setError("Selecciona la cuenta desde donde se entregará el dinero.");
      return false;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("monto_ampliacion", String(montoAmpliacion));
    fd.append("cuenta_dinero_id", cuentaAmpliacionId);
    fd.append("fecha", fechaAmpliacion);
    fd.append("notas", notasAmpliacion);

    const res = await ampliarCapitalPrestamo(prestamo.id, espacioId, fd);
    setSubmitting(false);
    if (res.error) {
      const errs = res.error as Record<string, string[]>;
      setError(errs._global?.[0] ?? Object.values(errs).flat()[0] ?? "Error al ampliar el capital");
      return false;
    }
    await onSuccess("¡Ampliación de capital registrada con éxito!");
    onClose();
    return true;
  };

  const handleArchivar = async () => {
    setSubmitting(true);
    const res = await archivarPrestamo(prestamo.id, espacioId);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    await onSuccess("Préstamo archivado del listado principal.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-3 min-w-0">
            <ContactAvatar name={deudorNombre} size={42} className="rounded-full shadow-xs shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading text-lg font-extrabold text-on-surface truncate">
                  {deudorNombre}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    prestamo.estado === "atrasado"
                      ? "badge-atrasado"
                      : prestamo.estado === "pagado"
                      ? "badge-saldado"
                      : "badge-al-dia"
                  }`}
                >
                  {prestamo.estado === "atrasado"
                    ? "Con atraso"
                    : prestamo.estado === "pagado"
                    ? "Saldado"
                    : "Al día"}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant truncate">
                {prestamo.nombre} · Inició el {formatDateEs(prestamo.fecha_inicio)} (Día de cobro: {prestamo.dia_pago})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setTab("kardex");
            }}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === "kardex"
                ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Expediente & Cobros ({pagosDelPrestamo.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setTab("ampliar");
            }}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === "ampliar"
                ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ampliar capital</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setTab("editar");
            }}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              tab === "editar"
                ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Editar préstamo</span>
          </button>
        </div>

        {/* Contenido por pestaña */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {tab === "kardex" && (
            <>
              {/* Barra de Progreso de Amortización */}
              <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-surface-container-high/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">Progreso de devolución de capital</span>
                  <span className="font-mono font-bold text-primary">{progresoPct}% recuperado</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progresoPct}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase">Capital prestado</span>
                    <span className="font-mono font-bold text-on-surface">{money(principal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase">Capital devuelto</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {money(pagadoCap)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase">Saldo por cobrar</span>
                    <span className="font-mono font-extrabold text-primary">{money(balance)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase">Interés ganado</span>
                    <span className="font-mono font-bold text-on-surface">
                      {money(prestamo.interes_pagado_total)}
                    </span>
                  </div>
                </div>
              </div>

              {prestamo.notas && (
                <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-surface-container-high/50 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                    Notas del préstamo
                  </span>
                  <p className="text-on-surface whitespace-pre-wrap">{prestamo.notas}</p>
                </div>
              )}

              {/* Historial de Cobros de este Préstamo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Historial de abonos y cobros ({pagosDelPrestamo.length})
                  </h3>
                  {balance > 0.01 && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onCobrar(prestamo.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-2xs hover:bg-primary-container transition-colors cursor-pointer"
                    >
                      <ReceiptText className="w-3.5 h-3.5" />
                      <span>Registrar cobro ahora</span>
                    </button>
                  )}
                </div>

                {pagosDelPrestamo.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-surface-container-high text-center text-xs text-on-surface-variant">
                    Aún no se han registrado cobros para este préstamo.
                  </div>
                ) : (
                  <div className="divide-y divide-surface-container-low rounded-2xl border border-surface-container-high/60 overflow-hidden">
                    {pagosDelPrestamo.map((pg) => (
                      <div
                        key={pg.id}
                        className="p-3 bg-surface-container-lowest hover:bg-surface-container-low/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-on-surface">{formatDateEs(pg.recibido_en)}</span>
                            {pg.fecha_esperada && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                                Cuota: {formatMonthYear(pg.fecha_esperada)}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            Capital: <strong className="font-mono">{money(Number(pg.monto_principal))}</strong> · Interés:{" "}
                            <strong className="font-mono">{money(Number(pg.monto_interes))}</strong> ·{" "}
                            {rel(pg.cuentas_dinero)?.nombre ?? "Cuenta"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-sm text-primary">
                            +{money(Number(pg.monto_total))}
                          </span>
                          <button
                            type="button"
                            onClick={() => onVerRecibo(pg)}
                            className="p-1.5 rounded-lg border border-surface-container-high hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                            title="Ver comprobante de cobro"
                          >
                            <ReceiptText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "ampliar" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 text-xs space-y-1">
                <p className="font-bold text-primary flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Ampliación / Recarga de Capital
                </p>
                <p className="text-on-surface-variant leading-relaxed">
                  Suma capital adicional a este mismo préstamo y descuenta automáticamente el desembolso de la cuenta de origen seleccionada. Capital actual:{" "}
                  <strong className="font-mono text-on-surface">{money(principal)}</strong> (Saldo pendiente:{" "}
                  <strong className="font-mono text-primary">{money(balance)}</strong>).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Monto adicional a entregar *
                  </label>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={montoAmpliacion}
                    onChange={(e) => setMontoAmpliacion(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Fecha de entrega *</label>
                  <input
                    type="date"
                    value={fechaAmpliacion}
                    onChange={(e) => setFechaAmpliacion(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Cuenta de donde sale el dinero *
                </label>
                <select
                  value={cuentaAmpliacionId}
                  onChange={(e) => setCuentaAmpliacionId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">— Selecciona cuenta —</option>
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Saldo: {money(c.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Motivo o nota de la ampliación (opcional)
                </label>
                <input
                  type="text"
                  value={notasAmpliacion}
                  onChange={(e) => setNotasAmpliacion(e.target.value)}
                  placeholder="Ej. Pidió refuerzo para mercadería"
                  className={inputCls}
                />
              </div>

              {error && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
              )}

              <SlideToConfirm
                submitting={submitting}
                label="Desliza para desembolsar ampliación"
                resetTrigger={`${prestamo.id}-ampliar`}
                onConfirm={handleConfirmAmpliar}
              />
            </div>
          )}

          {tab === "editar" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Concepto / Nombre del préstamo *
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Día de cobro mensual (1 - 31) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={diaPago}
                    onChange={(e) => setDiaPago(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low/50 border border-surface-container-high/60 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cobraInteres}
                    onChange={(e) => {
                      setCobraInteres(e.target.checked);
                      if (!e.target.checked) setTasa(0);
                      else if (Number(tasa) === 0) setTasa(3);
                    }}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <span>Genera interés mensual sobre saldo pendiente</span>
                </label>
                {cobraInteres && (
                  <div className="pt-1">
                    <label className="block text-xs font-semibold text-on-surface mb-1">
                      Tasa de interés mensual (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={tasa}
                      onChange={(e) => setTasa(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Notas del préstamo</label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className={`${inputCls} h-auto py-2.5`}
                />
              </div>

              {error && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
              )}

              <SlideToConfirm
                submitting={submitting}
                label="Desliza para guardar cambios"
                resetTrigger={`${prestamo.id}-editar`}
                onConfirm={handleConfirmEditar}
              />

              <div className="pt-3 border-t border-surface-container-low flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  ¿Deseas ocultar este préstamo de tu vista activa?
                </span>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleArchivar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archivar préstamo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. MODAL FICHA 360° DEL CONTACTO / DEUDOR + EDICIÓN + SCORE
// ═══════════════════════════════════════════════════════════════════════════

export function ModalFichaContacto({
  contacto,
  prestamos,
  pagos,
  espacioId,
  initialTab = "ficha",
  onClose,
  onNuevoPrestamo,
  onCobrarPrestamo,
  onAbrirPrestamo,
  onSuccess,
}: {
  contacto: Contacto;
  prestamos: Prestamo[];
  pagos: Pago[];
  espacioId: string;
  initialTab?: "ficha" | "editar";
  onClose: () => void;
  onNuevoPrestamo: (contactoId: string) => void;
  onCobrarPrestamo: (prestamoId: string) => void;
  onAbrirPrestamo: (prestamo: Prestamo) => void;
  onSuccess: (msg: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<"ficha" | "editar">(initialTab);
  const [nombre, setNombre] = useState(contacto.nombre);
  const [telefono, setTelefono] = useState(contacto.telefono ?? "");
  const [email, setEmail] = useState(contacto.email ?? "");
  const [notas, setNotas] = useState(contacto.notas ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prestamosContacto = useMemo(() => {
    return prestamos.filter((p) => rel(p.contactos)?.id === contacto.id);
  }, [prestamos, contacto.id]);

  const metricasContacto = useMemo(() => {
    const activos = prestamosContacto.filter((p) => p.estado === "activo" || p.estado === "atrasado");
    const saldados = prestamosContacto.filter((p) => p.estado === "pagado");
    const deudaViva = activos.reduce((sum, p) => sum + loanBalance(p), 0);
    const interesTotalGenerado = prestamosContacto.reduce((sum, p) => sum + Number(p.interes_pagado_total || 0), 0);
    const tieneMora = activos.some((p) => p.estado === "atrasado");

    // Calcular puntualidad sobre cobros registrados
    const idsPrestamos = new Set(prestamosContacto.map((p) => p.id));
    const pagosDeudor = pagos.filter((pg) => {
      const pId = pg.prestamo_id || rel(pg.prestamos)?.id;
      return pId ? idsPrestamos.has(pId) : false;
    });

    const pagosATiempo = pagosDeudor.filter(
      (pg) => !pg.fecha_esperada || pg.recibido_en <= pg.fecha_esperada,
    ).length;

    const scoreRatio = pagosDeudor.length > 0 ? Math.round((pagosATiempo / pagosDeudor.length) * 100) : null;

    let reputacionLabel = "Sin historial de cobros";
    let reputacionBadge = "badge-neutral";
    if (tieneMora) {
      reputacionLabel = "Con cuota en mora";
      reputacionBadge = "badge-atrasado";
    } else if (scoreRatio !== null && scoreRatio >= 85) {
      reputacionLabel = `Excelente pagador (${scoreRatio}% puntual)`;
      reputacionBadge = "badge-al-dia";
    } else if (scoreRatio !== null && scoreRatio >= 50) {
      reputacionLabel = `Pagador regular (${scoreRatio}% puntual)`;
      reputacionBadge = "badge-amber";
    } else if (saldados.length > 0) {
      reputacionLabel = "Cumplidor";
      reputacionBadge = "badge-saldado";
    }

    return {
      activos,
      saldados,
      deudaViva,
      interesTotalGenerado,
      pagosDeudor,
      reputacionLabel,
      reputacionBadge,
    };
  }, [prestamosContacto, pagos]);

  const handleConfirmEditar = async () => {
    if (!nombre.trim()) {
      setError("El nombre del contacto no puede estar vacío.");
      return false;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.append("nombre", nombre.trim());
    fd.append("telefono", telefono.trim());
    fd.append("email", email.trim());
    fd.append("notas", notas.trim());

    const res = await actualizarContacto(contacto.id, espacioId, fd);
    setSubmitting(false);
    if (res.error) {
      const errs = res.error as Record<string, string[]>;
      setError(errs._global?.[0] ?? Object.values(errs).flat()[0] ?? "Error al actualizar el contacto");
      return false;
    }
    await onSuccess("¡Datos del contacto actualizados!");
    onClose();
    return true;
  };

  const handleArchivar = async () => {
    setSubmitting(true);
    const res = await archivarContacto(contacto.id, espacioId);
    setSubmitting(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    await onSuccess("Contacto archivado correctamente.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-3 min-w-0">
            <ContactAvatar name={contacto.nombre} size={44} className="rounded-full shadow-xs shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-heading text-lg font-extrabold text-on-surface truncate">
                  {contacto.nombre}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${metricasContacto.reputacionBadge}`}>
                  {metricasContacto.reputacionLabel}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant truncate">
                {contacto.telefono || "Sin teléfono"} {contacto.email ? `· ${contacto.email}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container-low rounded-xl">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setTab("ficha");
            }}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              tab === "ficha"
                ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Ficha 360° & Préstamos ({prestamosContacto.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setTab("editar");
            }}
            className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === "editar"
                ? "bg-surface-container-lowest text-on-surface shadow-xs font-bold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Editar contacto</span>
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {tab === "ficha" ? (
            <>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/60">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Por cobrar hoy</span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-primary block mt-0.5">
                    {money(metricasContacto.deudaViva)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/60">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">
                    Intereses pagados
                  </span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    +{money(metricasContacto.interesTotalGenerado)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/60">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Créditos</span>
                  <span className="font-heading text-sm sm:text-base font-extrabold text-on-surface block mt-0.5">
                    {metricasContacto.activos.length} activos · {metricasContacto.saldados.length} saldados
                  </span>
                </div>
              </div>

              {contacto.notas && (
                <div className="p-3 rounded-xl bg-surface-container-low/50 border border-surface-container-high/50 text-xs">
                  <span className="text-[10px] font-bold uppercase text-on-surface-variant block mb-0.5">
                    Notas del contacto
                  </span>
                  <p className="text-on-surface whitespace-pre-wrap">{contacto.notas}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Préstamos asociados
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNuevoPrestamo(contacto.id);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors cursor-pointer"
                  >
                    <HandCoins className="w-3.5 h-3.5" />
                    <span>+ Nuevo préstamo</span>
                  </button>
                </div>

                {prestamosContacto.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-dashed border-surface-container-high text-center text-xs text-on-surface-variant">
                    Este contacto no tiene préstamos registrados todavía.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prestamosContacto.map((p) => {
                      const bal = loanBalance(p);
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl border border-surface-container-high/70 bg-surface-container-lowest flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onAbrirPrestamo(p);
                              }}
                              className="font-bold text-on-surface hover:text-primary text-left truncate block cursor-pointer"
                            >
                              {p.nombre} →
                            </button>
                            <span className="text-[11px] text-on-surface-variant">
                              Capital: {money(Number(p.monto_principal))} · Saldo:{" "}
                              <strong className="font-mono text-on-surface">{money(bal)}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {bal > 0.01 && p.estado !== "pagado" && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onCobrarPrestamo(p.id);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-on-primary text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Cobrar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Nombre completo *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className={inputCls}
                    placeholder="+591 70000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Notas</label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className={`${inputCls} h-auto py-2.5`}
                />
              </div>

              {error && (
                <p className="text-xs text-error flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </p>
              )}

              <SlideToConfirm
                submitting={submitting}
                label="Desliza para guardar contacto"
                resetTrigger={contacto.id}
                onConfirm={handleConfirmEditar}
              />

              <div className="pt-3 border-t border-surface-container-low flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">
                  Archivar oculta al contacto sin borrar su historial.
                </span>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleArchivar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archivar contacto</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
