-- 4. ENDURECIMIENTO DE SEGURIDAD
-- ============================================================================
-- Estas validaciones complementan RLS y evitan asociar registros de espacios
-- distintos aunque una petición envíe identificadores válidos.

CREATE OR REPLACE FUNCTION public.validar_relaciones_mismo_espacio()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  entidad_espacio UUID;
BEGIN
  IF TG_TABLE_NAME = 'prestamos' THEN
    SELECT espacio_id INTO entidad_espacio
    FROM public.contactos
    WHERE id = NEW.contacto_id;

    IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
      RAISE EXCEPTION 'El contacto no pertenece al mismo espacio del préstamo';
    END IF;
  ELSIF TG_TABLE_NAME = 'pagos_esperados' THEN
    SELECT espacio_id INTO entidad_espacio
    FROM public.prestamos
    WHERE id = NEW.prestamo_id;

    IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
      RAISE EXCEPTION 'El préstamo no pertenece al mismo espacio del pago esperado';
    END IF;
  ELSIF TG_TABLE_NAME = 'pagos_prestamos' THEN
    SELECT espacio_id INTO entidad_espacio
    FROM public.prestamos
    WHERE id = NEW.prestamo_id;

    IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
      RAISE EXCEPTION 'El préstamo no pertenece al mismo espacio del cobro';
    END IF;

    SELECT espacio_id INTO entidad_espacio
    FROM public.cuentas_dinero
    WHERE id = NEW.cuenta_dinero_id;

    IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
      RAISE EXCEPTION 'La cuenta no pertenece al mismo espacio del cobro';
    END IF;

    IF NEW.pago_esperado_id IS NOT NULL THEN
      SELECT espacio_id INTO entidad_espacio
      FROM public.pagos_esperados
      WHERE id = NEW.pago_esperado_id;

      IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
        RAISE EXCEPTION 'El pago esperado no pertenece al mismo espacio del cobro';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'transacciones' THEN
    SELECT espacio_id INTO entidad_espacio
    FROM public.cuentas_dinero
    WHERE id = NEW.cuenta_dinero_id;

    IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
      RAISE EXCEPTION 'La cuenta no pertenece al mismo espacio de la transacción';
    END IF;

    IF NEW.categoria_id IS NOT NULL THEN
      SELECT espacio_id INTO entidad_espacio
      FROM public.categorias
      WHERE id = NEW.categoria_id;

      IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
        RAISE EXCEPTION 'La categoría no pertenece al mismo espacio de la transacción';
      END IF;
    END IF;

    IF NEW.prestamo_id IS NOT NULL THEN
      SELECT espacio_id INTO entidad_espacio
      FROM public.prestamos
      WHERE id = NEW.prestamo_id;

      IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
        RAISE EXCEPTION 'El préstamo no pertenece al mismo espacio de la transacción';
      END IF;
    END IF;

    IF NEW.pago_prestamo_id IS NOT NULL THEN
      SELECT espacio_id INTO entidad_espacio
      FROM public.pagos_prestamos
      WHERE id = NEW.pago_prestamo_id;

      IF entidad_espacio IS NULL OR entidad_espacio <> NEW.espacio_id THEN
        RAISE EXCEPTION 'El cobro no pertenece al mismo espacio de la transacción';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validar_espacio_prestamo ON public.prestamos;
CREATE TRIGGER validar_espacio_prestamo
  BEFORE INSERT OR UPDATE ON public.prestamos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_relaciones_mismo_espacio();

DROP TRIGGER IF EXISTS validar_espacio_pago_esperado ON public.pagos_esperados;
CREATE TRIGGER validar_espacio_pago_esperado
  BEFORE INSERT OR UPDATE ON public.pagos_esperados
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_relaciones_mismo_espacio();

DROP TRIGGER IF EXISTS validar_espacio_pago_prestamo ON public.pagos_prestamos;
CREATE TRIGGER validar_espacio_pago_prestamo
  BEFORE INSERT OR UPDATE ON public.pagos_prestamos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_relaciones_mismo_espacio();

DROP TRIGGER IF EXISTS validar_espacio_transaccion ON public.transacciones;
CREATE TRIGGER validar_espacio_transaccion
  BEFORE INSERT OR UPDATE ON public.transacciones
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_relaciones_mismo_espacio();
