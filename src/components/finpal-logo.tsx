"use client";

import { useState } from "react";
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
  const [loadError, setLoadError] = useState(false);

  const validAccents = ["azul", "violeta", "naranja", "rosa"];
  const preferredSrc =
    colorAcento && validAccents.includes(colorAcento)
      ? `/logo-${colorAcento}.svg`
      : "/logo.svg";

  const activeSrc = loadError ? "/logo.svg" : preferredSrc;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <Image
        src={activeSrc}
        alt="FinPal Logo"
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain"
        priority={priority}
        onError={() => setLoadError(true)}
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
