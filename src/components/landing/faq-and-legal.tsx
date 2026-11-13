"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUp, ChevronDown, ExternalLink, ShieldCheck, X } from "lucide-react";
import {
  TERMINOS_DE_SERVICIO,
  POLITICA_DE_PRIVACIDAD,
  LEGAL_VERSION,
} from "@/config/legal-content";
import { faqs } from "./landing-data";

export function FaqAccordion() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2.5">
      {faqs.map((faq, index) => {
        const isOpen = openFaqIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div
            key={faq.pregunta}
            className="bg-surface-container-lowest border border-surface-container-high/70 rounded-xl overflow-hidden transition-all shadow-2xs hover:border-surface-container-highest"
          >
            <button
              id={buttonId}
              type="button"
              className="w-full px-4 sm:px-5 py-3.5 text-left flex items-center justify-between gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setOpenFaqIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="font-heading text-xs sm:text-sm font-bold text-on-surface pr-2">
                {faq.pregunta}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  isOpen
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 sm:px-5 pb-4 pt-1 text-xs text-on-surface-variant leading-relaxed border-t border-surface-container-low">
                    {faq.respuesta}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

interface LegalModalProps {
  legalModal: "terminos" | "privacidad" | null;
  onClose: () => void;
}

export function LegalModal({ legalModal, onClose }: LegalModalProps) {
  useEffect(() => {
    if (!legalModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [legalModal, onClose]);

  return (
    <AnimatePresence>
      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-modal-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 relative text-on-surface max-h-[85vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-surface-container-low">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h3 id="legal-modal-title" className="font-heading text-base font-bold">
                  {legalModal === "terminos"
                    ? "Términos de Servicio"
                    : "Política de Privacidad"}
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Versión {LEGAL_VERSION}
                </p>
              </div>
            </div>

            {legalModal === "terminos" ? (
              <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                {TERMINOS_DE_SERVICIO.map((sec) => (
                  <div key={sec.id} className="space-y-1">
                    <p className="font-bold text-on-surface">{sec.titulo}</p>
                    {sec.parrafos.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-xs text-on-surface-variant leading-relaxed">
                {POLITICA_DE_PRIVACIDAD.map((sec) => (
                  <div key={sec.id} className="space-y-1">
                    <p className="font-bold text-on-surface">{sec.titulo}</p>
                    {sec.parrafos.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-surface-container-low flex items-center justify-between gap-3">
              <Link
                href={legalModal === "terminos" ? "/terminos" : "/privacidad"}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                onClick={onClose}
              >
                <span>Página dedicada</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ScrollTopButton() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 350);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {showScrollTop && (
        <motion.button
          type="button"
          aria-label="Volver arriba"
          initial={{ opacity: 0, scale: 0.8, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 16 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-primary text-on-primary shadow-xl hover:bg-primary-container transition-all flex items-center justify-center cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
