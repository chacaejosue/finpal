"use client";

import { Code2, ShieldCheck } from "lucide-react";

export function AuthShowcase() {
  return (
    <div className="hidden lg:flex flex-col flex-1 max-w-md pr-6 select-none relative z-10">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-mono text-xs font-medium w-fit mb-6 shadow-2xs border border-surface-container-high/40">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>FinPal · Proyecto personal en desarrollo</span>
      </div>

      <h1 className="font-heading text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight mb-4 leading-[1.15]">
        Tu dinero, <br />
        <span className="text-primary font-extrabold">bajo control.</span>
      </h1>

      <p className="text-base text-on-surface-variant mb-8 leading-relaxed">
        Centraliza tus cuentas, movimientos, cobros y préstamos en un solo lugar. Una herramienta personal,
        sencilla y en español.
      </p>

      {/* Preview Mockup Card */}
      <div className="relative bg-surface-container-lowest border border-surface-container-high/70 p-5 rounded-2xl shadow-xl overflow-hidden group">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-container-low">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-error/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-secondary-fixed-dim" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary-fixed" />
            <span className="font-mono text-xs text-on-surface-variant font-medium ml-2">Ledger Personal #01</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed border border-primary/20">
            Al día
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-surface-container-low/70 p-3 rounded-xl border border-surface-container-high/30">
            <p className="text-xs text-outline font-medium">Total por cobrar</p>
            <p className="font-heading text-lg text-on-surface font-bold mt-0.5">$14,850.00</p>
          </div>
          <div className="bg-surface-container-low/70 p-3 rounded-xl border border-surface-container-high/30">
            <p className="text-xs text-outline font-medium">Próximo vencimiento</p>
            <p className="font-heading text-lg text-primary font-bold mt-0.5">18 Octubre</p>
          </div>
        </div>

        {/* Mini Sparkline Data Viz */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-outline font-medium">
            <span>Rendimiento de cobro</span>
            <span className="text-primary font-bold">92.4%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden p-0.5">
            <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: "92.4%" }} />
          </div>
        </div>

        {/* Subtle backdrop decorative glow */}
        <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-primary/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Trust Badge */}
      <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-outline font-medium">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Cifrado de extremo a extremo</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <Code2 className="w-4 h-4 text-primary" />
          <span>Información centralizada</span>
        </div>
      </div>
    </div>
  );
}
