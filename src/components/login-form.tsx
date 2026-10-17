"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

export function LoginForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    void action(new FormData(event.currentTarget));
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-on-surface" htmlFor="email">
          Correo electrónico
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3.5 h-4 w-4 text-outline pointer-events-none" />
          <input
            autoComplete="email"
            className="h-11 w-full rounded-xl border border-surface-container-high/80 bg-surface-container-lowest pl-10 pr-3.5 text-base sm:text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            id="email"
            name="email"
            placeholder="tu@correo.com"
            required
            type="email"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="block text-xs font-semibold text-on-surface" htmlFor="password">
            Contraseña
          </label>
          <a
            className="text-[11px] sm:text-xs font-semibold text-primary transition-colors hover:text-primary-container shrink-0"
            href="mailto:hola@finpal.app?subject=Recuperar%20contraseña"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>
        <div className="relative flex items-center">
          <Lock className="absolute left-3.5 h-4 w-4 text-outline pointer-events-none" />
          <input
            autoComplete="current-password"
            className="h-11 w-full rounded-xl border border-surface-container-high/80 bg-surface-container-lowest pl-10 pr-10 text-base sm:text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            id="password"
            name="password"
            placeholder="Ingresa tu contraseña"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3.5 text-outline transition hover:text-on-surface p-1 cursor-pointer"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        <input
          className="h-4 w-4 cursor-pointer rounded border-surface-container-high accent-primary shrink-0"
          id="rememberMe"
          name="remember"
          type="checkbox"
        />
        <label className="cursor-pointer select-none text-xs font-medium text-on-surface leading-tight" htmlFor="rememberMe">
          Recordarme en este dispositivo
        </label>
      </div>
      <button
        className="mt-2 flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-on-primary shadow-xs transition-all hover:bg-primary-container active:scale-[0.99] disabled:opacity-75 cursor-pointer"
        disabled={loading}
        type="submit"
      >
        <span>{loading ? "Verificando..." : "Iniciar sesión"}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
      <div className="mt-5 flex items-center justify-center gap-1.5 border-t border-surface-container-high/40 pt-3 text-center">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span className="text-[11px] sm:text-xs font-medium text-outline">Autenticación segura con Supabase Auth</span>
      </div>
    </form>
  );
}

