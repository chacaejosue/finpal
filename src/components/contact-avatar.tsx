"use client";

import { useId } from "react";
import { motion } from "motion/react";

/**
 * ContactAvatar — Avatares animados, 'faceless' (sin cara, sin cabello y sin tonos piel).
 * Personajes tech / streetwear estilizados con capuchas, cascos cyber, gorros y visores neón.
 * 100% deterministas a partir del nombre del contacto y con animación suave al interactuar.
 */

interface Palette {
  id: string;
  bg1: string;
  bg2: string;
  neon: string;
  gear: string;
  gear2: string;
  jacket: string;
}

const AVATAR_PALETTES: Palette[] = [
  // 1. Electric Indigo & Cyber Cyan
  { id: "indigo", bg1: "#3730a3", bg2: "#4f46e5", neon: "#06b6d4", gear: "#1e1b4b", gear2: "#312e81", jacket: "#0f172a" },
  // 2. Sunset Flame & Solar Gold
  { id: "sunset", bg1: "#9a3412", bg2: "#ea580c", neon: "#fbbf24", gear: "#431407", gear2: "#7c2d12", jacket: "#1c1917" },
  // 3. Cyber Emerald & Lime
  { id: "emerald", bg1: "#065f46", bg2: "#059669", neon: "#84cc16", gear: "#022c22", gear2: "#064e3b", jacket: "#022c22" },
  // 4. Ultramarine & Ice Blue
  { id: "ultramarine", bg1: "#1e40af", bg2: "#2563eb", neon: "#38bdf8", gear: "#0f172a", gear2: "#1e293b", jacket: "#020617" },
  // 5. Candy Fuchsia & Neon Pink
  { id: "fuchsia", bg1: "#86198f", bg2: "#c026d3", neon: "#f472b6", gear: "#4a044e", gear2: "#701a75", jacket: "#18181b" },
  // 6. Violet Prism & Amber
  { id: "violet", bg1: "#5b21b6", bg2: "#7c3aed", neon: "#f59e0b", gear: "#2e1065", gear2: "#4c1d95", jacket: "#0f172a" },
  // 7. Midnight Matrix & Neon Emerald
  { id: "matrix", bg1: "#0f172a", bg2: "#1e293b", neon: "#10b981", gear: "#020617", gear2: "#090d16", jacket: "#020617" },
  // 8. Oceanic Teal & Mint
  { id: "teal", bg1: "#115e59", bg2: "#0d9488", neon: "#2dd4bf", gear: "#042f2e", gear2: "#134e4a", jacket: "#042f2e" },
  // 9. Crimson Flare & Coral
  { id: "crimson", bg1: "#881337", bg2: "#be123c", neon: "#fb7185", gear: "#4c0519", gear2: "#881337", jacket: "#18181b" },
  // 10. Cyberpunk Cobalt & Lime
  { id: "cobalt", bg1: "#1d4ed8", bg2: "#3b82f6", neon: "#a3e635", gear: "#0f172a", gear2: "#1e293b", jacket: "#020617" },
  // 11. Hyper Purple & Aqua
  { id: "purple", bg1: "#4c1d95", bg2: "#6d28d9", neon: "#22d3ee", gear: "#1e1b4b", gear2: "#312e81", jacket: "#0f172a" },
  // 12. Forest Pine & Spring Neon
  { id: "pine", bg1: "#064e3b", bg2: "#047857", neon: "#34d399", gear: "#022c22", gear2: "#064e3b", jacket: "#022c22" },
];

function hashName(name: string): number {
  let h = 0;
  const clean = name.trim().toLowerCase();
  for (let i = 0; i < clean.length; i++) {
    h = ((h << 5) - h + clean.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface ContactAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function ContactAvatar({ name, size = 36, className = "" }: ContactAvatarProps) {
  const reactId = useId().replace(/:/g, "_");
  const hash = hashName(name || "FinPal Contacto");
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];

  // 6 arquetipos animados sin cara, sin cabello y sin tonos piel
  const archetype = (hash >> 3) % 6;
  const gradId = `av_bg_${reactId}_${hash % 99999}`;
  const maskId = `av_m_${reactId}_${hash % 99999}`;

  return (
    <motion.div
      whileHover={{ scale: 1.08, rotate: [0, -1.5, 1.5, 0] }}
      transition={{ duration: 0.25, ease: "easeOut" }}
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
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.bg1} />
            <stop offset="100%" stopColor={palette.bg2} />
          </linearGradient>
          <mask id={maskId}>
            <circle cx="20" cy="20" r="20" fill="#ffffff" />
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          {/* Fondo gradiente vibrante */}
          <rect width="40" height="40" fill={`url(#${gradId})`} />

          {/* ARQUETIPO 0: Casco Cyber / Astronauta Daft Punk */}
          {archetype === 0 && (
            <g>
              {/* Torso / Chaqueta */}
              <path d="M 10 40 C 10 30 14 27 20 27 C 26 27 30 30 30 40 Z" fill={palette.jacket} />
              {/* Base del casco */}
              <path
                d="M 12 19 C 12 11 15 8 20 8 C 25 8 28 11 28 19 C 28 26 25 28 20 28 C 15 28 12 26 12 19 Z"
                fill={palette.gear}
              />
              {/* Visor oscuro integral */}
              <path
                d="M 14 16 C 14 12 16 11 20 11 C 24 11 26 12 26 16 C 26 22 24 24 20 24 C 16 24 14 22 14 16 Z"
                fill="#050814"
              />
              {/* Reflejo de luz neón curvado */}
              <path
                d="M 16 15 C 18 13 22 13 24 15"
                stroke={palette.neon}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="23" cy="19" r="0.9" fill="#ffffff" opacity="0.8" />
            </g>
          )}

          {/* ARQUETIPO 1: Capucha Oversized con Visor Neón */}
          {archetype === 1 && (
            <g>
              {/* Hombros */}
              <path d="M 8 40 C 8 29 13 26 20 26 C 27 26 32 29 32 40 Z" fill={palette.jacket} />
              {/* Silueta exterior de la capucha */}
              <path
                d="M 10 20 C 10 10 14 6 20 6 C 26 6 30 10 30 20 C 30 27 26 28 20 28 C 14 28 10 27 10 20 Z"
                fill={palette.gear}
              />
              {/* Interior oscuro de la capucha (sombra total, sin piel) */}
              <path
                d="M 13 20 C 13 13 16 10 20 10 C 24 10 27 13 27 20 C 27 25 24 26 20 26 C 16 26 13 25 13 20 Z"
                fill="#070b16"
              />
              {/* Visor cibernético brillante horizontal */}
              <rect x="15" y="17.5" width="10" height="2.8" rx="1.4" fill={palette.neon} />
              <rect x="16.5" y="18.2" width="3.5" height="1" rx="0.5" fill="#ffffff" />
              {/* Cordones de la capucha */}
              <line x1="18.5" y1="28" x2="18.5" y2="33" stroke={palette.gear2} strokeWidth="1.2" strokeLinecap="round" />
              <line x1="21.5" y1="28" x2="21.5" y2="34" stroke={palette.gear2} strokeWidth="1.2" strokeLinecap="round" />
            </g>
          )}

          {/* ARQUETIPO 2: Beanie de Lana & Gafas Streetwear */}
          {archetype === 2 && (
            <g>
              {/* Cuello alto de chaqueta */}
              <path d="M 9 40 C 9 30 14 27 20 27 C 26 27 31 30 31 40 Z" fill={palette.jacket} />
              <path d="M 15 24 L 20 27 L 25 24 Z" fill={palette.gear2} />
              {/* Beanie que cubre toda la cabeza */}
              <path d="M 11 17 C 11 9 14 6 20 6 C 26 6 29 9 29 17 Z" fill={palette.gear} />
              <rect x="10" y="14" width="20" height="4.5" rx="2" fill={palette.gear2} />
              {/* Textura acanalada del gorro */}
              <line x1="14" y1="14.5" x2="14" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              <line x1="17" y1="14.5" x2="17" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              <line x1="20" y1="14.5" x2="20" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              <line x1="23" y1="14.5" x2="23" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              <line x1="26" y1="14.5" x2="26" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
              {/* Zona oscura de rostro / bufanda (sin piel) */}
              <path d="M 13 18.5 L 27 18.5 L 25 26 L 15 26 Z" fill="#090d16" />
              {/* Gafas oscuras con reflejo neón */}
              <rect x="13" y="18.5" width="6" height="3.8" rx="1.5" fill="#020617" />
              <rect x="21" y="18.5" width="6" height="3.8" rx="1.5" fill="#020617" />
              <line x1="18.8" y1="20" x2="21.2" y2="20" stroke="#020617" strokeWidth="1.2" />
              <line x1="14" y1="19.5" x2="17.5" y2="19.5" stroke={palette.neon} strokeWidth="1" strokeLinecap="round" />
              <line x1="22" y1="19.5" x2="25.5" y2="19.5" stroke={palette.neon} strokeWidth="1" strokeLinecap="round" />
            </g>
          )}

          {/* ARQUETIPO 3: Droid / Bot Amigable con Antena y Pantalla LED */}
          {archetype === 3 && (
            <g>
              {/* Chasis inferior */}
              <path d="M 11 40 C 11 31 15 28 20 28 C 25 28 29 31 29 40 Z" fill={palette.jacket} />
              {/* Antena */}
              <line x1="20" y1="10" x2="20" y2="5" stroke={palette.gear2} strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="20" cy="5" r="2" fill={palette.neon} />
              {/* Cabeza metálica */}
              <rect x="11.5" y="10" width="17" height="15" rx="5.5" fill={palette.gear} />
              {/* Pernos laterales */}
              <rect x="9.5" y="14" width="2" height="7" rx="1" fill={palette.neon} />
              <rect x="28.5" y="14" width="2" height="7" rx="1" fill={palette.neon} />
              {/* Pantalla frontal negra */}
              <rect x="13.5" y="13" width="13" height="9" rx="3.5" fill="#040711" />
              {/* Ojos LED digitales felices */}
              <rect x="15.5" y="16" width="3" height="2.8" rx="1" fill={palette.neon} />
              <rect x="21.5" y="16" width="3" height="2.8" rx="1" fill={palette.neon} />
            </g>
          )}

          {/* ARQUETIPO 4: Gorra & Auriculares DJ Over-Ear */}
          {archetype === 4 && (
            <g>
              {/* Torso */}
              <path d="M 8 40 C 8 30 13 27 20 27 C 27 27 32 30 32 40 Z" fill={palette.jacket} />
              {/* Gorra */}
              <path d="M 12 17 C 12 10 15 7 20 7 C 25 7 28 10 28 17 Z" fill={palette.gear} />
              <path d="M 10 16 C 14 16 26 16 30 16.5 L 28 18.5 L 12 18.5 Z" fill={palette.gear2} />
              <circle cx="20" cy="7" r="1.2" fill={palette.neon} />
              {/* Rostro en sombra con cuello alto (sin piel) */}
              <path d="M 13 18.5 L 27 18.5 L 25 27 L 15 27 Z" fill="#070c18" />
              <line x1="16.5" y1="21.5" x2="23.5" y2="21.5" stroke={palette.neon} strokeWidth="1.5" strokeLinecap="round" />
              {/* Auriculares DJ */}
              <path d="M 9 17 C 9 8 13 6 20 6 C 27 6 31 8 31 17" stroke={palette.gear2} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <rect x="8" y="14" width="4" height="8" rx="2" fill={palette.neon} />
              <rect x="28" y="14" width="4" height="8" rx="2" fill={palette.neon} />
            </g>
          )}

          {/* ARQUETIPO 5: Visor VR / Explorador Cibernético */}
          {archetype === 5 && (
            <g>
              {/* Cuello tech */}
              <path d="M 9 40 C 9 30 14 27 20 27 C 26 27 31 30 31 40 Z" fill={palette.jacket} />
              <path d="M 15 25 L 20 27 L 25 25 Z" fill="#050814" />
              {/* Capucha base */}
              <path d="M 12 18 C 12 10 15 7 20 7 C 25 7 28 10 28 18 Z" fill={palette.gear} />
              {/* Casco VR frontal */}
              <rect x="10.5" y="13" width="19" height="8.5" rx="3.5" fill="#030712" />
              {/* Franja LED neón activa */}
              <rect x="12.5" y="15.8" width="15" height="2.8" rx="1.4" fill={palette.neon} />
              <line x1="14" y1="17.2" x2="19" y2="17.2" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
              {/* Correas laterales */}
              <line x1="7.5" y1="17.2" x2="10.5" y2="17.2" stroke={palette.gear2} strokeWidth="2" strokeLinecap="round" />
              <line x1="29.5" y1="17.2" x2="32.5" y2="17.2" stroke={palette.gear2} strokeWidth="2" strokeLinecap="round" />
              {/* Mascarilla tech inferior (sin piel) */}
              <path d="M 14.5 21.5 L 25.5 21.5 L 23.5 27 L 16.5 27 Z" fill="#0a0f1d" />
            </g>
          )}

          {/* Bisel táctil tenue para contraste */}
          <circle cx="20" cy="20" r="19.5" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
        </g>
      </svg>
    </motion.div>
  );
}
