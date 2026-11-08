"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
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
  RotateCcw,
  MessageCircle,
  ShieldCheck,
  Barcode,
  Image as ImageIcon,
  Download,
  Eye,
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
  anularPrestamo,
} from "@/app/(dashboard)/prestamos/actions";
import { actualizarContacto, archivarContacto } from "@/app/(dashboard)/contactos/actions";

const inputCls =
  "w-full h-10 px-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
const selectCls =
  "w-full h-10 pl-3.5 pr-10 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 text-base sm:text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer";

// ═══════════════════════════════════════════════════════════════════════════
// 1. COMPROBANTE OFICIAL DE PAGO PARA EL DEUDOR (IMAGEN Y PDF/IMPRESIÓN)
// ═══════════════════════════════════════════════════════════════════════════

export function ReciboClienteDocumento({
  pago,
  espacioNombre,
  colorAcento,
  deudorNombre,
  prestamoNombre,
  folio,
  saldoActualPrestamo,
  fechaHoraRegistro,
  puntualidad,
}: {
  pago: Pago;
  espacioNombre?: string;
  colorAcento?: string;
  deudorNombre: string;
  prestamoNombre: string;
  folio: string;
  saldoActualPrestamo: number | null;
  fechaHoraRegistro: string;
  puntualidad: {
    esPuntual: boolean;
    diasDiferencia: number;
    mensaje: string;
  };
}) {
  return (
    <div
      className="bg-white text-slate-900 w-full max-w-[740px] mx-auto p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden font-sans print:border-none print:shadow-none print:p-6 print:rounded-none"
      style={{ boxSizing: "border-box" }}
    >
      {/* Banda decorativa superior oficial FinPal */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600" />

      {/* Cabecera Oficial del Comprobante */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-dashed border-slate-200 mt-1">
        <div className="flex items-center gap-3">
          <FinPalLogo size={42} className="w-10 h-10 shrink-0" colorAcento={colorAcento} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-heading">
                Fin<span className="text-emerald-600">Pal</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                #REC-{folio}
              </span>
            </div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 mt-0.5">
              Comprobante Oficial de Pago
            </p>
            {espacioNombre && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Emitido por: <strong className="text-slate-700 font-semibold">{espacioNombre}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold whitespace-nowrap mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>PAGO CONFIRMADO</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            {fechaHoraRegistro}
          </p>
        </div>
      </div>

      {/* Monto Recibido - Tarjeta Hero Horizontal Amplia */}
      <div className="my-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/80 border border-emerald-200/80 p-4 sm:p-5 text-center relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-200/30 blur-lg pointer-events-none" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 block mb-1">
          Monto Total Recibido
        </span>
        <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {money(Number(pago.monto_total))}
        </div>
        <p className="text-xs text-slate-600 mt-1">
          Acreditado con éxito el <strong className="text-slate-800 font-semibold">{formatDateEs(pago.recibido_en)}</strong>
        </p>
      </div>

      {/* Datos del Cliente y la Operación en 2 Columnas Anchas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
        {/* Columna Izquierda: Cliente & Crédito */}
        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Cliente / Pagador:</span>
            <span className="font-bold text-slate-900 text-right truncate max-w-[190px]">
              {deudorNombre}
            </span>
          </div>

          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Concepto / Motivo:</span>
            <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">
              {prestamoNombre}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Mes o cuota:</span>
            <span className="font-bold text-emerald-700 text-right">
              {pago.fecha_esperada ? formatMonthYear(pago.fecha_esperada) : "A cuenta general"}
            </span>
          </div>
        </div>

        {/* Columna Derecha: Método y Puntualidad */}
        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Forma de entrega:</span>
            <span className="font-semibold text-slate-800 text-right">
              {pago.metodo_pago || "Efectivo / Transferencia"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Cumplimiento:</span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                puntualidad.esPuntual
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {puntualidad.esPuntual ? "✓ Pago puntual" : puntualidad.mensaje}
            </span>
          </div>
        </div>
      </div>

      {/* Estado del Crédito para el Cliente (Sin notas privadas ni desglose de ganancias) */}
      <div className="mb-4">
        {saldoActualPrestamo !== null && saldoActualPrestamo <= 0.01 ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-300 p-3 text-center space-y-0.5">
            <div className="flex items-center justify-center gap-2 text-emerald-800 font-black text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡CRÉDITO 100% SALDADO Y CANCELADO!</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Certificamos que esta deuda ha quedado completamente liquidada. Saldo pendiente: <strong>0.00</strong>.
            </p>
          </div>
        ) : saldoActualPrestamo !== null && saldoActualPrestamo > 0.01 ? (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Saldo restante de su crédito:</span>
            <span className="font-mono font-extrabold text-sm text-slate-900">
              {money(saldoActualPrestamo)}
            </span>
          </div>
        ) : null}
      </div>

      {/* Mensaje de Agradecimiento y Confianza Institucional */}
      <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/70 p-3 mb-4 text-xs text-emerald-950 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">¡Muchas gracias por su confianza y cumplimiento!</p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Estimado(a) <strong>{deudorNombre}</strong>: su puntualidad mantiene abiertas las puertas para futuros respaldos financieros. Es un placer contar con usted.
          </p>
        </div>
      </div>

      {/* Pie de Certificación y Seguridad Digital */}
      <div className="pt-3 border-t border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-slate-500">
        <div className="flex items-center gap-2.5">
          <div className="font-mono text-sm tracking-tighter text-slate-400 select-none">
            ❚❙❘❚❙❚❘❙❚❘❚❙❘
          </div>
          <div>
            <p className="font-mono font-bold text-slate-700">
              ID: FP-{folio}-{pago.prestamo_id.slice(0, 4).toUpperCase()}
            </p>
            <p className="text-[10px] text-slate-500">
              Comprobante digital emitido en FinPal · Documento oficial de respaldo
            </p>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-mono">
          Folio #{folio}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODAL DE COMPROBANTE DE COBRO (INTERFAZ DE PANEL + GENERADOR)
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
  const [generandoImagen, setGenerandoImagen] = useState(false);
  const [imagenDescargada, setImagenDescargada] = useState(false);
  const reciboDocRef = useRef<HTMLDivElement>(null);

  const prestamoRel = rel(pago.prestamos);
  const contactoRel = rel(prestamoRel?.contactos);
  const cuentaRel = rel(pago.cuentas_dinero);

  const deudorNombre = contactoRel?.nombre ?? (prestamo ? rel(prestamo.contactos)?.nombre : null) ?? "Contacto";
  const prestamoNombre = prestamoRel?.nombre ?? prestamo?.nombre ?? "Préstamo";
  const cuentaNombre = cuentaRel?.nombre ?? "Cuenta registrada";
  const folio = pago.id.slice(0, 8).toUpperCase();
  const saldoActualPrestamo = prestamo
    ? loanBalance(prestamo)
    : prestamoRel?.monto_principal !== undefined && prestamoRel?.monto_capital_pagado !== undefined
    ? Math.max(0, Number(prestamoRel.monto_principal) - Number(prestamoRel.monto_capital_pagado))
    : null;

  const fechaHoraRegistro = useMemo(() => {
    try {
      const d = pago.created_at ? new Date(pago.created_at) : new Date();
      return `${formatDateEs(pago.recibido_en || getLocalDateString())} · ${d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return formatDateEs(pago.recibido_en);
    }
  }, [pago]);

  // Cálculo de puntualidad
  const puntualidad = useMemo(() => {
    if (!pago.fecha_esperada) {
      return { esPuntual: true, diasDiferencia: 0, mensaje: "✓ Al día" };
    }
    try {
      const rec = new Date(pago.recibido_en).getTime();
      const esp = new Date(pago.fecha_esperada).getTime();
      const diffMs = rec - esp;
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        return { esPuntual: true, diasDiferencia: 0, mensaje: "✓ Pago puntual" };
      }
      return {
        esPuntual: false,
        diasDiferencia: diffDays,
        mensaje: `${diffDays}d posterior a fecha acordada`,
      };
    } catch {
      return { esPuntual: true, diasDiferencia: 0, mensaje: "✓ Al día" };
    }
  }, [pago]);

  // Mensaje de texto amigable para el deudor (sin notas internas ni desglose de ganancia)
  const textoParaDeudor = useMemo(() => {
    const lines = [
      `🧾 *COMPROBANTE OFICIAL DE PAGO — FinPal*`,
      `*Comprobante N.º:* #${folio}`,
      `──────────────────────────`,
      `👤 *Cliente:* ${deudorNombre}`,
      `💰 *Monto recibido:* ${money(Number(pago.monto_total))}`,
      `📅 *Fecha:* ${formatDateEs(pago.recibido_en)}`,
      `📌 *Concepto:* ${prestamoNombre}`,
      `🗓️ *Período / Cuota:* ${pago.fecha_esperada ? formatMonthYear(pago.fecha_esperada) : "A cuenta general"}`,
      `✅ *Cumplimiento:* ${puntualidad.esPuntual ? "Pago puntual y al día" : puntualidad.mensaje}`,
      saldoActualPrestamo !== null && saldoActualPrestamo > 0.01
        ? `💵 *Saldo restante de su crédito:* ${money(saldoActualPrestamo)}`
        : saldoActualPrestamo !== null && saldoActualPrestamo <= 0.01
        ? `🎉 *¡Crédito 100% saldado y liquidado!*`
        : "",
      `──────────────────────────`,
      `_¡Muchas gracias por su puntualidad y confianza!_`,
      `_Comprobante digital oficial emitido a través de FinPal._`,
    ];
    return lines.filter(Boolean).join("\n");
  }, [pago, folio, deudorNombre, prestamoNombre, puntualidad, saldoActualPrestamo]);

  const handleCopiarTexto = async () => {
    try {
      await navigator.clipboard.writeText(textoParaDeudor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2400);
    } catch {}
  };

  const handleGenerarImagen = async () => {
    if (!reciboDocRef.current) return;
    setGenerandoImagen(true);
    try {
      const dataUrl = await toPng(reciboDocRef.current, {
        pixelRatio: 2.5,
        cacheBust: true,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const safeName = deudorNombre.replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `Comprobante-REC-${folio}-${safeName}.png`;
      link.href = dataUrl;
      link.click();
      setImagenDescargada(true);
      setTimeout(() => setImagenDescargada(false), 3000);
    } catch (err) {
      console.error("Error al generar imagen de recibo:", err);
    } finally {
      setGenerandoImagen(false);
    }
  };

  const handleImprimir = () => {
    document.body.classList.add("imprimiendo-recibo-cliente");
    window.print();
    const cleanClass = () => document.body.classList.remove("imprimiendo-recibo-cliente");
    window.addEventListener("afterprint", cleanClass, { once: true });
    setTimeout(cleanClass, 3000);
  };

  return (
    <>
      {/* Contenedor Exclusivo de Impresión (aislado en 1 sola página para @media print) */}
      <div id="recibo-cliente-impresion" className="hidden">
        <ReciboClienteDocumento
          pago={pago}
          espacioNombre={espacioNombre}
          colorAcento={colorAcento}
          deudorNombre={deudorNombre}
          prestamoNombre={prestamoNombre}
          folio={folio}
          saldoActualPrestamo={saldoActualPrestamo}
          fechaHoraRegistro={fechaHoraRegistro}
          puntualidad={puntualidad}
        />
      </div>

      {/* Modal Interactivo en Pantalla (para el prestamista) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 modal-interfaz-cobro select-none print:hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-surface-container-lowest border border-surface-container-high/90 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh] relative select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Banda decorativa superior */}
          <div className="h-2 w-full bg-gradient-to-r from-primary via-emerald-500 to-primary/80 shrink-0" />

          {/* Encabezado del modal */}
          <div className="p-4 sm:p-5 border-b border-surface-container-high/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-on-surface">
                  ¡Cobro registrado con éxito!
                </h2>
                <p className="text-[11px] text-on-surface-variant">
                  Guardado en tu panel. Abajo tienes tu resumen interno y el comprobante listo para tu cliente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo con Scroll: Resumen Interno + Comprobante para el Cliente */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {/* Tarjeta de Resumen Interno (Privado para el usuario) */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-on-surface">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span>Resumen interno de este cobro:</span>
                </span>
                <span className="font-mono text-sm sm:text-base text-primary font-bold">
                  {money(Number(pago.monto_total))}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-primary/10 text-on-surface-variant">
                <div className="flex items-center justify-between">
                  <span>Resta a la deuda de capital:</span>
                  <strong className="font-mono text-on-surface">{money(Number(pago.monto_principal))}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>Tu ganancia por interés:</span>
                  <strong className="font-mono text-primary">{money(Number(pago.monto_interes))}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>Ingresado en cuenta:</span>
                  <strong className="text-on-surface truncate max-w-[140px]">{cuentaNombre}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span>Deuda que le queda:</span>
                  <strong className="font-mono text-on-surface">
                    {saldoActualPrestamo !== null ? money(saldoActualPrestamo) : "0.00"}
                  </strong>
                </div>
              </div>

              {pago.notas && (
                <div className="pt-2 border-t border-primary/10 text-[11px] text-on-surface-variant">
                  <span className="font-semibold text-on-surface">Tu apunte interno:</span>{" "}
                  <span className="italic">{pago.notas}</span>
                </div>
              )}
            </div>

            {/* Separador con Título de la Sección del Cliente */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                  <ReceiptText className="w-4 h-4 text-emerald-600" />
                  <span>Comprobante para entregar a {deudorNombre}</span>
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Sin notas privadas ni desglose de ganancia
                </span>
              </div>

              {/* Documento Renderizado (Servirá para la Imagen y Previsualización) */}
              <div
                ref={reciboDocRef}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm"
              >
                <ReciboClienteDocumento
                  pago={pago}
                  espacioNombre={espacioNombre}
                  colorAcento={colorAcento}
                  deudorNombre={deudorNombre}
                  prestamoNombre={prestamoNombre}
                  folio={folio}
                  saldoActualPrestamo={saldoActualPrestamo}
                  fechaHoraRegistro={fechaHoraRegistro}
                  puntualidad={puntualidad}
                />
              </div>
            </div>
          </div>

          {/* Barra de Acciones */}
          <div className="p-4 bg-surface-container-low/80 border-t border-outline/15 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Botón Generar Imagen (PNG) */}
              <button
                type="button"
                onClick={handleGenerarImagen}
                disabled={generandoImagen}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Generar y descargar imagen PNG del comprobante"
              >
                {generandoImagen ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : imagenDescargada ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>¡Imagen guardada!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Generar imagen</span>
                  </>
                )}
              </button>

              {/* Botón Imprimir / PDF */}
              <button
                type="button"
                onClick={handleImprimir}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline/20 bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                title="Imprimir o guardar como PDF en 1 sola hoja"
              >
                <Printer className="w-3.5 h-3.5 text-on-surface-variant" />
                <span>Imprimir / PDF</span>
              </button>

              {/* Botón Copiar Texto */}
              <button
                type="button"
                onClick={handleCopiarTexto}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-outline/20 bg-surface-container-lowest hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                title="Copiar texto formateado para enviar por WhatsApp o mensaje"
              >
                {copiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-primary" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold shadow-xs transition-colors cursor-pointer ml-auto"
            >
              Listo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
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

  const pointerDownOnBackdrop = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerDownOnBackdrop.current || e.target !== e.currentTarget) return;
    pointerDownOnBackdrop.current = false;
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col select-text"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-heading text-lg font-bold text-on-surface">
                Calculadora de préstamos
              </h2>
              <p className="text-xs text-on-surface-variant">
                Calcula cuánto ganarás y cómo quedarán los pagos antes de prestar el dinero.
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
              <label className="block text-xs font-semibold text-on-surface mb-1">¿Cuánto vas a prestar?</label>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-on-surface">Interés mensual (%)</label>
                {tasa > 3 && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    &gt; 3% (Tope sugerido Bolivia)
                  </span>
                )}
              </div>
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
              <label className="block text-xs font-semibold text-on-surface mb-1">Cantidad de cuotas o meses</label>
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
              <label className="block text-xs font-semibold text-on-surface mb-1">¿Cada cuánto te pagará?</label>
              <select
                value={frecuencia}
                onChange={(e) => setFrecuencia(e.target.value as typeof frecuencia)}
                className={selectCls}
              >
                <option value="mensual">Mensual (cada mes)</option>
                <option value="quincenal">Quincenal (cada 15 días)</option>
                <option value="semanal">Semanal (cada 7 días)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">¿Cómo te devolverá el dinero?</label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as typeof modalidad)}
                className={selectCls}
              >
                <option value="solo_interes">Paga solo interés cada mes y devuelve todo el dinero al final</option>
                <option value="capital_fijo">Devuelve una parte del dinero cada mes + su interés</option>
                <option value="cuota_fija">Cuotas iguales todos los meses (dinero + interés)</option>
              </select>
            </div>
          </div>

          {tasa > 3 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                <b>Nota amistosa:</b> En Bolivia la ley sugiere hasta un 3% mensual como referencia. FinPal guardará el porcentaje que decidas.
              </span>
            </div>
          )}

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
                Ganancia total esperada
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                +{money(simulacion.totalInteres)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-low/80 border border-surface-container-high/60">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                Total que recibirás
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-on-surface block mt-0.5">
                {money(simulacion.totalPagado)}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-surface-container-low/80 border border-surface-container-high/60">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant block">
                Rendimiento total
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-on-surface block mt-0.5">
                +{simulacion.roi.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Tabla de Cronograma Proyectado */}
          <div className="rounded-2xl border border-surface-container-high/70 overflow-hidden">
            <div className="px-3.5 py-2 bg-surface-container-low text-xs font-bold text-on-surface flex items-center justify-between">
              <span>Pagos proyectados ({simulacion.filas.length} cuotas)</span>
              <span className="text-[11px] font-normal text-on-surface-variant capitalize">
                Frecuencia {frecuencia}
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low/50 text-[10px] uppercase text-on-surface-variant font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Pago Total</th>
                    <th className="py-2 px-3">Dinero devuelto</th>
                    <th className="py-2 px-3">Tu ganancia</th>
                    <th className="py-2 px-3 text-right">Deuda pendiente</th>
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
      </motion.div>
    </motion.div>
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
  const [confirmarRevertir, setConfirmarRevertir] = useState(false);

  // Estado formulario Editar
  const [nombre, setNombre] = useState(prestamo.nombre);
  const [fechaInicio, setFechaInicio] = useState(prestamo.fecha_inicio ?? "");
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
    fd.append("fecha_inicio", fechaInicio);
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

  const handleAnularYRevertir = async () => {
    setSubmitting(true);
    setError(null);
    const res = await anularPrestamo(prestamo.id, espacioId);
    setSubmitting(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return false;
    }
    if ("success" in res && res.success) {
      await onSuccess(res.message);
      onClose();
      return true;
    }
    return false;
  };

  const isDirtyEditar = nombre !== prestamo.nombre || cobraInteres !== prestamo.cobra_interes || tasa !== prestamo.tasa_interes_mensual || diaPago !== prestamo.dia_pago || notas !== (prestamo.notas ?? "");
  const isDirtyAmpliar = montoAmpliacion !== "" || notasAmpliacion.trim().length > 0;
  const isEditing = (tab === "editar" && isDirtyEditar) || (tab === "ampliar" && isDirtyAmpliar);

  const [shake, setShake] = useState(false);
  const [showProtectedNotice, setShowProtectedNotice] = useState(false);
  const pointerDownOnBackdrop = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerDownOnBackdrop.current || e.target !== e.currentTarget) return;
    pointerDownOnBackdrop.current = false;

    if (isEditing) {
      setShake(true);
      setShowProtectedNotice(true);
      setTimeout(() => setShake(false), 350);
      setTimeout(() => setShowProtectedNotice(false), 2200);
      return;
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className={`bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col relative select-text ${
          shake ? "animate-modal-shake" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Aviso flotante de protección de edición */}
        {showProtectedNotice && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 bg-surface-container-highest/95 backdrop-blur-md text-primary text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg border border-primary/30 flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Formulario en edición · Usa la ✕ para salir</span>
          </div>
        )}
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
                    ? "Totalmente pagado"
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
            Historial de cobros ({pagosDelPrestamo.length})
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
            <span>Prestar más dinero</span>
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
            <span>Editar condiciones</span>
          </button>
        </div>

        {/* Contenido por pestaña */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {tab === "kardex" && (
            <>
              {/* Barra de Progreso de Amortización */}
              <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-surface-container-high/60 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-on-surface">Progreso de devolución del dinero</span>
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
                    <span className="text-[10px] text-on-surface-variant block uppercase">Dinero prestado</span>
                    <span className="font-mono font-bold text-on-surface">{money(principal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase">Dinero devuelto</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {money(pagadoCap)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase">Falta cobrar</span>
                    <span className="font-mono font-extrabold text-primary">{money(balance)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant block uppercase">Ganancia generada</span>
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
                    Historial de pagos recibidos ({pagosDelPrestamo.length})
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
                      <span>Anotar cobro ahora</span>
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
              <div className="pt-3 border-t border-surface-container-low space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-on-surface-variant">
                    ¿Registraste este préstamo por error? Puedes archivarlo o eliminarlo revirtiendo saldos.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleArchivar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archivar</span>
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setConfirmarRevertir((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{confirmarRevertir ? "Cancelar reversión" : "Eliminar y revertir préstamo"}</span>
                    </button>
                  </div>
                </div>

                {confirmarRevertir && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/8 border border-rose-500/25 space-y-2.5 text-xs">
                    <p className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      Confirmar eliminación y reversión total del préstamo
                    </p>
                    <p className="text-on-surface-variant leading-relaxed">
                      Se eliminará este préstamo y se devolverá el capital desembolsado (<strong className="font-mono text-on-surface">{money(principal)}</strong>) al saldo de la cuenta de origen.
                      {pagosDelPrestamo.length > 0
                        ? ` También se revertirán sus ${pagosDelPrestamo.length} cobro(s) registrado(s) para mantener cuadradas tus cuentas.`
                        : ""}
                      {" "}Esta acción quedará registrada en la bitácora de auditoría.
                    </p>
                    <SlideToConfirm
                      submitting={submitting}
                      label="Desliza para eliminar y revertir préstamo"
                      resetTrigger={`${prestamo.id}-revertir`}
                      onConfirm={handleAnularYRevertir}
                    />
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
                  Suma dinero adicional a este mismo préstamo y descuenta el desembolso de la cuenta de origen que elijas. Dinero prestado total:{" "}
                  <strong className="font-mono text-on-surface">{money(principal)}</strong> (Falta cobrar:{" "}
                  <strong className="font-mono text-primary">{money(balance)}</strong>).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    ¿Cuánto dinero adicional vas a prestar? *
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
                  <label className="block text-xs font-semibold text-on-surface mb-1">¿Qué fecha entregas este dinero? *</label>
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
                  ¿De qué cuenta sale el dinero? *
                </label>
                <select
                  value={cuentaAmpliacionId}
                  onChange={(e) => setCuentaAmpliacionId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">— Elige una cuenta —</option>
                  {cuentas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Tiene: {money(c.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  ¿Para qué es o cómo lo recuerdas? (opcional)
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
                label="Desliza para prestar este dinero adicional"
                resetTrigger={`${prestamo.id}-ampliar`}
                onConfirm={handleConfirmAmpliar}
              />
            </div>
          )}

          {tab === "editar" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    ¿Para qué es el préstamo? *
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
                    Fecha de inicio / entrega *
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
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

              <div className="pt-3 border-t border-surface-container-low space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-on-surface-variant">
                    ¿Registraste este préstamo por error? Puedes archivarlo o eliminarlo revirtiendo saldos.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleArchivar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archivar</span>
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setConfirmarRevertir((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{confirmarRevertir ? "Cancelar reversión" : "Eliminar y revertir préstamo"}</span>
                    </button>
                  </div>
                </div>

                {confirmarRevertir && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/8 border border-rose-500/25 space-y-2.5 text-xs">
                    <p className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      Confirmar eliminación y reversión total del préstamo
                    </p>
                    <p className="text-on-surface-variant leading-relaxed">
                      Se eliminará este préstamo y se devolverá el capital desembolsado (<strong className="font-mono text-on-surface">{money(principal)}</strong>) al saldo de la cuenta de origen.
                      {pagosDelPrestamo.length > 0
                        ? ` También se revertirán sus ${pagosDelPrestamo.length} cobro(s) registrado(s) para mantener cuadradas tus cuentas.`
                        : ""}
                      {" "}Esta acción quedará registrada en la bitácora de auditoría.
                    </p>
                    <SlideToConfirm
                      submitting={submitting}
                      label="Desliza para eliminar y revertir préstamo"
                      resetTrigger={`${prestamo.id}-revertir`}
                      onConfirm={handleAnularYRevertir}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
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
      reputacionLabel = "Tiene pagos retrasados";
      reputacionBadge = "badge-atrasado";
    } else if (scoreRatio !== null && scoreRatio >= 85) {
      reputacionLabel = `Muy puntual (${scoreRatio}% a tiempo)`;
      reputacionBadge = "badge-al-dia";
    } else if (scoreRatio !== null && scoreRatio >= 50) {
      reputacionLabel = `Pagador regular (${scoreRatio}% puntual)`;
      reputacionBadge = "badge-amber";
    } else if (saldados.length > 0) {
      reputacionLabel = "Ha pagado todos sus préstamos";
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

  const isDirty = nombre !== contacto.nombre || telefono !== (contacto.telefono ?? "") || email !== (contacto.email ?? "") || notas !== (contacto.notas ?? "");
  const isEditing = tab === "editar" && isDirty;

  const [shake, setShake] = useState(false);
  const [showProtectedNotice, setShowProtectedNotice] = useState(false);
  const pointerDownOnBackdrop = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pointerDownOnBackdrop.current || e.target !== e.currentTarget) return;
    pointerDownOnBackdrop.current = false;

    if (isEditing) {
      setShake(true);
      setShowProtectedNotice(true);
      setTimeout(() => setShake(false), 350);
      setTimeout(() => setShowProtectedNotice(false), 2200);
      return;
    }

    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
      onPointerDown={handlePointerDown}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 14 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className={`bg-surface-container-lowest border border-surface-container-high/80 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col relative select-text ${
          shake ? "animate-modal-shake" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Aviso flotante de protección de edición */}
        {showProtectedNotice && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 bg-surface-container-highest/95 backdrop-blur-md text-primary text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg border border-primary/30 flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Formulario en edición · Usa la ✕ para salir</span>
          </div>
        )}
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
            Perfil y préstamos ({prestamosContacto.length})
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
            <span>Editar datos</span>
          </button>
        </div>

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {tab === "ficha" ? (
            <>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/60">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Deuda activa</span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-primary block mt-0.5">
                    {money(metricasContacto.deudaViva)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/60">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">
                    Ganancias recibidas
                  </span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    +{money(metricasContacto.interesTotalGenerado)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/60">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Préstamos</span>
                  <span className="font-heading text-sm sm:text-base font-extrabold text-on-surface block mt-0.5">
                    {metricasContacto.activos.length} vigentes · {metricasContacto.saldados.length} completados
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
                    Préstamos registrados
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
                    <span>+ Prestar dinero</span>
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
      </motion.div>
    </motion.div>
  );
}
