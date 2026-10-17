/**
 * Utilidades para la gestión de temas y colores dinámicos en FinPal.
 *
 * Los colores personalizados de acento del usuario (azul, violeta, naranja, rosa)
 * aplican EXCLUSIVAMENTE dentro del panel autenticado del usuario.
 *
 * Al cerrar sesión (manual o por inactividad) o al salir a pantallas públicas/auth,
 * los estilos en documentElement deben limpiarse para que la aplicación vuelva
 * al verde oficial predeterminado de FinPal (#006948).
 */

export const ACCENT_PALETTES = {
  azul: {
    primary: "#2563eb",
    container: "#1d4ed8",
    dark: "#1e40af",
    darkPrimary: "#60a5fa",
    darkContainer: "#3b82f6",
  },
  violeta: {
    primary: "#7c3aed",
    container: "#6d28d9",
    dark: "#5b21b6",
    darkPrimary: "#a78bfa",
    darkContainer: "#8b5cf6",
  },
  naranja: {
    primary: "#c2410c",
    container: "#ea580c",
    dark: "#9a3412",
    darkPrimary: "#fb923c",
    darkContainer: "#f97316",
  },
  rosa: {
    primary: "#e11d48",
    container: "#be123c",
    dark: "#9f1239",
    darkPrimary: "#fb7185",
    darkContainer: "#f43f5e",
  },
} as const;

export type AccentColorKey = keyof typeof ACCENT_PALETTES;
export const SESSION_ACCENT_KEY = "finpal_session_accent";

export function getSessionAccent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SESSION_ACCENT_KEY);
  } catch {
    return null;
  }
}

export function setSessionAccent(accent: string | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    if (!accent || accent === "verde") {
      localStorage.removeItem(SESSION_ACCENT_KEY);
    } else {
      localStorage.setItem(SESSION_ACCENT_KEY, accent);
    }
  } catch {}
}

export function resetGlobalThemeColors() {
  if (typeof document === "undefined") return;

  document.documentElement.style.removeProperty("--color-primary");
  document.documentElement.style.removeProperty("--color-primary-container");
  document.documentElement.style.removeProperty("--primary");
  document.documentElement.style.removeProperty("--primary-dark");
}

export function clearSessionAccent() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_ACCENT_KEY);
  } catch {}
  resetGlobalThemeColors();
}

export function applyCustomAccent(accentKey: string | null | undefined) {
  if (typeof document === "undefined") return;
  if (!accentKey || accentKey === "verde" || !(accentKey in ACCENT_PALETTES)) {
    resetGlobalThemeColors();
    return;
  }
  const palette = ACCENT_PALETTES[accentKey as AccentColorKey];
  const isDark =
    document.documentElement.classList.contains("dark") ||
    document.documentElement.getAttribute("data-theme") === "dark";

  const primary = isDark ? palette.darkPrimary : palette.primary;
  const container = isDark ? palette.darkContainer : palette.container;

  document.documentElement.style.setProperty("--color-primary", primary);
  document.documentElement.style.setProperty("--color-primary-container", container);
  document.documentElement.style.setProperty("--primary", primary);
  document.documentElement.style.setProperty("--primary-dark", palette.dark);
}
