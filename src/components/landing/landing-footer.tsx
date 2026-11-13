"use client";

import { ExternalLink } from "lucide-react";
import { GITHUB_WEB_URL } from "./landing-data";
import { useLandingLegal } from "./landing-legal-provider";

export function LandingFooter() {
  const { openLegal } = useLandingLegal();

  return (
    <footer className="w-full py-10 bg-surface-container-lowest border-t border-surface-container-high/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="font-bold text-on-surface">FinPal</span>
          <span>© {new Date().getFullYear()} Josué Chacae.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
          <a className="hover:text-primary transition-colors" href="#simulador">
            Simulador
          </a>
          <a className="hover:text-primary transition-colors" href="#centralizar">
            Por qué FinPal
          </a>
          <button
            type="button"
            onClick={() => openLegal("terminos")}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Términos
          </button>
          <button
            type="button"
            onClick={() => openLegal("privacidad")}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Privacidad
          </button>
          <a
            className="hover:text-primary transition-colors flex items-center gap-1"
            href={GITHUB_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
