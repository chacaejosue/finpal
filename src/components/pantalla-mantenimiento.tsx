"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  Wrench,
  Mail,
  ArrowRight,
} from "lucide-react";
import { MANTENIMIENTO_CONFIG } from "@/config/mantenimiento";

export function PantallaMantenimiento({ isPreview = false }: { isPreview?: boolean }) {
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const handleCheckStatus = () => {
    setChecking(true);
    setCheckMessage(null);
    setTimeout(() => {
      setChecking(false);
      setCheckMessage("Aún estamos aplicando optimizaciones. Revisa en unos instantes.");
      // Si no está en modo vista previa, recargar la página para verificar el estado
      if (!isPreview) {
        window.location.reload();
      }
    }, 1200);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-surface text-on-surface overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* ─── Ambient Glow & Grid Background ──────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Top-center radial emerald glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/10 rounded-full blur-[140px] opacity-75 dark:opacity-40" />
        {/* Bottom subtle secondary glow */}
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[400px] bg-amber-500/5 rounded-full blur-[120px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* ─── Cabecera ──────────────────────────────────────────────────────── */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-surface-container-lowest border border-surface-container-high/80 p-1.5 shadow-2xs flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="FinPal"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex items-baseline tracking-tight font-heading text-lg">
            <span className="font-extrabold text-on-surface">Fin</span>
            <span className="font-extrabold text-primary">Pal</span>
          </div>
        </div>

        {/* Indicador de estado en vivo */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>{MANTENIMIENTO_CONFIG.badge}</span>
        </div>
      </header>

      {/* ─── Contenedor principal de contenido ────────────────────────────── */}
      <main className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Insignia de mascota / ícono con halo ambiental */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl scale-110 -z-10 animate-pulse" />
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-surface-container-lowest border-2 border-surface-container-high/80 p-4 shadow-xl flex items-center justify-center relative">
            <Image
              src="/logo.svg"
              alt="Mascota FinPal"
              width={80}
              height={80}
              className="w-full h-full object-contain drop-shadow-sm"
              priority
            />
            {/* Pequeña insignia flotante de herramienta */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-on-primary border-2 border-surface flex items-center justify-center shadow-md">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Title & Headline */}
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
          {MANTENIMIENTO_CONFIG.titulo}
        </h1>

        <p className="mt-3 text-sm sm:text-base text-on-surface-variant max-w-lg leading-relaxed">
          {MANTENIMIENTO_CONFIG.subtitulo}
        </p>

        {/* Security Reassurance Pill */}
        <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Tus datos, préstamos y balances están 100% seguros y respaldados</span>
        </div>

        {/* ─── Roadmap / Progress Phases ──────────────────────────────────── */}
        <div className="w-full mt-8 bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-5 border border-surface-container-high/70 shadow-sm text-left space-y-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-on-surface pb-2 border-b border-surface-container-low">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Avance de la actualización</span>
            </span>
            <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {MANTENIMIENTO_CONFIG.tiempoEstimado}
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {MANTENIMIENTO_CONFIG.fases.map((fase, i) => {
              const isDone = fase.estado === "completado";
              const inProgress = fase.estado === "en_progreso";
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                    inProgress
                      ? "bg-primary/5 border border-primary/20"
                      : "bg-surface-container-low/40"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : inProgress ? (
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center animate-spin">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-surface-container-high flex items-center justify-center" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-on-surface">{fase.titulo}</h3>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isDone
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : inProgress
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {isDone ? "Listo" : inProgress ? "En curso" : "Pendiente"}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                      {fase.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Actions & Refresh Button ─────────────────────────────────────── */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Comprobando..." : "Comprobar si ya está disponible"}</span>
          </button>

          {isPreview && (
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container text-xs font-semibold border border-surface-container-high/60 transition-colors"
            >
              <span>Volver a la portada normal</span>
              <ArrowRight className="w-3.5 h-3.5 text-on-surface-variant" />
            </Link>
          )}
        </div>

        {checkMessage && (
          <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 font-semibold animate-fadeIn">
            {checkMessage}
          </p>
        )}
      </main>

      {/* ─── Pie de página ─────────────────────────────────────────────────── */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 border-t border-surface-container-high/60 text-center text-xs text-on-surface-variant flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>
          FinPal © {new Date().getFullYear()} · Sistema inteligente de préstamos y finanzas.
        </p>

        <div className="flex items-center gap-1 text-[11px]">
          <span>{MANTENIMIENTO_CONFIG.contacto.texto}</span>
          <a
            href={`mailto:${MANTENIMIENTO_CONFIG.contacto.email}`}
            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold ml-1"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{MANTENIMIENTO_CONFIG.contacto.email}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
