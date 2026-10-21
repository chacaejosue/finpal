-- 5. TABLA DE AUDITORÍA DE CAMBIOS (HISTORIAL DE EDICIONES)
-- Permite auditar correcciones de tipeo, cambios de nombres, notas, etc.

CREATE TABLE IF NOT EXISTS public.auditoria_cambios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  entidad TEXT NOT NULL, -- ej. 'cuentas_dinero', 'prestamos', 'contactos', 'notas'
  entidad_id UUID NOT NULL,
  campo_modificado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_nuevo TEXT,
  motivo TEXT,
  usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.auditoria_cambios ENABLE ROW LEVEL SECURITY;

-- Política: Los miembros del espacio pueden ver los cambios auditados de su espacio
CREATE POLICY "Miembros pueden ver auditoria del espacio"
  ON public.auditoria_cambios
  FOR SELECT
  TO authenticated
  USING (public.es_miembro_espacio(espacio_id));

-- Política: Los miembros pueden registrar cambios auditados
CREATE POLICY "Miembros pueden registrar auditoria"
  ON public.auditoria_cambios
  FOR INSERT
  TO authenticated
  WITH CHECK (public.es_miembro_espacio(espacio_id));

-- Índice para consultas rápidas por entidad y espacio
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON public.auditoria_cambios(espacio_id, entidad, entidad_id, created_at DESC);
