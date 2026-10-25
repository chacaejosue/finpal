"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronRight, Loader2 } from "lucide-react";

export interface SlideToConfirmProps {
  onConfirm: () => boolean | void | Promise<boolean | void>;
  submitting: boolean;
  resetTrigger?: unknown;
  label?: string;
  variant?: "primary" | "warning" | "danger";
}

export function SlideToConfirm({
  onConfirm,
  submitting,
  resetTrigger,
  label = "Desliza para registrar",
  variant = "primary",
}: SlideToConfirmProps) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Cada vez que termina el envío o cambia la condición de reseteo, devolver la barra al inicio
  useEffect(() => {
    if (!submitting) {
      setSliderPosition(0);
      setIsDragging(false);
    }
  }, [submitting, resetTrigger]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (submitting) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || submitting || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxOffset = Math.max(0, rect.width - 48);
    const currentX = e.clientX - rect.left - 24;
    const clamped = Math.max(0, Math.min(currentX, maxOffset));
    setSliderPosition(clamped);

    if (clamped >= maxOffset * 0.85) {
      setIsDragging(false);
      setSliderPosition(maxOffset);
      const res = onConfirm();
      if (res instanceof Promise) {
        res.then((isOk) => {
          if (isOk === false) {
            setTimeout(() => setSliderPosition(0), 220);
          } else {
            setTimeout(() => {
              setSliderPosition((current) => (submitting ? current : 0));
            }, 600);
          }
        });
      } else if (res === false) {
        setTimeout(() => {
          setSliderPosition(0);
        }, 220);
      } else {
        setTimeout(() => {
          setSliderPosition((current) => (submitting ? current : 0));
        }, 600);
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!submitting) {
      setSliderPosition(0);
    }
  };

  // Solo se dibuja relleno cuando el botón ha empezado a deslizarse
  // Se alinea con el centro del thumb para no desbordar por la izquierda
  const fillWidth = sliderPosition > 4 ? sliderPosition + 24 : 0;

  // Clases dinámicas según la variante
  const trackDragBorder =
    variant === "warning"
      ? "border-amber-500/50 shadow-xs"
      : variant === "danger"
      ? "border-rose-500/50 shadow-xs"
      : "border-primary/40 shadow-xs";

  const fillGradient =
    variant === "warning"
      ? "bg-gradient-to-r from-amber-500/20 to-amber-500/40"
      : variant === "danger"
      ? "bg-gradient-to-r from-rose-500/20 to-rose-500/40"
      : "bg-gradient-to-r from-primary/20 to-primary/35";

  const submittingTextColor =
    variant === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : variant === "danger"
      ? "text-rose-600 dark:text-rose-400"
      : "text-primary";

  const thumbCls =
    variant === "warning"
      ? "bg-amber-600 hover:bg-amber-500 text-white ring-amber-500/30"
      : variant === "danger"
      ? "bg-rose-600 hover:bg-rose-500 text-white ring-rose-500/30"
      : "bg-primary text-on-primary ring-primary/30";

  return (
    <div
      ref={trackRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative w-full h-12 bg-surface-container-high/60 border border-surface-container-high rounded-2xl overflow-hidden select-none flex items-center px-1 shadow-inner touch-none transition-colors duration-200 ${
        isDragging ? trackDragBorder : ""
      }`}
    >
      {fillWidth > 0 && (
        <div
          className={`absolute left-0 top-0 bottom-0 ${fillGradient} rounded-l-2xl ${
            isDragging ? "transition-none" : "transition-all duration-300 ease-out"
          }`}
          style={{ width: `${fillWidth}px` }}
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-on-surface-variant pointer-events-none gap-1.5 px-12 text-center">
        {submitting ? (
          <span className={`flex items-center gap-2 font-bold ${submittingTextColor}`}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Procesando información...</span>
          </span>
        ) : (
          <span className="truncate">{label}</span>
        )}
      </div>
      <div
        onPointerDown={handlePointerDown}
        style={{ transform: `translateX(${sliderPosition}px)` }}
        className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing ${thumbCls} ${
          isDragging
            ? "scale-105 shadow-lg transition-none ring-2"
            : "transition-transform duration-300 ease-out"
        }`}
        title="Arrastra hasta el final para confirmar"
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : sliderPosition > 40 ? (
          <Check className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-5 h-5 animate-pulse" />
        )}
      </div>
    </div>
  );
}
