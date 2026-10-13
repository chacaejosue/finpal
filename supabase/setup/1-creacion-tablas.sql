-- 1. CREACIÓN DE TIPOS, TABLAS Y RESTRICCIONES
-- Las restricciones de integridad se mantienen junto a cada tabla.

-- ============================================================================
-- FINPAL DATABASE SCHEMA (PostgreSQL / Supabase)
-- Esquema completo en español estándar de PostgreSQL con sintaxis idiómática
-- ============================================================================

-- Habilitar extensión para generación de UUIDs criptográficos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TIPOS ENUMERADOS (ENUMS)
-- ============================================================================

CREATE TYPE public.rol_espacio AS ENUM (
  'propietario'
);

CREATE TYPE public.estado_prestamo AS ENUM (
  'activo',
  'pagado',
  'atrasado',
  'cancelado'
);

CREATE TYPE public.tipo_cuenta_dinero AS ENUM (
  'efectivo',
  'banco',
  'billetera_movil',
  'ahorro',
  'otra'
);

CREATE TYPE public.tipo_transaccion AS ENUM (
  'ingreso',
  'gasto',
  'transferencia_entrada',
  'transferencia_salida',
  'ajuste',
  'entrega_prestamo',
  'pago_prestamo'
);

CREATE TYPE public.estado_pago_esperado AS ENUM (
  'pendiente',
  'parcialmente_pagado',
  'pagado',
  'atrasado',
  'cancelado'
);

-- ============================================================================
-- 2. TABLAS PRINCIPALES Y RESTRICCIONES
-- ============================================================================

-- 2.1 Perfiles de Usuario (Extensión de auth.users)
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_mostrado TEXT,
  color_acento TEXT NOT NULL DEFAULT 'verde'
    CHECK (color_acento IN ('verde', 'azul', 'violeta', 'naranja', 'rosa')),
  modo_oscuro BOOLEAN NOT NULL DEFAULT FALSE,
  tasa_interes_predeterminada NUMERIC(7,4) NOT NULL DEFAULT 3
    CHECK (tasa_interes_predeterminada >= 0 AND tasa_interes_predeterminada <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Espacios de Trabajo Aislados (Workspaces)
CREATE TABLE public.espacios_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL CHECK (char_length(trim(nombre)) BETWEEN 1 AND 100),
  codigo_moneda VARCHAR(3) NOT NULL DEFAULT 'BOB',
  zona_horaria TEXT NOT NULL DEFAULT 'America/La_Paz',
  propietario_id UUID NOT NULL REFERENCES public.perfiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Miembros y Permisos de Espacios
CREATE TABLE public.miembros_espacio (
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  rol public.rol_espacio NOT NULL DEFAULT 'propietario',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (espacio_id, usuario_id)
);

-- 2.4 Contactos / Deudores
CREATE TABLE public.contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL CHECK (char_length(trim(nombre)) BETWEEN 1 AND 150),
  telefono TEXT,
  email TEXT,
  notas TEXT,
  archivado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Cuentas de Dinero (Efectivo, Bancos, Billeteras)
CREATE TABLE public.cuentas_dinero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL CHECK (char_length(trim(nombre)) BETWEEN 1 AND 100),
  tipo public.tipo_cuenta_dinero NOT NULL,
  saldo_inicial NUMERIC(18,2) NOT NULL DEFAULT 0.00,
  codigo_moneda VARCHAR(3) NOT NULL DEFAULT 'BOB',
  es_activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Préstamos Entregados
CREATE TABLE public.prestamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  contacto_id UUID NOT NULL REFERENCES public.contactos(id),
  nombre TEXT NOT NULL CHECK (char_length(trim(nombre)) BETWEEN 1 AND 150),
  monto_principal NUMERIC(18,2) NOT NULL CHECK (monto_principal > 0),
  monto_capital_pagado NUMERIC(18,2) NOT NULL DEFAULT 0.00 CHECK (monto_capital_pagado >= 0),
  cobra_interes BOOLEAN NOT NULL DEFAULT TRUE,
  tasa_interes_mensual NUMERIC(7,4) NOT NULL DEFAULT 0.0000 CHECK (tasa_interes_mensual >= 0),
  base_interes TEXT NOT NULL DEFAULT 'saldo_pendiente' CHECK (base_interes = 'saldo_pendiente'),
  fecha_inicio DATE NOT NULL,
  dia_pago SMALLINT NOT NULL CHECK (dia_pago BETWEEN 1 AND 31),
  estado public.estado_prestamo NOT NULL DEFAULT 'activo',
  metodo_entrega TEXT,
  notas TEXT,
  archivado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_prestamo_interes CHECK (
    (cobra_interes AND tasa_interes_mensual > 0) OR
    (NOT cobra_interes AND tasa_interes_mensual = 0)
  )
);

-- 2.7 Pagos Esperados / Cuotas Vencidas
CREATE TABLE public.pagos_esperados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  prestamo_id UUID NOT NULL REFERENCES public.prestamos(id) ON DELETE CASCADE,
  fecha_vencimiento DATE NOT NULL,
  monto_esperado NUMERIC(18,2) NOT NULL CHECK (monto_esperado >= 0),
  estado public.estado_pago_esperado NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Pagos Realmente Cobrados
CREATE TABLE public.pagos_prestamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  prestamo_id UUID NOT NULL REFERENCES public.prestamos(id) ON DELETE CASCADE,
  pago_esperado_id UUID REFERENCES public.pagos_esperados(id),
  recibido_en DATE NOT NULL,
  fecha_esperada DATE,
  monto_total NUMERIC(18,2) NOT NULL CHECK (monto_total > 0),
  monto_principal NUMERIC(18,2) NOT NULL DEFAULT 0.00 CHECK (monto_principal >= 0),
  monto_interes NUMERIC(18,2) NOT NULL DEFAULT 0.00 CHECK (monto_interes >= 0),
  cuenta_dinero_id UUID NOT NULL REFERENCES public.cuentas_dinero(id),
  metodo_pago TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_desglose_pago CHECK (monto_principal + monto_interes = monto_total)
);

-- 2.9 Categorías de Movimiento
CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL CHECK (char_length(trim(nombre)) BETWEEN 1 AND 100),
  tipo public.tipo_transaccion NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_categoria_espacio_nombre_tipo UNIQUE (espacio_id, nombre, tipo)
);

-- 2.10 Transacciones y Flujos de Caja
CREATE TABLE public.transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id UUID NOT NULL REFERENCES public.espacios_trabajo(id) ON DELETE CASCADE,
  cuenta_dinero_id UUID NOT NULL REFERENCES public.cuentas_dinero(id),
  tipo public.tipo_transaccion NOT NULL,
  monto NUMERIC(18,2) NOT NULL CHECK (monto > 0),
  ocurrido_en DATE NOT NULL,
  ajuste_sentido TEXT CHECK (ajuste_sentido IN ('sumar', 'restar')),
  categoria_id UUID REFERENCES public.categorias(id),
  descripcion TEXT,
  prestamo_id UUID REFERENCES public.prestamos(id),
  pago_prestamo_id UUID REFERENCES public.pagos_prestamos(id),
  transfer_group_id UUID,
  idempotency_key UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
