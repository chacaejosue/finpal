-- 3. ÍNDICES Y SEGURIDAD RLS

-- 4. ÍNDICES DE RENDIMIENTO DE BÚSQUEDA
-- ============================================================================

CREATE INDEX idx_contactos_espacio ON public.contactos(espacio_id);
CREATE INDEX idx_prestamos_espacio_estado ON public.prestamos(espacio_id, estado);
CREATE INDEX idx_pagos_esperados_espacio_vencimiento ON public.pagos_esperados(espacio_id, fecha_vencimiento);
CREATE INDEX idx_pagos_prestamos_espacio_recibido ON public.pagos_prestamos(espacio_id, recibido_en);
CREATE INDEX idx_cuentas_dinero_espacio ON public.cuentas_dinero(espacio_id);
CREATE INDEX idx_transacciones_espacio_ocurrido ON public.transacciones(espacio_id, ocurrido_en);

-- ============================================================================
-- 5. SEGURIDAD Y POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacios_trabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.miembros_espacio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas_dinero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_esperados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos_prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

-- Políticas de Perfiles
CREATE POLICY "Usuarios leen su propio perfil"
  ON public.perfiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Usuarios actualizan su propio perfil"
  ON public.perfiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Políticas de Espacios de Trabajo
CREATE POLICY "Miembros ven sus espacios"
  ON public.espacios_trabajo FOR SELECT
  USING (public.es_miembro_espacio(id));

CREATE POLICY "Usuarios crean sus espacios"
  ON public.espacios_trabajo FOR INSERT
  WITH CHECK (propietario_id = auth.uid());

CREATE POLICY "Miembros ven sus membresías"
  ON public.miembros_espacio FOR SELECT
  USING (public.es_miembro_espacio(espacio_id));

-- Políticas de Contactos
CREATE POLICY "Miembros ven contactos"
  ON public.contactos FOR SELECT
  USING (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros crean contactos"
  ON public.contactos FOR INSERT
  WITH CHECK (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros actualizan contactos"
  ON public.contactos FOR UPDATE
  USING (public.es_miembro_espacio(espacio_id))
  WITH CHECK (public.es_miembro_espacio(espacio_id));

-- Políticas de Cuentas de Dinero
CREATE POLICY "Miembros ven cuentas de dinero"
  ON public.cuentas_dinero FOR SELECT
  USING (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros crean cuentas de dinero"
  ON public.cuentas_dinero FOR INSERT
  WITH CHECK (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros actualizan cuentas de dinero"
  ON public.cuentas_dinero FOR UPDATE
  USING (public.es_miembro_espacio(espacio_id))
  WITH CHECK (public.es_miembro_espacio(espacio_id));

-- Políticas de Préstamos
CREATE POLICY "Miembros ven préstamos"
  ON public.prestamos FOR SELECT
  USING (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros crean préstamos"
  ON public.prestamos FOR INSERT
  WITH CHECK (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros actualizan préstamos"
  ON public.prestamos FOR UPDATE
  USING (public.es_miembro_espacio(espacio_id))
  WITH CHECK (public.es_miembro_espacio(espacio_id));

-- Políticas de Pagos Esperados
CREATE POLICY "Miembros ven pagos esperados"
  ON public.pagos_esperados FOR SELECT
  USING (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros crean pagos esperados"
  ON public.pagos_esperados FOR INSERT
  WITH CHECK (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros actualizan pagos esperados"
  ON public.pagos_esperados FOR UPDATE
  USING (public.es_miembro_espacio(espacio_id))
  WITH CHECK (public.es_miembro_espacio(espacio_id));

-- Políticas de Pagos de Préstamos
CREATE POLICY "Miembros ven pagos de préstamos"
  ON public.pagos_prestamos FOR SELECT
  USING (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros crean pagos de préstamos"
  ON public.pagos_prestamos FOR INSERT
  WITH CHECK (public.es_miembro_espacio(espacio_id));

-- Políticas de Categorías
CREATE POLICY "Miembros ven categorías"
  ON public.categorias FOR SELECT
  USING (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros crean categorías"
  ON public.categorias FOR INSERT
  WITH CHECK (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros actualizan categorías"
  ON public.categorias FOR UPDATE
  USING (public.es_miembro_espacio(espacio_id))
  WITH CHECK (public.es_miembro_espacio(espacio_id));

-- Políticas de Transacciones
CREATE POLICY "Miembros ven transacciones"
  ON public.transacciones FOR SELECT
  USING (public.es_miembro_espacio(espacio_id));

CREATE POLICY "Miembros crean transacciones"
  ON public.transacciones FOR INSERT
  WITH CHECK (public.es_miembro_espacio(espacio_id));
