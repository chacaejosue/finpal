-- 2. FUNCIONES Y TRIGGERS

-- 3. FUNCIONES PL/pgSQL Y TRIGGERS DE AUTOMATIZACIÓN
-- ============================================================================

-- Function: Asignar Propietario del Espacio automáticamente
CREATE OR REPLACE FUNCTION public.agregar_propietario_espacio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.miembros_espacio (espacio_id, usuario_id, rol)
  VALUES (NEW.id, NEW.propietario_id, 'propietario');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agregar_propietario_espacio
  AFTER INSERT ON public.espacios_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION public.agregar_propietario_espacio();

-- Function: Validar Membresía en RLS
CREATE OR REPLACE FUNCTION public.es_miembro_espacio(target_espacio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.miembros_espacio
    WHERE espacio_id = target_espacio_id AND usuario_id = auth.uid()
  );
$$;

-- Function: Actualizar automáticamente la columna updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER contactos_updated_at
  BEFORE UPDATE ON public.contactos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER cuentas_updated_at
  BEFORE UPDATE ON public.cuentas_dinero
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER prestamos_updated_at
  BEFORE UPDATE ON public.prestamos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Function: Manejar nuevo usuario registrado en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_mostrado)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
