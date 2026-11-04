-- 7. ANULACIÓN ATÓMICA DE COBROS (REVERSIÓN COMPLETA + AUDITORÍA)
-- ============================================================================
-- Revierte un cobro registrado por error como si nunca hubiera existido:
--   1. Elimina TODAS las transacciones de ingreso asociadas al cobro
--      (por pago_prestamo_id, por id explícito y, como último recurso,
--      la transacción huérfana coincidente). Así el saldo de la cuenta
--      deja de incluir ese dinero.
--   2. Elimina el registro en pagos_prestamos (desaparece de /pagos,
--      reportes, totales cobrados e intereses percibidos).
--   3. Restaura el capital pagado y el estado del préstamo.
--   4. Registra la reversión en auditoria_cambios (único rastro visible).
-- Todo ocurre dentro de una sola transacción: o se aplica completo o no se
-- aplica nada (evita estados a medias como "se borró el movimiento pero el
-- cobro sigue apareciendo").
--
-- SECURITY DEFINER para no depender de que existan políticas RLS de DELETE,
-- pero validando explícitamente que el usuario sea miembro del espacio.

CREATE OR REPLACE FUNCTION public.fn_anular_cobro_prestamo(
  p_espacio_id UUID,
  p_pago_id UUID,
  p_transaccion_id UUID DEFAULT NULL,
  p_motivo TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_pago public.pagos_prestamos%ROWTYPE;
  v_prestamo public.prestamos%ROWTYPE;
  v_cuenta_nombre TEXT;
  v_tx_eliminadas INTEGER := 0;
  v_tx_extra INTEGER := 0;
  v_nuevo_capital NUMERIC(18,2);
  v_nuevo_estado public.estado_prestamo;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
  END IF;

  IF NOT public.es_miembro_espacio(p_espacio_id) THEN
    RAISE EXCEPTION 'No tienes acceso a este espacio' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_pago
  FROM public.pagos_prestamos
  WHERE id = p_pago_id AND espacio_id = p_espacio_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El cobro no fue encontrado en este espacio' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_prestamo
  FROM public.prestamos
  WHERE id = v_pago.prestamo_id AND espacio_id = p_espacio_id
  FOR UPDATE;

  SELECT nombre INTO v_cuenta_nombre
  FROM public.cuentas_dinero
  WHERE id = v_pago.cuenta_dinero_id;

  -- 1. Transacciones enlazadas al cobro (o la indicada explícitamente)
  DELETE FROM public.transacciones
  WHERE espacio_id = p_espacio_id
    AND (
      pago_prestamo_id = v_pago.id
      OR (p_transaccion_id IS NOT NULL AND id = p_transaccion_id)
    );
  GET DIAGNOSTICS v_tx_eliminadas = ROW_COUNT;

  -- 1b. Transacción huérfana (registrada sin pago_prestamo_id)
  IF v_tx_eliminadas = 0 THEN
    DELETE FROM public.transacciones
    WHERE id = (
      SELECT t.id
      FROM public.transacciones t
      WHERE t.espacio_id = p_espacio_id
        AND t.tipo = 'pago_prestamo'
        AND t.pago_prestamo_id IS NULL
        AND t.cuenta_dinero_id = v_pago.cuenta_dinero_id
        AND t.monto = v_pago.monto_total
        AND (t.prestamo_id = v_pago.prestamo_id OR t.prestamo_id IS NULL)
      ORDER BY (t.ocurrido_en = v_pago.recibido_en) DESC,
               (t.prestamo_id IS NOT NULL) DESC,
               t.created_at DESC
      LIMIT 1
    );
    GET DIAGNOSTICS v_tx_extra = ROW_COUNT;
    v_tx_eliminadas := v_tx_eliminadas + v_tx_extra;
  END IF;

  -- 2. Registro del cobro
  DELETE FROM public.pagos_prestamos
  WHERE id = v_pago.id AND espacio_id = p_espacio_id;

  -- 3. Restaurar capital y estado del préstamo
  IF v_prestamo.id IS NOT NULL THEN
    v_nuevo_capital := GREATEST(0, v_prestamo.monto_capital_pagado - v_pago.monto_principal);
    v_nuevo_estado := CASE
      WHEN v_nuevo_capital >= v_prestamo.monto_principal THEN 'pagado'::public.estado_prestamo
      WHEN v_prestamo.estado = 'pagado' THEN 'activo'::public.estado_prestamo
      ELSE v_prestamo.estado
    END;

    UPDATE public.prestamos
    SET monto_capital_pagado = v_nuevo_capital,
        estado = v_nuevo_estado
    WHERE id = v_prestamo.id;
  END IF;

  -- 4. Auditoría
  INSERT INTO public.auditoria_cambios (
    espacio_id, entidad, entidad_id, campo_modificado,
    valor_anterior, valor_nuevo, motivo, usuario_id
  ) VALUES (
    p_espacio_id,
    'pagos_prestamos',
    v_pago.id,
    'anulacion_cobro',
    jsonb_build_object(
      'tipo', 'pago_prestamo',
      'monto_total', v_pago.monto_total,
      'monto_principal', v_pago.monto_principal,
      'monto_interes', v_pago.monto_interes,
      'prestamo_id', v_pago.prestamo_id,
      'prestamo_nombre', v_prestamo.nombre,
      'cuenta_dinero_id', v_pago.cuenta_dinero_id,
      'cuenta_nombre', v_cuenta_nombre,
      'recibido_en', v_pago.recibido_en,
      'transacciones_eliminadas', v_tx_eliminadas
    )::text,
    'eliminado',
    COALESCE(NULLIF(trim(p_motivo), ''), 'Cobro revertido y eliminado por corrección del usuario'),
    v_uid
  );

  RETURN jsonb_build_object(
    'pago_id', v_pago.id,
    'transacciones_eliminadas', v_tx_eliminadas,
    'prestamo_nombre', v_prestamo.nombre
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_anular_cobro_prestamo(UUID, UUID, UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_anular_cobro_prestamo(UUID, UUID, UUID, TEXT) TO authenticated;

-- Políticas de UPDATE/DELETE que faltaban (por si el script 6 no se aplicó)
DROP POLICY IF EXISTS "Miembros eliminan pagos de préstamos" ON public.pagos_prestamos;
CREATE POLICY "Miembros eliminan pagos de préstamos"
  ON public.pagos_prestamos FOR DELETE
  USING (public.es_miembro_espacio(espacio_id));

DROP POLICY IF EXISTS "Miembros eliminan transacciones" ON public.transacciones;
CREATE POLICY "Miembros eliminan transacciones"
  ON public.transacciones FOR DELETE
  USING (public.es_miembro_espacio(espacio_id));
