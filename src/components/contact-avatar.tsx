/**
 * ContactAvatar – Avatar minimalista pastel generado desde el nombre.
 * Sin fotos, sin iniciales: usa una silueta de persona SVG con color único
 * derivado del nombre mediante hash determinista.
 */

// Paleta de colores pastel suaves (bg, person color)
const PALETTES: [string, string, string][] = [
  ["#f0f9f4", "#a8d5b5", "#6db88a"],  // menta suave
  ["#f0f4ff", "#a8b8f0", "#6b82e0"],  // lavanda
  ["#fff7ed", "#f5c99a", "#e8995a"],  // durazno
  ["#fdf4ff", "#d8a8f0", "#b06fd4"],  // malva
  ["#f0fafa", "#8fd4d4", "#4baab4"],  // turquesa
  ["#fff0f3", "#f5a8b8", "#d96b84"],  // rosa palo
  ["#f5f9e8", "#b8d88a", "#82b44a"],  // lima suave
  ["#fafaf0", "#d4c88a", "#a89840"],  // dorado suave
  ["#f0f4f9", "#a8b8cc", "#6883a0"],  // gris azulado
  ["#f9f0f9", "#d4a8d4", "#a860a8"],  // ciruela
  ["#f0faf5", "#80ccaa", "#3a9e72"],  // verde esmeralda suave
  ["#fff5f0", "#f0b08a", "#d4724a"],  // terracota
];

// Estilos de silueta disponibles
type AvatarStyle = "circle" | "rounded" | "wave" | "leaf";

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(31, h) + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getPalette(name: string): [string, string, string] {
  return PALETTES[hashName(name) % PALETTES.length];
}

function getStyle(name: string): AvatarStyle {
  const styles: AvatarStyle[] = ["circle", "rounded", "wave", "leaf"];
  return styles[(hashName(name) >> 3) % styles.length];
}

// SVG de persona minimalista — solo silueta cabeza+cuerpo
function PersonSVG({ bg, bodyColor, headColor, style }: {
  bg: string;
  bodyColor: string;
  headColor: string;
  style: AvatarStyle;
}) {
  const bgRadii: Record<AvatarStyle, string> = {
    circle: "50%",
    rounded: "30%",
    wave: "40% 60% 60% 40% / 40% 40% 60% 60%",
    leaf: "50% 50% 50% 50% / 60% 60% 40% 40%",
  };

  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: bgRadii[style] }}
      className="w-full h-full"
    >
      {/* Background */}
      <rect width="40" height="40" fill={bg} />

      {/* Head */}
      <circle cx="20" cy="14.5" r="6.5" fill={headColor} opacity="0.9" />

      {/* Body / shoulders */}
      <path
        d="M8 38 C8 28 12 24 20 24 C28 24 32 28 32 38"
        fill={bodyColor}
        opacity="0.75"
      />
    </svg>
  );
}

interface ContactAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function ContactAvatar({ name, size = 32, className = "" }: ContactAvatarProps) {
  const [bg, bodyColor, headColor] = getPalette(name);
  const style = getStyle(name);

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      title={name}
    >
      <PersonSVG bg={bg} bodyColor={bodyColor} headColor={headColor} style={style} />
    </div>
  );
}
