"use client";

import { useState } from "react";
import {
  Code2,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  ReceiptText,
  Check,
} from "lucide-react";
import { ContactAvatar } from "@/components/contact-avatar";

interface SimulatedBorrower {
  id: string;
  name: string;
  loanTitle: string;
  initialPrincipal: number;
  currentPrincipal: number;
  rate: number;
  dueDay: number;
  totalInterestPaid: number;
}

const INITIAL_BORROWERS: SimulatedBorrower[] = [
  {
    id: "b1",
    name: "Carlos Ramírez",
    loanTitle: "Préstamo personal",
    initialPrincipal: 1200,
    currentPrincipal: 1200,
    rate: 5,
    dueDay: 15,
    totalInterestPaid: 60,
  },
  {
    id: "b2",
    name: "Mariana Vega",
    loanTitle: "Cuota de taller",
    initialPrincipal: 450,
    currentPrincipal: 450,
    rate: 3,
    dueDay: 10,
    totalInterestPaid: 13.5,
  },
];

export function AuthShowcase() {
  const [activeTab, setActiveTab] = useState<"prestamo" | "flujo">("prestamo");
  const [borrowers, setBorrowers] = useState<SimulatedBorrower[]>(INITIAL_BORROWERS);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>("b1");
  const [lastAction, setLastAction] = useState<string>("Préstamo activo listo para simular cobros");
  const [actionCount, setActionCount] = useState<number>(0);

  const currentMonthName = new Date().toLocaleString("es", { month: "long" });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  const currentBorrower =
    borrowers.find((b) => b.id === selectedBorrowerId) || borrowers[0];

  const currentInterest = Number(
    (currentBorrower.currentPrincipal * (currentBorrower.rate / 100)).toFixed(2)
  );

  const amortized = Math.max(
    0,
    currentBorrower.initialPrincipal - currentBorrower.currentPrincipal
  );
  const recoveryPct = Math.min(
    100,
    Math.round((amortized / currentBorrower.initialPrincipal) * 100)
  );
  const isSettled = currentBorrower.currentPrincipal <= 0;

  // Manejadores de acciones interactivas
  const handleAbonarCapital = (amount: number) => {
    if (isSettled) return;
    const actualPay = Math.min(amount, currentBorrower.currentPrincipal);
    setBorrowers((prev) =>
      prev.map((b) =>
        b.id === currentBorrower.id
          ? { ...b, currentPrincipal: Math.max(0, b.currentPrincipal - actualPay) }
          : b
      )
    );
    setActionCount((c) => c + 1);
    setLastAction(`✓ Abono de $${actualPay.toFixed(2)} registrado en Efectivo`);
  };

  const handlePagarInteres = () => {
    if (currentInterest <= 0) return;
    setBorrowers((prev) =>
      prev.map((b) =>
        b.id === currentBorrower.id
          ? { ...b, totalInterestPaid: b.totalInterestPaid + currentInterest }
          : b
      )
    );
    setActionCount((c) => c + 1);
    setLastAction(`✓ Interés mensual de $${currentInterest.toFixed(2)} cobrado`);
  };

  const handleLiquidar = () => {
    if (isSettled) return;
    const remaining = currentBorrower.currentPrincipal;
    setBorrowers((prev) =>
      prev.map((b) =>
        b.id === currentBorrower.id
          ? { ...b, currentPrincipal: 0 }
          : b
      )
    );
    setActionCount((c) => c + 1);
    setLastAction(`✓ ¡Crédito saldado! Cobro de $${remaining.toFixed(2)} registrado`);
  };

  const handleReset = () => {
    setBorrowers(INITIAL_BORROWERS);
    setLastAction("Demo reiniciada al estado original");
  };

  // Flujo neto esperado calculado de los préstamos
  const totalExpectedInterest = borrowers.reduce(
    (sum, b) => sum + (b.currentPrincipal > 0 ? b.currentPrincipal * (b.rate / 100) : 0),
    0
  );
  const totalExpectedCapital = borrowers.reduce(
    (sum, b) => sum + (b.currentPrincipal > 0 ? Math.min(b.currentPrincipal, 200) : 0),
    0
  );
  const totalExpectedFlow = totalExpectedCapital + totalExpectedInterest;

  return (
    <div className="hidden lg:flex flex-col flex-1 max-w-[420px] pr-4 select-none relative z-10 shrink-0">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-mono text-[10px] font-medium w-fit mb-1.5 shadow-2xs border border-surface-container-high/40">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span>FinPal · Demo interactiva en vivo</span>
      </div>

      <h1 className="font-heading text-2xl lg:text-3xl font-extrabold text-on-surface tracking-tight mb-1 leading-tight">
        Tu dinero, <span className="text-primary font-extrabold">bajo control.</span>
      </h1>

      <p className="text-xs text-on-surface-variant mb-2.5 leading-relaxed max-w-sm">
        Prueba el sistema en vivo: registra cobros simulados, abona capital y visualiza el flujo en tiempo real.
      </p>

      {/* ─── Tarjeta interactiva compacta de demostración ─────────────────── */}
      <div className="relative bg-surface-container-lowest border border-surface-container-high/70 p-3.5 rounded-2xl shadow-lg overflow-hidden group">
        {/* Cabecera de tarjeta: Pestañas y controles estilo ventana */}
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-error/70" />
            <div className="w-2 h-2 rounded-full bg-amber-400/80" />
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-mono text-[10px] text-on-surface-variant font-medium ml-1">
              finpal.app/demo
            </span>
          </div>

          {/* Pestañas de cambio rápido */}
          <div className="flex items-center gap-1 bg-surface-container-low p-0.5 rounded-md text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("prestamo")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                activeTab === "prestamo"
                  ? "bg-surface-container-lowest text-primary shadow-2xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Préstamos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("flujo")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                activeTab === "flujo"
                  ? "bg-surface-container-lowest text-primary shadow-2xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Flujo Neto
            </button>
          </div>
        </div>

        {activeTab === "prestamo" ? (
          <div className="space-y-2.5">
            {/* Borrower Selector Pills */}
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Deudor de prueba:
              </span>
              <div className="flex items-center gap-1">
                {borrowers.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBorrowerId(b.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      b.id === currentBorrower.id
                        ? "bg-primary text-on-primary shadow-2xs"
                        : "bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-surface-container-high/40"
                    }`}
                  >
                    {b.name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Fila de perfil del deudor (Similar a la tabla del panel) */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-surface-container-low/70 border border-surface-container-high/40">
              <div className="flex items-center gap-2 min-w-0">
                <ContactAvatar
                  name={currentBorrower.name}
                  size={30}
                  className="rounded-full shadow-2xs shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-on-surface truncate leading-tight">
                    {currentBorrower.name}
                  </p>
                  <p className="text-[10px] text-on-surface-variant truncate">
                    {currentBorrower.loanTitle} · Día {currentBorrower.dueDay}
                  </p>
                </div>
              </div>

              {/* Insignia dinámica de estado */}
              <div className="shrink-0">
                {isSettled ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Check className="w-2.5 h-2.5" /> Saldado
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-container/50 text-on-secondary-container border border-primary/20">
                    Al día (+{currentBorrower.rate}% mes)
                  </span>
                )}
              </div>
            </div>

            {/* Tarjetas de métricas financieras */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-container-low/50 p-2 rounded-xl border border-surface-container-high/30">
                <p className="text-[9px] text-on-surface-variant font-medium">Por cobrar</p>
                <p className="font-heading text-sm sm:text-base font-extrabold text-on-surface font-mono mt-0.5">
                  ${currentBorrower.currentPrincipal.toFixed(2)}
                </p>
                <p className="text-[9px] text-on-surface-variant mt-0.5">
                  Inicial: ${currentBorrower.initialPrincipal.toFixed(2)}
                </p>
              </div>

              <div className="bg-surface-container-low/50 p-2 rounded-xl border border-surface-container-high/30">
                <p className="text-[9px] text-on-surface-variant font-medium">Interés mensual</p>
                <p className="font-heading text-sm sm:text-base font-extrabold text-primary font-mono mt-0.5">
                  {currentInterest > 0 ? `+$${currentInterest.toFixed(2)}` : "$0.00"}
                </p>
                <p className="text-[9px] text-on-surface-variant mt-0.5">
                  Cobrado: ${currentBorrower.totalInterestPaid.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Barra de progreso de capital pagado */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[10px] font-semibold">
                <span className="text-on-surface-variant">Capital Pagado</span>
                <span className="text-primary font-bold">{recoveryPct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${recoveryPct}%` }}
                />
              </div>
            </div>

            {/* Botones de acción interactiva */}
            <div className="pt-2 border-t border-surface-container-low">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <ReceiptText className="w-3 h-3 text-primary" /> Registrar cobro rápido:
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[9px] font-semibold text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reiniciar prueba"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Reiniciar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  disabled={isSettled}
                  onClick={() => handleAbonarCapital(200)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-40 transition-all shadow-2xs cursor-pointer active:scale-95 text-center truncate"
                >
                  +$200 Capital
                </button>
                <button
                  type="button"
                  disabled={isSettled || currentInterest <= 0}
                  onClick={handlePagarInteres}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container-high/60 disabled:opacity-40 transition-all cursor-pointer active:scale-95 text-center truncate"
                >
                  Solo interés
                </button>
                <button
                  type="button"
                  disabled={isSettled}
                  onClick={handleLiquidar}
                  className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container-high/60 disabled:opacity-40 transition-all cursor-pointer active:scale-95 text-center truncate"
                >
                  Liquidar
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Tab 2: Flujo Neto Esperado con Sparkline Elegante */
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">
                  Flujo Neto Esperado ({capitalizedMonth})
                </span>
                <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20">
                  Proyección
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-heading text-xl font-extrabold text-on-surface font-mono">
                  ${totalExpectedFlow.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold text-primary inline-flex items-center gap-0.5">
                  ↑ Cobros programados
                </span>
              </div>
            </div>

            {/* Inline SVG Sparkline con degradado */}
            <div className="h-12 w-full">
              <svg className="w-full h-full text-primary" preserveAspectRatio="none" viewBox="0 0 300 70">
                <defs>
                  <linearGradient id="chartGradDemo" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0,55 Q 30,50 60,35 T 120,40 T 180,25 T 240,15 T 300,5 L 300,70 L 0,70 Z"
                  fill="url(#chartGradDemo)"
                />
                <path
                  d="M 0,55 Q 30,50 60,35 T 120,40 T 180,25 T 240,15 T 300,5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            <div className="pt-1.5 border-t border-surface-container-low flex items-center justify-between text-[10px] text-on-surface-variant">
              <span>
                Capital: <b className="text-on-surface font-mono font-semibold">${totalExpectedCapital.toFixed(2)}</b>
              </span>
              <span>
                Intereses: <b className="text-primary font-mono font-bold">${totalExpectedInterest.toFixed(2)}</b>
              </span>
            </div>
          </div>
        )}

        {/* Live Event Feedback Bar */}
        <div className="mt-2 pt-2 border-t border-surface-container-low flex items-center gap-1.5 text-[9px] text-on-surface-variant bg-surface-container-low/40 p-1.5 rounded-lg">
          <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate">{lastAction}</span>
          {actionCount > 0 && (
            <span className="ml-auto text-[9px] font-mono text-primary font-bold shrink-0">
              {actionCount} {actionCount === 1 ? "cobro" : "cobros"}
            </span>
          )}
        </div>

        {/* Subtle backdrop decorative glow */}
        <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Trust Badge */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-outline font-medium">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Cifrado de extremo a extremo</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Code2 className="w-3.5 h-3.5 text-primary" />
          <span>Información centralizada</span>
        </div>
      </div>
    </div>
  );
}


