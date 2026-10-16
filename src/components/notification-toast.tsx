"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";

/**
 * Sintetiza un timbre armónico suave y moderno usando la Web Audio API nativa.
 * No requiere descargar archivos de audio externos, no añade latencia y funciona 100% offline.
 */
function playChimeSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Nota 1: D5 (587.33 Hz) cálida y suave
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.24);

    // Nota 2: A5 (880.00 Hz) brillante y resolutiva
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.07);
    gain2.gain.setValueAtTime(0, now + 0.07);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.40);
  } catch {
    // Si el navegador bloquea audio sin interacción previa, falla silenciosamente sin interrumpir
  }
}

interface NotificationToastProps {
  message: string | null;
  onClose: () => void;
}

export function NotificationToast({ message, onClose }: NotificationToastProps) {
  const playedRef = useRef<string | null>(null);

  useEffect(() => {
    if (message && message !== playedRef.current) {
      playedRef.current = message;
      playChimeSound();
    } else if (!message) {
      playedRef.current = null;
    }
  }, [message]);

  return (
    <AnimatePresence>
      {message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none px-4 w-auto max-w-[92vw]">
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 26,
              mass: 0.8,
            }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-900/95 dark:bg-surface-container-highest/95 text-white dark:text-on-surface border border-white/15 dark:border-outline-variant/40 shadow-2xl shadow-black/30 backdrop-blur-xl"
            role="status"
            aria-live="polite"
          >
            {/* Animación circular tipo cápsula móvil con pulso y check */}
            <div className="relative flex items-center justify-center shrink-0">
              <motion.span
                initial={{ scale: 0.6, opacity: 0.8 }}
                animate={{ scale: [1, 1.45, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-emerald-400"
              />
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.05 }}
                className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/40 relative z-10"
              >
                <Check className="w-4 h-4 stroke-[2.8]" />
              </motion.div>
            </div>

            {/* Mensaje de texto */}
            <div className="flex flex-col pr-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 dark:text-emerald-300 leading-none">
                Completado
              </span>
              <span className="text-xs font-semibold leading-tight mt-0.5 whitespace-nowrap">
                {message}
              </span>
            </div>

            {/* Botón de cierre manual */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar notificación"
              className="ml-1 p-1 rounded-full text-slate-400 hover:text-white dark:hover:text-on-surface hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
