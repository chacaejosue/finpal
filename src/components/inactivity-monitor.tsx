"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { LogOut, ShieldAlert, Clock } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { INACTIVITY_TIMEOUT_MS, INACTIVITY_WARNING_MS } from "@/lib/security";

/**
 * Monitor de seguridad contra abandono de sesión por inactividad.
 * 
 * Política de seguridad:
 * - Detecta eventos de interacción (mousemove, keydown, click, scroll, touch) throttled a 1s para 0 impacto de CPU.
 * - Tras 15 minutos sin interacción: muestra modal de advertencia preventiva con cuenta regresiva.
 * - Tras 20 minutos sin interacción: ejecuta cierre de sesión seguro (`signOut`) protegiendo datos sensibles en laptops compartidas.
 * - Si el usuario interactúa durante la advertencia, resetea el reloj y renueva la sesión mediante heartbeat.
 */
export function InactivityMonitor() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(300); // 5 min de advertencia
  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      // Realizar una petición liviana para refrescar la cookie del servidor
      fetch("/api/auth/heartbeat", { method: "POST" }).catch(() => {});
    }
  }, [showWarning]);

  // Escuchar interacción del usuario para restablecer la marca de tiempo de actividad
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleUserInteraction = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000);
        lastActivityRef.current = Date.now();
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, handleUserInteraction, { passive: true }));

    // Intervalo de comprobación periódica
    const interval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        isLoggingOutRef.current = true;
        signOut();
        return;
      }

      if (elapsed >= INACTIVITY_WARNING_MS) {
        setShowWarning(true);
        const rem = Math.max(0, Math.round((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setSecondsRemaining(rem);
      } else {
        setShowWarning(false);
      }
    }, 5000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserInteraction));
      clearInterval(interval);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, []);

  if (!showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface-container-lowest border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl text-on-surface">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-on-surface">
              Aviso de inactividad
            </h3>
            <p className="text-xs text-on-surface-variant">
              Por tu seguridad bancaria y protección de datos
            </p>
          </div>
        </div>

        <p className="text-sm text-on-surface-variant mb-5 leading-relaxed">
          Has estado inactivo durante 15 minutos. Tu sesión se cerrará automáticamente en:
        </p>

        <div className="flex items-center justify-center gap-2 p-3 bg-surface-container-low rounded-xl mb-6 font-mono text-xl font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock className="w-5 h-5 animate-pulse" />
          <span>{formattedTime}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={resetActivity}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-all text-sm cursor-pointer shadow-sm hover:shadow"
          >
            Continuar trabajando
          </button>
          <button
            type="button"
            onClick={() => {
              isLoggingOutRef.current = true;
              signOut();
            }}
            className="py-2.5 px-4 rounded-xl border border-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión ahora
          </button>
        </div>
      </div>
    </div>
  );
}
