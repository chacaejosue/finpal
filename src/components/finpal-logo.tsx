"use client";

import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
  priority?: boolean;
}

export function FinPalLogo({
  className = "w-8 h-8",
  size = 32,
  priority = false,
}: LogoProps) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
      <Image
        src="/logo.svg"
        alt="FinPal Logo"
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain"
        priority={priority}
      />
    </div>
  );
}

export function FinPalBrand({
  logoSize = 32,
  textSize = "text-lg",
  className = "",
}: {
  logoSize?: number;
  textSize?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <FinPalLogo size={logoSize} className={`w-${Math.round(logoSize / 4)} h-${Math.round(logoSize / 4)}`} />
      <div className={`flex items-baseline tracking-tight font-heading ${textSize}`}>
        <span className="font-extrabold text-on-surface">Fin</span>
        <span className="font-extrabold text-primary">Pal</span>
      </div>
    </div>
  );
}
