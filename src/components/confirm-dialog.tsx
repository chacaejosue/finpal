"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, AlertCircle, HelpCircle, X } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="bg-surface-container-lowest border border-surface-container-high/80 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative overflow-hidden"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
          >
            {/* Botón de cerrar (cruz) */}
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              aria-label="Cerrar diálogo"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Encabezado con ícono temático */}
            <div className="flex items-start gap-3.5 mb-4">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  variant === "danger"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : variant === "warning"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-primary/15 text-primary border-primary/30"
                }`}
              >
                {variant === "danger" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : variant === "warning" ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 pr-4">
                <h3 id="confirm-dialog-title" className="font-heading text-base sm:text-lg font-bold text-on-surface leading-tight">
                  {title}
                </h3>
                <p id="confirm-dialog-desc" className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex items-center gap-2.5 pt-2 border-t border-surface-container-low">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-surface-container-high/80 bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center active:scale-[0.98] ${
                  variant === "danger"
                    ? "bg-error text-on-error hover:bg-error/90"
                    : variant === "warning"
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-primary text-on-primary hover:bg-primary-container"
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
