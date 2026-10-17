"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("finpal-dark-mode");
    const docDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
    const activeDark = saved !== null ? saved === "true" : docDark;
    setIsDark(activeDark);
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
  };

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);

    // Activar clase de transición suave en todo el DOM
    document.documentElement.classList.add("theme-transitioning");

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      (document as unknown as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        applyTheme(next);
      });
    } else {
      applyTheme(next);
    }

    window.setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 450);

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
