"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getSessionAccent } from "@/lib/theme-utils";

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
  const [sessionAccent, setSessionAccent] = useState<string | null>(null);

  useEffect(() => {
    setSessionAccent(getSessionAccent());
    const onStorage = () => setSessionAccent(getSessionAccent());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const validAccents = ["azul", "violeta", "naranja", "rosa"];
  const resolvedAccent = colorAcento ?? sessionAccent;
  const preferredSrc =
    resolvedAccent && validAccents.includes(resolvedAccent)
      ? `/logo-${resolvedAccent}.svg`
      : "/logo.svg";

  useEffect(() => {
    setLoadError(false);
  }, [preferredSrc]);

  const activeSrc = loadError ? "/logo.svg" : preferredSrc;

  return (
    <div
      suppressHydrationWarning
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
    >
      <Image
        key={activeSrc}
        src={activeSrc}
        alt="FinPal Logo"
        width={size * 2}
        height={size * 2}
        unoptimized
        suppressHydrationWarning
        className="w-full h-full object-contain select-none"
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
