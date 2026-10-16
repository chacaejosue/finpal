"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
  colorAcento?: string;
}

export function FinPalLogo({
  className = "w-10 h-10",
  size = 38,
  priority = false,
  colorAcento,
}: LogoProps) {
  const logoSrc =
    colorAcento && ["azul", "violeta", "naranja", "rosa"].includes(colorAcento)
      ? `/logo-${colorAcento}.svg`
      : "/logo.svg";

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src={logoSrc}
        alt="FinPal Logo"
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain"
        priority={priority}
      />
    </div>
  );
}

export const FinoraLogo = FinPalLogo;

export function FinPalBrand({
  logoSize = 38,
  textSize = "text-xl",
  className = "",
  colorAcento,
}: {
  logoSize?: number;
  textSize?: string;
  className?: string;
  colorAcento?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <FinPalLogo
        size={logoSize}
        colorAcento={colorAcento}
        className="w-10 h-10"
      />
      <div className={`flex items-baseline tracking-tight font-heading ${textSize}`}>
        <span className="font-extrabold text-on-surface">Fin</span>
        <span className="font-extrabold text-primary">Pal</span>
      </div>
    </div>
  );
}

export const FinoraBrand = FinPalBrand;
