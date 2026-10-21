"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { applyCustomAccent, getSessionAccent } from "@/lib/theme-utils";

interface ThemeToggleProps {
  className?: string;
}

const emptySubscribe = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

/**
 * Desactiva temporalmente las transiciones CSS en todos los elementos del DOM.
 * Esto evita que tarjetas, botones o barras con clases Tailwind (como transition-all duration-300/500)
 * tarden hasta 1 segundo en cambiar de color o queden desfasadas respecto al resto de la interfaz.
 */
function disableTransitionsTemporarily(): () => void {
  if (typeof document === "undefined") return () => {};

  const style = document.createElement("style");
  style.setAttribute("data-theme-transition-suppress", "true");
  style.appendChild(
    document.createTextNode(
      "*, *::before, *::after { -webkit-transition: none !important; -moz-transition: none !important; -o-transition: none !important; -ms-transition: none !important; transition: none !important; }"
    )
  );
  document.head.appendChild(style);

  // Forzar recálculo síncrono del motor de renderizado
  void window.getComputedStyle(document.documentElement).opacity;

  return () => {
    // Forzar recálculo de estilos finales antes de rehabilitar las transiciones normales
    void window.getComputedStyle(document.documentElement).opacity;
    requestAnimationFrame(() => {
      try {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      } catch {}
    });
  };
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getClientMounted, getServerMounted);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("finpal-dark-mode");
      if (saved !== null) return saved === "true";
      return (
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    }
    return false;
  });

  useEffect(() => {
    const saved = localStorage.getItem("finpal-dark-mode");
    const docDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
    const activeDark = saved !== null ? saved === "true" : docDark;
    if (activeDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.colorScheme = "dark";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", "#111827");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.style.colorScheme = "light";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", "#faf8ff");
    }

    // Sincronizar colores dinámicos de acento de inmediato
    const sessionAccent = getSessionAccent();
    if (sessionAccent) {
      applyCustomAccent(sessionAccent);
    }
  };

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);

    const isViewTransitionSupported =
      typeof document !== "undefined" &&
      "startViewTransition" in document &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isViewTransitionSupported) {
      const restoreTransitions = disableTransitionsTemporarily();
      try {
        const transition = (
          document as unknown as {
            startViewTransition: (cb: () => void) => { finished: Promise<void> };
          }
        ).startViewTransition(() => {
          applyTheme(next);
        });

        transition.finished
          .catch(() => {})
          .finally(() => {
            restoreTransitions();
          });
      } catch {
        applyTheme(next);
        restoreTransitions();
      }
    } else {
      const restoreTransitions = disableTransitionsTemporarily();
      applyTheme(next);
      restoreTransitions();
    }

    try {
      localStorage.setItem("finpal-dark-mode", next ? "true" : "false");
    } catch {}
  };


  if (!mounted) {
    return (
      <button
        type="button"
        className={`p-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0 opacity-70 ${className}`}
        aria-label="Cambiar tema"
      >
        <Moon className="w-4 h-4 text-outline" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className={`p-2 rounded-xl text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0 relative overflow-hidden group ${className}`}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 text-amber-400 absolute transition-all duration-300 ease-out transform ${
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0 pointer-events-none"
          }`}
        />
        <Moon
          className={`w-4 h-4 text-primary absolute transition-all duration-300 ease-out transform ${
            isDark
              ? "rotate-90 scale-0 opacity-0 pointer-events-none"
              : "rotate-0 scale-100 opacity-100"
          }`}
        />
      </div>
    </button>
  );
}
