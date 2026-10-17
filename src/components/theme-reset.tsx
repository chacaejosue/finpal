"use client";

import { useEffect } from "react";
import { clearSessionAccent } from "@/lib/theme-utils";

/**
 * Componente cliente que asegura que cualquier color personalizado de sesión previa
 * se limpie en documentElement y localStorage, restaurando el verde corporativo de FinPal.
 */
export function ThemeReset() {
  useEffect(() => {
    clearSessionAccent();
  }, []);

  return null;
}
