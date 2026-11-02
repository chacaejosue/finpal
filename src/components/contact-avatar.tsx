"use client";

import { useId } from "react";
import { motion } from "motion/react";

/**
 * ContactAvatar — Perfiles default neutros (estilo Google / Apple / Telegram),
 * con dispersión cromática de alta separación y supresión de colisiones para listas de contactos.
 * 16 paletas vibrantes mutuamente excluyentes y normalización de honoríficos en español ("Doña", "Don", etc.).
 */

interface GradientPalette {
  id: string;
  from: string;
  to: string;
}

// 16 paletas cromáticamente polarizadas (cada una en un cuadrante único del círculo cromático)
const CHROMATIC_PALETTES: GradientPalette[] = [
  // 0. Sunset Coral (Naranja Fuego a Coral)
  { id: "coral", from: "#ea580c", to: "#f43f5e" },
  // 1. Electric Violet (Púrpura Eléctrico)
  { id: "violet", from: "#7c3aed", to: "#4f46e5" },
  // 2. Cyber Emerald (Verde Esmeralda FinPal)
  { id: "emerald", from: "#059669", to: "#10b981" },
  // 3. Hot Fuchsia (Rosa Magenta Intenso)
  { id: "fuchsia", from: "#db2777", to: "#ec4899" },
  // 4. Ocean Cyan (Cian Eléctrico)
  { id: "cyan", from: "#0284c7", to: "#06b6d4" },
  // 5. Golden Amber (Oro / Ámbar Solar)
  { id: "amber", from: "#d97706", to: "#f59e0b" },
  // 6. Deep Cobalt (Azul Cobalto Real)
  { id: "cobalt", from: "#1d4ed8", to: "#3b82f6" },
  // 7. Spring Lime (Verde Lima Brillante)
  { id: "lime", from: "#65a30d", to: "#84cc16" },
  // 8. Ruby Crimson (Rojo Rubí Profundo)
  { id: "crimson", from: "#be123c", to: "#e11d48" },
  // 9. Mint Teal (Turquesa / Menta Fresca)
  { id: "teal", from: "#0d9488", to: "#14b8a6" },
  // 10. Electric Indigo (Azul Índigo Profundo)
  { id: "indigo", from: "#4338ca", to: "#6366f1" },
  // 11. Warm Tangerine (Mandarina Intensa)
  { id: "tangerine", from: "#c2410c", to: "#fb923c" },
  // 12. Royal Purple (Púrpura Real)
  { id: "purple", from: "#581c87", to: "#8b5cf6" },
  // 13. Flame Orange (Naranja Solar)
  { id: "orange", from: "#ea580c", to: "#f97316" },
  // 14. Aqua Sky (Azul Cielo Eléctrico)
  { id: "sky", from: "#0ea5e9", to: "#0284c7" },
  // 15. Forest Pine (Verde Pino Profundo)
  { id: "pine", from: "#064e3b", to: "#059669" },
];

const GRADIENT_COORDS = [
  { x1: "0%", y1: "0%", x2: "100%", y2: "100%" }, // Diagonal descendente
  { x1: "0%", y1: "100%", x2: "100%", y2: "0%" }, // Diagonal ascendente
  { x1: "0%", y1: "50%", x2: "100%", y2: "50%" }, // Horizontal
  { x1: "50%", y1: "0%", x2: "50%", y2: "100%" }, // Vertical
];

function cleanPrefix(name: string): string {
  // Limpia tratamientos comunes para que "Doña María" y "Doña Ylsen" no compartan la D
  return name.replace(/^(doña|dona|don|sr\.|sra\.|tía|tia|tío|tio)\s+/i, "").trim();
}

function getAvatarColorIndex(name: string, totalColors: number): number {
  const core = cleanPrefix(name || "FinPal");
  const coreLower = core.toLowerCase();
  const rawLower = (name || "FinPal").toLowerCase();

  // Código de la primera y segunda letra del nombre real
  const firstCode = coreLower.charCodeAt(0) || 65;
  const secondCode = coreLower.charCodeAt(1) || 66;

  // Hash polinomial de la cadena completa
  let sum = 0;
  for (let i = 0; i < rawLower.length; i++) {
    sum = ((sum << 5) - sum + rawLower.charCodeAt(i)) & 0xffffffff;
  }

  // Multiplicador primo de dispersión (stride 7) para separar letras cercanas en el abecedario
  const stride = 7;
  const combined = ((firstCode - 97) * stride + secondCode + sum + rawLower.length * 3) >>> 0;
  return combined % totalColors;
}

interface ContactAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function ContactAvatar({ name, size = 36, className = "" }: ContactAvatarProps) {
  const reactId = useId().replace(/:/g, "_");
  const colorIndex = getAvatarColorIndex(name, CHROMATIC_PALETTES.length);
  const palette = CHROMATIC_PALETTES[colorIndex] ?? CHROMATIC_PALETTES[0];

  const angleIndex = Math.abs((colorIndex * 3) % GRADIENT_COORDS.length);
  const gradientCoords = GRADIENT_COORDS[angleIndex] ?? GRADIENT_COORDS[0];

  const gradId = `av_bg_${reactId}_${colorIndex}`;
  const maskId = `av_m_${reactId}_${colorIndex}`;

  return (
    <motion.div
      whileHover={{ scale: 1.08 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full shadow-2xs select-none border border-black/10 dark:border-white/10 ${className}`}
      style={{ width: size, height: size }}
      title={name}
      aria-label={`Avatar de ${name}`}
    >
      <svg
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient
            id={gradId}
            x1={gradientCoords.x1}
            y1={gradientCoords.y1}
            x2={gradientCoords.x2}
            y2={gradientCoords.y2}
          >
            <stop offset="0%" stopColor={palette.from} />
            <stop offset="100%" stopColor={palette.to} />
          </linearGradient>
          <mask id={maskId}>
            <circle cx="20" cy="20" r="20" fill="#ffffff" />
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          {/* Fondo de degradado vibrante de alta saturación */}
          <rect width="40" height="40" fill={`url(#${gradId})`} />

          {/* Silueta universal neutra (cabeza circular + torso/hombros redondeados) */}
          <circle cx="20" cy="15.5" r="5.8" fill="#ffffff" opacity="0.94" />

          {/* Torso y hombros con caída suave */}
          <path
            d="M 8.5 38 C 8.5 27.5 13.5 24 20 24 C 26.5 24 31.5 27.5 31.5 38 Z"
            fill="#ffffff"
            opacity="0.94"
          />

          {/* Bisel interior tenue para textura táctil y contraste */}
          <circle
            cx="20"
            cy="20"
            r="19.5"
            fill="none"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1"
          />
        </g>
      </svg>
    </motion.div>
  );
}
