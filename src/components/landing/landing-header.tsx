"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, LogIn, Menu, X } from "lucide-react";
import { FinPalLogo } from "@/components/finpal-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { clearSessionAccent } from "@/lib/theme-utils";

const navLinks = [
  { href: "#simulador", label: "Simulador" },
  { href: "#vista-sistema", label: "Sistema" },
  { href: "#centralizar", label: "Por qué FinPal" },
  { href: "#alcance", label: "Funciones" },
  { href: "#faq", label: "Preguntas" },
];

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-surface-container-lowest/85 backdrop-blur-md border-b border-surface-container-high/60 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link
          href="/"
          onClick={(e) => {
            clearSessionAccent();
            e.preventDefault();
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          aria-label="FinPal Inicio"
        >
          <FinPalLogo size={32} className="w-8 h-8 transition-transform group-hover:scale-105" />
          <span className="font-heading text-xl font-bold tracking-tight text-on-surface">
            Fin<span className="text-primary font-black">Pal</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Navegación principal">
          {navLinks.map((item) => (
            <a
              key={item.href}
              className="text-on-surface-variant hover:text-primary text-sm font-medium transition-colors"
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />

          <Link
            href="/iniciar-sesion"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-on-surface hover:bg-surface-container text-xs sm:text-sm font-semibold transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Iniciar sesión</span>
          </Link>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/registrarse"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-xs shrink-0"
            >
              <span>Empezar gratis</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </motion.div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="landing-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-surface-container-high/60 bg-surface-container-lowest/95 backdrop-blur-md"
          >
            <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Navegación móvil">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2 mt-1 border-t border-surface-container-low flex flex-col gap-2">
                <Link
                  href="/iniciar-sesion"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-surface-container-high text-on-surface hover:bg-surface-container text-sm font-semibold transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar sesión</span>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
