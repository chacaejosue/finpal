-- 6. CUOTAS ANTI-ABUSO (DENIAL OF WALLET) Y DERECHO AL OLVIDO
-- ============================================================================
-- Este script complementa la seguridad en servidor con defensas directamente
-- en PostgreSQL para que ningún atacante pueda inundar la base de datos ni
-- siquiera invocando la API de Supabase (PostgREST) directamente con su JWT.

-- 1. POLÍTICAS RLS DE ELIMINACIÓN (FOR DELETE) FALTANTES
-- ============================================================================

DROP POLICY IF EXISTS "Usuarios eliminan su propio perfil" ON public.perfiles;
CREATE POLICY "Usuarios eliminan su propio perfil"
  ON public.perfiles FOR DELETE
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Propietarios eliminan sus espacios" ON public.espacios_trabajo;
CREATE POLICY "Propietarios eliminan sus espacios"
  ON public.espacios_trabajo FOR DELETE
  USING (propietario_id = auth.uid());

DROP POLICY IF EXISTS "Miembros eliminan contactos" ON public.contactos;
CREATE POLICY "Miembros eliminan contactos"
  ON public.contactos FOR DELETE
  USING (public.es_miembro_espacio(espacio_id));

DROP POLICY IF EXISTS "Miembros eliminan cuentas de dinero" ON public.cuentas_dinero;
CREATE POLICY "Miembros eliminan cuentas de dinero"
  ON public.cuentas_dinero FOR DELETE
  USING (public.es_miembro_espacio(espacio_id));

DROP POLICY IF EXISTS "Miembros eliminan préstamos" ON public.prestamos;
CREATE POLICY "Miembros eliminan préstamos"
  ON public.prestamos FOR DELETE
  USING (public.es_miembro_espacio(espacio_id));

DROP POLICY IF EXISTS "Miembros eliminan transacciones" ON public.transacciones;
CREATE POLICY "Miembros eliminan transacciones"
  ON public.transacciones FOR DELETE
  USING (public.es_miembro_espacio(espacio_id));

-- 2. TRIGGERS DE CUOTA MÁXIMA POR USUARIO Y ESPACIO (ANTI-FLOOD / ANTI-DoW)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validar_cuotas_anti_abuso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_actual BIGINT;
BEGIN
  IF TG_TABLE_NAME = 'espacios_trabajo' THEN
    SELECT COUNT(*) INTO total_actual
    FROM public.espacios_trabajo
    WHERE propietario_id = NEW.propietario_id;

    IF total_actual >= 5 THEN
      RAISE EXCEPTION 'Límite de seguridad alcanzado: máximo 5 espacios de trabajo por usuario.';
    END IF;

  ELSIF TG_TABLE_NAME = 'contactos' THEN
    SELECT COUNT(*) INTO total_actual
    FROM public.contactos
    WHERE espacio_id = NEW.espacio_id;

    IF total_actual >= 1000 THEN
      RAISE EXCEPTION 'Límite de seguridad alcanzado: máximo 1,000 contactos por espacio de trabajo.';
    END IF;

  ELSIF TG_TABLE_NAME = 'prestamos' THEN
    SELECT COUNT(*) INTO total_actual
    FROM public.prestamos
    WHERE espacio_id = NEW.espacio_id;

    IF total_actual >= 1000 THEN
      RAISE EXCEPTION 'Límite de seguridad alcanzado: máximo 1,000 préstamos por espacio de trabajo.';
    END IF;

  ELSIF TG_TABLE_NAME = 'transacciones' THEN
    SELECT COUNT(*) INTO total_actual
    FROM public.transacciones
    WHERE espacio_id = NEW.espacio_id;

    IF total_actual >= 10000 THEN
      RAISE EXCEPTION 'Límite de seguridad alcanzado: máximo 10,000 transacciones por espacio de trabajo.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cuota_espacios ON public.espacios_trabajo;
CREATE TRIGGER trg_cuota_espacios
  BEFORE INSERT ON public.espacios_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_cuotas_anti_abuso();

DROP TRIGGER IF EXISTS trg_cuota_contactos ON public.contactos;
CREATE TRIGGER trg_cuota_contactos
  BEFORE INSERT ON public.contactos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_cuotas_anti_abuso();

DROP TRIGGER IF EXISTS trg_cuota_prestamos ON public.prestamos;
CREATE TRIGGER trg_cuota_prestamos
  BEFORE INSERT ON public.prestamos
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_cuotas_anti_abuso();

DROP TRIGGER IF EXISTS trg_cuota_transacciones ON public.transacciones;
CREATE TRIGGER trg_cuota_transacciones
  BEFORE INSERT ON public.transacciones
  FOR EACH ROW
  EXECUTE FUNCTION public.validar_cuotas_anti_abuso();

-- 3. FUNCIÓN RPC PARA EJERCER EL DERECHO AL OLVIDO (BOLIVIA / CCPA / GDPR)
-- ============================================================================
-- Elimina todos los espacios de trabajo del usuario autenticado, su perfil
-- y su registro en auth.users de manera irreversible.

CREATE OR REPLACE FUNCTION public.fn_eliminar_mi_cuenta()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Eliminar todos los espacios donde el usuario es propietario (borra en cascada contactos, préstamos, pagos, cuentas y transacciones)
  DELETE FROM public.espacios_trabajo WHERE propietario_id = v_uid;

  -- Eliminar perfil público
  DELETE FROM public.perfiles WHERE id = v_uid;

  -- Eliminar usuario del esquema auth de Supabase
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_eliminar_mi_cuenta() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_eliminar_mi_cuenta() TO authenticated;
