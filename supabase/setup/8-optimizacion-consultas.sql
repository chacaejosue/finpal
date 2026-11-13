-- 8. OPTIMIZACIÓN DE CONSULTAS E ÍNDICES (ADITIVA E IDEMPOTENTE)
-- Segura para bases de datos con usuarios y datos activos: no modifica ni elimina registros.

-- ============================================================================
-- 1. ÍNDICES ADITIVOS DE RENDIMIENTO
-- ============================================================================

-- Acelera la función es_miembro_espacio() ejecutada en todas las políticas RLS
CREATE INDEX IF NOT EXISTS idx_miembros_espacio_usuario
  ON public.miembros_espacio(usuario_id, espacio_id);

-- Acelera el cálculo agregado de saldos por cuenta dentro de un espacio
CREATE INDEX IF NOT EXISTS idx_transacciones_espacio_cuenta
  ON public.transacciones(espacio_id, cuenta_dinero_id);

-- Coincide con el ordenamiento principal de getMovimientos (ocurrido_en DESC, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_transacciones_espacio_orden
  ON public.transacciones(espacio_id, ocurrido_en DESC, created_at DESC);

-- Índice parcial para listar préstamos activos (no archivados) ordenados por fecha de creación
CREATE INDEX IF NOT EXISTS idx_prestamos_espacio_activos
  ON public.prestamos(espacio_id, created_at DESC)
  WHERE archivado_en IS NULL;

-- Acelera consultas y joins por préstamo en pagos_prestamos
CREATE INDEX IF NOT EXISTS idx_pagos_prestamos_prestamo
  ON public.pagos_prestamos(prestamo_id);

-- ============================================================================
-- 2. RPC PARA CALCULAR SALDOS EN POSTGRESQL (EVITA DESCARGAR TODAS LAS TRANSACCIONES)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_obtener_saldos_cuentas(p_espacio_id UUID)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  tipo TEXT,
  saldo_inicial NUMERIC,
  codigo_moneda TEXT,
  es_activa BOOLEAN,
  created_at TIMESTAMPTZ,
  saldo NUMERIC
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    c.id,
    c.nombre,
    c.tipo::TEXT,
    c.saldo_inicial,
    c.codigo_moneda::TEXT,
    c.es_activa,
    c.created_at,
    (
      c.saldo_inicial + COALESCE(
        SUM(
          CASE
            WHEN t.tipo IN ('ingreso', 'transferencia_entrada', 'pago_prestamo') THEN t.monto
            WHEN t.tipo = 'ajuste' AND t.ajuste_sentido = 'sumar' THEN t.monto
            WHEN t.id IS NOT NULL THEN -t.monto
            ELSE 0
          END
        ),
        0
      )
    )::NUMERIC AS saldo
  FROM public.cuentas_dinero c
  LEFT JOIN public.transacciones t
    ON t.cuenta_dinero_id = c.id
    AND t.espacio_id = p_espacio_id
  WHERE c.espacio_id = p_espacio_id
    AND c.es_activa = TRUE
    AND public.es_miembro_espacio(p_espacio_id)
  GROUP BY c.id, c.nombre, c.tipo, c.saldo_inicial, c.codigo_moneda, c.es_activa, c.created_at
  ORDER BY c.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_obtener_saldos_cuentas(UUID) TO authenticated;
