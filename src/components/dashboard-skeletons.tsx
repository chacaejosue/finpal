"use client";

import { usePathname } from "next/navigation";

export function DashboardRouteSkeleton({ path }: { path?: string | null }) {
  const currentPath = usePathname();
  const target = path || currentPath || "";
  const normalized = target.toLowerCase();

  if (normalized.includes("reportes")) {
    return <SkeletonReportes />;
  }
  if (normalized.includes("prestamos")) {
    return <SkeletonPrestamos />;
  }
  if (normalized.includes("contactos")) {
    return <SkeletonContactos />;
  }
  if (normalized.includes("pagos")) {
    return <SkeletonPagos />;
  }
  if (normalized.includes("cuentas")) {
    return <SkeletonCuentas />;
  }
  if (normalized.includes("movimientos")) {
    return <SkeletonMovimientos />;
  }
  if (normalized.includes("configuracion")) {
    return <SkeletonConfiguracion />;
  }
  if (normalized.includes("espacios")) {
    return <SkeletonEspacios />;
  }

  // Por defecto: Vista Inicio (Panel de control)
  return <SkeletonInicio />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SKELETON INICIO (PANEL DE CONTROL)
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonInicio() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando panel de control">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-surface-container-high/60">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-primary/10 rounded-full" />
          <div className="h-8 w-60 bg-surface-container-high rounded-xl" />
          <div className="h-3.5 w-80 max-w-full bg-surface-container rounded-md" />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="h-10 w-28 bg-surface-container-lowest border border-surface-container-high/70 rounded-xl" />
          <div className="h-10 w-36 bg-surface-container-lowest border border-surface-container-high/70 rounded-xl" />
          <div className="h-10 w-32 bg-surface-container-lowest border border-surface-container-high/70 rounded-xl" />
          <div className="h-10 w-36 bg-primary/20 rounded-xl" />
        </div>
      </div>

      {/* 4 Scorecards KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { color: "bg-emerald-500/15" },
          { color: "bg-amber-500/15" },
          { color: "bg-teal-500/15" },
          { color: "bg-blue-500/15" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="h-28 bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-4 sm:p-5 flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-surface-container rounded" />
              <div className={`w-8 h-8 rounded-xl ${item.color}`} />
            </div>
            <div className="h-7 w-32 bg-surface-container-high rounded-lg mt-1" />
            <div className="h-2.5 w-24 bg-surface-container/70 rounded" />
          </div>
        ))}
      </div>

      {/* Widget Deudores y préstamos prioritarios (Tarjetas modernas) */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10" />
            <div className="space-y-1">
              <div className="h-4 w-48 bg-surface-container-high rounded" />
              <div className="h-3 w-64 bg-surface-container rounded hidden sm:block" />
            </div>
          </div>
          <div className="h-7 w-24 bg-surface-container-low rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-low/40 border border-surface-container-high/60 rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-surface-container shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-28 bg-surface-container-high rounded" />
                    <div className="h-2.5 w-20 bg-surface-container rounded" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-surface-container rounded-full" />
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full bg-surface-container rounded-full" />
              </div>
              <div className="h-16 bg-surface-container-lowest rounded-xl p-2.5" />
              <div className="flex gap-2 pt-1 border-t border-surface-container-high/40">
                <div className="h-7 flex-1 bg-surface-container rounded-xl" />
                <div className="h-7 flex-1 bg-primary/20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Widget Movimientos recientes */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10" />
            <div className="h-4 w-40 bg-surface-container-high rounded" />
          </div>
          <div className="h-4 w-16 bg-surface-container rounded" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/40 border border-surface-container-high/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-container shrink-0" />
                <div className="space-y-1">
                  <div className="h-3.5 w-40 bg-surface-container-high rounded" />
                  <div className="h-2.5 w-24 bg-surface-container rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-surface-container-high rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. SKELETON REPORTES & ANALÍTICA BI
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonReportes() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando reportes y analítica">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container-high/60">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="h-5 w-44 bg-emerald-500/15 rounded-full" />
            <div className="h-4 w-28 bg-surface-container rounded" />
          </div>
          <div className="h-8 w-72 bg-surface-container-high rounded-xl" />
          <div className="h-3.5 w-96 max-w-full bg-surface-container rounded-md" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="h-9 w-28 bg-surface-container-low rounded-xl" />
          <div className="h-9 w-32 bg-primary/20 rounded-xl" />
          <div className="h-9 w-16 bg-surface-container-low rounded-xl" />
          <div className="h-9 w-16 bg-surface-container-low rounded-xl" />
        </div>
      </div>

      {/* Slicers Ribbon */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-high/70 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/20" />
            <div className="h-4 w-48 bg-surface-container-high rounded" />
          </div>
          <div className="h-5 w-36 bg-surface-container rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-surface-container rounded" />
            <div className="h-10 bg-surface-container-low rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-surface-container rounded" />
            <div className="h-10 bg-surface-container-low rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-28 bg-surface-container rounded" />
            <div className="h-10 bg-surface-container-low rounded-xl" />
          </div>
        </div>
      </div>

      {/* 4 Scorecards KPI (Flujo Operativo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { color: "bg-emerald-500/15" },
          { color: "bg-rose-500/15" },
          { color: "bg-blue-500/15" },
          { color: "bg-teal-500/15" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="h-28 bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-4 sm:p-5 flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-surface-container rounded" />
              <div className={`w-9 h-9 rounded-xl ${item.color}`} />
            </div>
            <div className="h-7 w-32 bg-surface-container-high rounded-lg" />
            <div className="h-2.5 w-24 bg-surface-container rounded" />
          </div>
        ))}
      </div>

      {/* 2 Gráficos Analíticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="h-80 bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-44 bg-surface-container-high rounded" />
              <div className="h-3 w-60 bg-surface-container rounded" />
            </div>
            <div className="h-7 w-28 bg-surface-container-low rounded-lg" />
          </div>
          <div className="h-44 flex items-end gap-2 px-2 pt-4">
            {[40, 60, 30, 75, 55, 90, 65, 45, 80, 50, 70, 85].map((h, i) => (
              <div key={i} className="flex-1 bg-surface-container-low rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="flex justify-between pt-2 border-t border-surface-container-low">
            <div className="h-3 w-24 bg-surface-container rounded" />
            <div className="h-3 w-24 bg-surface-container rounded" />
          </div>
        </div>

        <div className="h-80 bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-5 flex flex-col justify-between shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-48 bg-surface-container-high rounded" />
              <div className="h-3 w-52 bg-surface-container rounded" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-surface-container" />
          </div>
          <div className="flex items-center justify-center gap-6 py-4">
            <div className="w-36 h-36 rounded-full border-8 border-surface-container-high/60 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-surface-container-low" />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500/40" />
                <div className="h-3 w-20 bg-surface-container rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/40" />
                <div className="h-3 w-24 bg-surface-container rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500/40" />
                <div className="h-3 w-16 bg-surface-container rounded" />
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-2 border-t border-surface-container-low">
            <div className="h-3 w-28 bg-surface-container rounded" />
            <div className="h-3 w-20 bg-surface-container rounded" />
          </div>
        </div>
      </div>

      {/* Matriz de Cartera Skeleton (Tarjetas analíticas) */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-low">
          <div className="space-y-1">
            <div className="h-4 w-48 bg-surface-container-high rounded" />
            <div className="h-3 w-64 bg-surface-container rounded" />
          </div>
          <div className="h-8 w-44 bg-surface-container-low rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-surface-container-low/40 border border-surface-container-high/60 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-surface-container shrink-0" />
                  <div className="space-y-1">
                    <div className="h-3.5 w-28 bg-surface-container-high rounded" />
                    <div className="h-2.5 w-20 bg-surface-container rounded" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-surface-container rounded-full" />
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full" />
              <div className="h-14 bg-surface-container-lowest rounded-xl p-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SKELETON PRÉSTAMOS
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonPrestamos() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando préstamos">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div className="space-y-1.5">
          <div className="h-8 w-44 bg-surface-container-high rounded-xl" />
          <div className="h-3.5 w-72 bg-surface-container rounded-md" />
        </div>
        <div className="h-10 w-36 bg-primary/20 rounded-xl" />
      </div>

      {/* Barra de Filtros, Búsqueda y Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-full sm:w-64">
          <div className="h-8 flex-1 bg-primary/20 rounded-lg" />
          <div className="h-8 flex-1 bg-transparent rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-full sm:w-60 bg-surface-container-lowest border border-surface-container-high/80 rounded-xl" />
          <div className="h-9 w-18 bg-surface-container-low rounded-xl" />
        </div>
      </div>

      {/* Grid de Tarjetas de Préstamo Modernas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-surface-container shrink-0" />
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-surface-container-high rounded" />
                  <div className="h-2.5 w-20 bg-surface-container rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-surface-container rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <div className="h-2.5 w-16 bg-surface-container rounded" />
                <div className="h-2.5 w-8 bg-surface-container rounded" />
              </div>
              <div className="h-2 w-full bg-surface-container rounded-full" />
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/50 border border-surface-container-high/40 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="h-2.5 w-16 bg-surface-container rounded" />
                <div className="h-4 w-20 bg-surface-container-high rounded" />
              </div>
              <div className="space-y-1 text-right">
                <div className="h-2.5 w-16 bg-surface-container rounded ml-auto" />
                <div className="h-4 w-18 bg-surface-container-high rounded ml-auto" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-surface-container-low">
              <div className="h-8 flex-1 bg-surface-container rounded-xl" />
              <div className="h-8 flex-1 bg-primary/20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. SKELETON CONTACTOS & DEUDORES
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonContactos() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando contactos">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div className="space-y-1.5">
          <div className="h-8 w-56 bg-surface-container-high rounded-xl" />
          <div className="h-3.5 w-80 bg-surface-container rounded-md" />
        </div>
        <div className="h-10 w-36 bg-primary/20 rounded-xl" />
      </div>

      {/* Buscador + Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="h-9 w-full sm:w-72 bg-surface-container-lowest border border-surface-container-high/80 rounded-xl" />
        <div className="h-9 w-18 bg-surface-container-low rounded-xl ml-auto" />
      </div>

      {/* Grid de Tarjetas de Contacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-surface-container shrink-0" />
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-surface-container-high rounded" />
                  <div className="h-3 w-24 bg-surface-container rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-surface-container rounded-full" />
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/50 border border-surface-container-high/40 flex justify-between items-center">
              <div className="space-y-1">
                <div className="h-2.5 w-16 bg-surface-container rounded" />
                <div className="h-4 w-20 bg-surface-container-high rounded" />
              </div>
              <div className="h-5 w-20 bg-surface-container rounded-md" />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-container-low">
              <div className="h-8 flex-1 bg-surface-container rounded-xl" />
              <div className="h-8 w-8 bg-surface-container rounded-xl" />
              <div className="h-8 flex-1 bg-primary/20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. SKELETON COBROS (PAGOS)
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonPagos() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando cobros recibidos">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div className="space-y-1.5">
          <div className="h-8 w-52 bg-surface-container-high rounded-xl" />
          <div className="h-3.5 w-80 bg-surface-container rounded-md" />
        </div>
        <div className="h-10 w-36 bg-primary/20 rounded-xl" />
      </div>

      {/* Buscador + Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="h-9 w-full sm:w-72 bg-surface-container-lowest border border-surface-container-high/80 rounded-xl" />
        <div className="h-9 w-18 bg-surface-container-low rounded-xl ml-auto" />
      </div>

      {/* Grid de Recibos de Cobro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-surface-container rounded" />
              <div className="h-5 w-20 bg-surface-container rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="h-4 w-36 bg-surface-container-high rounded" />
              <div className="h-3 w-24 bg-surface-container rounded" />
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low/50 border border-surface-container-high/40 space-y-2">
              <div className="h-6 w-28 bg-primary/20 rounded" />
              <div className="h-2.5 w-full bg-surface-container rounded" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-container-low">
              <div className="h-5 w-20 bg-surface-container rounded-md" />
              <div className="h-7 w-24 bg-surface-container rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. SKELETON CUENTAS DE DINERO
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonCuentas() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando cuentas">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div>
          <div className="h-8 w-56 bg-surface-container-high rounded-xl" />
          <div className="h-3.5 w-80 bg-surface-container rounded-md mt-1.5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-32 bg-surface-container-lowest border border-surface-container-high/70 rounded-xl" />
          <div className="h-10 w-36 bg-primary/20 rounded-xl" />
        </div>
      </div>

      {/* Grid de Tarjetas de Cuenta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-5 flex flex-col justify-between shadow-2xs"
          >
            <div>
              <div className="flex justify-between items-start">
                <div className="h-5 w-28 bg-surface-container rounded-full" />
                <div className="w-7 h-7 rounded-lg bg-surface-container" />
              </div>
              <div className="h-6 w-40 bg-surface-container-high rounded-lg mt-3" />
            </div>
            <div className="pt-3 border-t border-surface-container-low flex justify-between items-baseline">
              <div className="space-y-1">
                <div className="h-2.5 w-20 bg-surface-container rounded" />
                <div className="h-7 w-32 bg-surface-container-high rounded-lg" />
              </div>
              <div className="h-5 w-12 bg-surface-container rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. SKELETON MOVIMIENTOS
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonMovimientos() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando movimientos">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div className="space-y-1.5">
          <div className="h-8 w-44 bg-surface-container-high rounded-xl" />
          <div className="h-3.5 w-60 bg-surface-container rounded-md" />
        </div>
        <div className="h-10 w-44 bg-primary/20 rounded-xl" />
      </div>

      {/* Barra de Filtros, Búsqueda y Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-7 w-20 bg-surface-container rounded-lg shrink-0" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-full sm:w-64 bg-surface-container-lowest border border-surface-container-high/80 rounded-xl" />
          <div className="h-9 w-18 bg-surface-container-low rounded-xl shrink-0" />
        </div>
      </div>

      {/* Feed de Movimientos Individuales */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest border border-surface-container-high/70 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-container shrink-0" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-36 bg-surface-container-high rounded" />
                  <div className="h-4 w-16 bg-surface-container rounded-full" />
                </div>
                <div className="h-3 w-48 bg-surface-container rounded" />
              </div>
            </div>
            <div className="h-5 w-24 bg-surface-container-high rounded self-end sm:self-auto" />
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-3.5 w-48 bg-surface-container rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-xl bg-surface-container-low" />
          <div className="h-8 w-8 rounded-xl bg-surface-container-low" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SKELETON CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonConfiguracion() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando configuración">
      {/* Header */}
      <div className="pb-4 border-b border-surface-container-high/60">
        <div className="h-8 w-48 bg-surface-container-high rounded-xl" />
        <div className="h-3.5 w-80 bg-surface-container rounded-md mt-1.5" />
      </div>

      {/* Grid 2 Columnas ancho completo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Card 1: Zona Horaria */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-6 space-y-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10" />
            <div className="space-y-1">
              <div className="h-4 w-44 bg-surface-container-high rounded" />
              <div className="h-3 w-64 bg-surface-container rounded" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 w-28 bg-surface-container rounded" />
            <div className="h-11 w-full bg-surface-container-low rounded-xl" />
            <div className="h-3 w-40 bg-surface-container rounded mt-2" />
          </div>
        </div>

        {/* Card 2: Color de Acento */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-6 space-y-5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10" />
            <div className="space-y-1">
              <div className="h-4 w-48 bg-surface-container-high rounded" />
              <div className="h-3 w-60 bg-surface-container rounded" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-surface-container" />
            ))}
          </div>
        </div>

        {/* Card 3: Tasa de Interés */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10" />
            <div className="space-y-1">
              <div className="h-4 w-52 bg-surface-container-high rounded" />
              <div className="h-3 w-64 bg-surface-container rounded" />
            </div>
          </div>
          <div className="h-11 w-full bg-surface-container-low rounded-xl" />
        </div>

        {/* Card 4: Atajos de teclado & Soporte */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10" />
            <div className="space-y-1">
              <div className="h-4 w-44 bg-surface-container-high rounded" />
              <div className="h-3 w-60 bg-surface-container rounded" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <div className="h-3 w-32 bg-surface-container rounded" />
                <div className="h-6 w-16 bg-surface-container-low rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. SKELETON ESPACIOS DE TRABAJO
// ─────────────────────────────────────────────────────────────────────────────
export function SkeletonEspacios() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 skeleton-shimmer" aria-busy="true" aria-label="Cargando espacios">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-high/60">
        <div>
          <div className="h-8 w-56 bg-surface-container-high rounded-xl" />
          <div className="h-3.5 w-72 bg-surface-container rounded-md mt-1.5" />
        </div>
        <div className="h-10 w-36 bg-primary/20 rounded-xl" />
      </div>

      {/* Grid de Espacios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-surface-container-lowest rounded-2xl border border-surface-container-high/70 p-5 flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container" />
              <div className="space-y-1.5">
                <div className="h-5 w-32 bg-surface-container-high rounded" />
                <div className="h-4 w-12 bg-surface-container rounded" />
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-surface-container-low">
              <div className="h-3 w-28 bg-surface-container rounded" />
              <div className="w-5 h-5 rounded-full bg-surface-container" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
