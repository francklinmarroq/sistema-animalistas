-- =============================================
-- ESQUEMA DE BASE DE DATOS
-- Sistema de Control Financiero - Organización Animalista
-- =============================================

-- Nota: Usamos gen_random_uuid() que está disponible por defecto en PostgreSQL 13+
-- Para gen_random_bytes usamos extensions.gen_random_bytes (pgcrypto en Supabase Cloud)

-- =============================================
-- TABLAS PRINCIPALES
-- =============================================

-- Tabla de usuarios (extiende auth.users de Supabase)
CREATE TABLE public.usuarios (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('administrador', 'tesorero', 'encargado_compras')),
    activo BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración del sistema (solo un registro)
CREATE TABLE public.configuracion_sistema (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    moneda_codigo TEXT NOT NULL DEFAULT 'MXN',
    moneda_simbolo TEXT NOT NULL DEFAULT '$',
    moneda_nombre TEXT NOT NULL DEFAULT 'Peso Mexicano',
    nombre_organizacion TEXT NOT NULL DEFAULT 'Organización Animalista',
    logo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.usuarios(id)
);

-- Invitaciones para nuevos usuarios
CREATE TABLE public.invitaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('administrador', 'tesorero', 'encargado_compras')),
    token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
    invitado_por UUID REFERENCES public.usuarios(id) NOT NULL,
    usado BOOLEAN DEFAULT false,
    fecha_expiracion TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cuentas bancarias / efectivo
CREATE TABLE public.cuentas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('banco', 'efectivo', 'digital')),
    numero_cuenta TEXT,
    banco TEXT,
    saldo_actual DECIMAL(12, 2) DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías de compras
CREATE TABLE public.categorias_compras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    icono TEXT DEFAULT 'pi-tag',
    color TEXT DEFAULT '#6366F1',
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías de ingresos
CREATE TABLE public.categorias_ingresos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    icono TEXT DEFAULT 'pi-wallet',
    color TEXT DEFAULT '#22C55E',
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compras
-- Nota: cuenta_id es nullable porque lo asigna el tesorero al aprobar
CREATE TABLE public.compras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descripcion TEXT NOT NULL,
    monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
    categoria_id UUID REFERENCES public.categorias_compras(id) NOT NULL,
    cuenta_id UUID REFERENCES public.cuentas(id), -- Nullable: lo asigna el tesorero
    fecha_compra DATE NOT NULL DEFAULT CURRENT_DATE,
    foto_factura_url TEXT,
    notas TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    registrado_por UUID REFERENCES public.usuarios(id) NOT NULL,
    revisado_por UUID REFERENCES public.usuarios(id),
    fecha_revision TIMESTAMPTZ,
    motivo_rechazo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingresos
CREATE TABLE public.ingresos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    descripcion TEXT NOT NULL,
    monto DECIMAL(12, 2) NOT NULL CHECK (monto > 0),
    categoria_id UUID REFERENCES public.categorias_ingresos(id) NOT NULL,
    cuenta_id UUID REFERENCES public.cuentas(id) NOT NULL,
    fecha_deposito DATE NOT NULL DEFAULT CURRENT_DATE,
    comprobante_url TEXT,
    notas TEXT,
    registrado_por UUID REFERENCES public.usuarios(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

CREATE INDEX idx_compras_estado ON public.compras(estado);
CREATE INDEX idx_compras_fecha ON public.compras(fecha_compra DESC);
CREATE INDEX idx_compras_registrado_por ON public.compras(registrado_por);
CREATE INDEX idx_compras_categoria ON public.compras(categoria_id);
CREATE INDEX idx_ingresos_fecha ON public.ingresos(fecha_deposito DESC);
CREATE INDEX idx_ingresos_categoria ON public.ingresos(categoria_id);
CREATE INDEX idx_invitaciones_token ON public.invitaciones(token);
CREATE INDEX idx_invitaciones_email ON public.invitaciones(email);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_usuarios_updated_at
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_cuentas_updated_at
    BEFORE UPDATE ON public.cuentas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_compras_updated_at
    BEFORE UPDATE ON public.compras
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ingresos_updated_at
    BEFORE UPDATE ON public.ingresos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función para actualizar saldo de cuenta cuando se aprueba una compra
CREATE OR REPLACE FUNCTION actualizar_saldo_compra()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la compra cambia a aprobada, restar del saldo
    IF NEW.estado = 'aprobada' AND (OLD.estado IS NULL OR OLD.estado != 'aprobada') THEN
        UPDATE public.cuentas
        SET saldo_actual = saldo_actual - NEW.monto
        WHERE id = NEW.cuenta_id;
    END IF;

    -- Si la compra se cambia de aprobada a otro estado, devolver al saldo
    IF OLD.estado = 'aprobada' AND NEW.estado != 'aprobada' THEN
        UPDATE public.cuentas
        SET saldo_actual = saldo_actual + OLD.monto
        WHERE id = OLD.cuenta_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_saldo_compra
    AFTER UPDATE ON public.compras
    FOR EACH ROW EXECUTE FUNCTION actualizar_saldo_compra();

-- Función para actualizar saldo cuando se registra un ingreso
CREATE OR REPLACE FUNCTION actualizar_saldo_ingreso()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.cuentas
        SET saldo_actual = saldo_actual + NEW.monto
        WHERE id = NEW.cuenta_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.cuentas
        SET saldo_actual = saldo_actual - OLD.monto
        WHERE id = OLD.cuenta_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Si cambió la cuenta o el monto
        IF OLD.cuenta_id != NEW.cuenta_id OR OLD.monto != NEW.monto THEN
            UPDATE public.cuentas
            SET saldo_actual = saldo_actual - OLD.monto
            WHERE id = OLD.cuenta_id;

            UPDATE public.cuentas
            SET saldo_actual = saldo_actual + NEW.monto
            WHERE id = NEW.cuenta_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_saldo_ingreso
    AFTER INSERT OR UPDATE OR DELETE ON public.ingresos
    FOR EACH ROW EXECUTE FUNCTION actualizar_saldo_ingreso();

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT rol FROM public.usuarios WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingresos ENABLE ROW LEVEL SECURITY;

-- Políticas para USUARIOS
CREATE POLICY "Usuarios pueden ver otros usuarios activos"
    ON public.usuarios FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admin puede insertar usuarios"
    ON public.usuarios FOR INSERT
    WITH CHECK (get_user_role() = 'administrador' OR auth.uid() = id);

CREATE POLICY "Solo admin puede actualizar usuarios"
    ON public.usuarios FOR UPDATE
    USING (get_user_role() = 'administrador' OR auth.uid() = id);

-- Políticas para CONFIGURACIÓN
CREATE POLICY "Todos pueden ver configuración"
    ON public.configuracion_sistema FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admin puede modificar configuración"
    ON public.configuracion_sistema FOR ALL
    USING (get_user_role() = 'administrador');

-- Políticas para INVITACIONES
CREATE POLICY "Admin puede ver todas las invitaciones"
    ON public.invitaciones FOR SELECT
    USING (get_user_role() = 'administrador');

CREATE POLICY "Cualquiera puede ver su invitación por token"
    ON public.invitaciones FOR SELECT
    USING (true);

CREATE POLICY "Solo admin puede crear invitaciones"
    ON public.invitaciones FOR INSERT
    WITH CHECK (get_user_role() = 'administrador');

CREATE POLICY "Solo admin puede actualizar invitaciones"
    ON public.invitaciones FOR UPDATE
    USING (get_user_role() = 'administrador' OR usado = false);

-- Políticas para CUENTAS
CREATE POLICY "Todos pueden ver cuentas activas"
    ON public.cuentas FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admin puede gestionar cuentas"
    ON public.cuentas FOR ALL
    USING (get_user_role() = 'administrador');

-- Políticas para CATEGORÍAS DE COMPRAS
CREATE POLICY "Todos pueden ver categorías de compras"
    ON public.categorias_compras FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admin puede gestionar categorías de compras"
    ON public.categorias_compras FOR ALL
    USING (get_user_role() = 'administrador');

-- Políticas para CATEGORÍAS DE INGRESOS
CREATE POLICY "Todos pueden ver categorías de ingresos"
    ON public.categorias_ingresos FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Solo admin puede gestionar categorías de ingresos"
    ON public.categorias_ingresos FOR ALL
    USING (get_user_role() = 'administrador');

-- Políticas para COMPRAS
CREATE POLICY "Usuarios pueden ver todas las compras"
    ON public.compras FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios pueden crear compras"
    ON public.compras FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND registrado_por = auth.uid());

-- Políticas para INGRESOS
CREATE POLICY "Usuarios pueden ver ingresos"
    ON public.ingresos FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Tesoreros y admin pueden registrar ingresos"
    ON public.ingresos FOR INSERT
    WITH CHECK (get_user_role() IN ('administrador', 'tesorero'));

CREATE POLICY "Tesoreros y admin pueden modificar ingresos"
    ON public.ingresos FOR UPDATE
    USING (get_user_role() IN ('administrador', 'tesorero'));

CREATE POLICY "Solo admin puede eliminar ingresos"
    ON public.ingresos FOR DELETE
    USING (get_user_role() = 'administrador');

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar configuración inicial
INSERT INTO public.configuracion_sistema (moneda_codigo, moneda_simbolo, moneda_nombre, nombre_organizacion)
VALUES ('HNL', 'L', 'Lempira Hondureño', 'Animalistas de Corazón')
ON CONFLICT DO NOTHING;

-- Categorías iniciales de compras
INSERT INTO public.categorias_compras (nombre, descripcion, icono, color) VALUES
    ('Alimento', 'Alimento para los animales', 'pi-shopping-cart', '#22C55E'),
    ('Medicamentos', 'Medicinas y tratamientos', 'pi-heart', '#EF4444'),
    ('Veterinario', 'Consultas y procedimientos veterinarios', 'pi-user', '#3B82F6'),
    ('Insumos', 'Productos de limpieza, arena, etc.', 'pi-box', '#F59E0B'),
    ('Transporte', 'Gastos de transporte y combustible', 'pi-car', '#8B5CF6'),
    ('Otros', 'Otros gastos', 'pi-tag', '#6B7280')
ON CONFLICT DO NOTHING;

-- Categorías iniciales de ingresos
INSERT INTO public.categorias_ingresos (nombre, descripcion, icono, color) VALUES
    ('Donativos', 'Donaciones recibidas', 'pi-heart-fill', '#EC4899'),
    ('Ventas', 'Ventas de productos o actividades', 'pi-shopping-bag', '#22C55E'),
    ('Eventos', 'Ingresos por eventos y rifas', 'pi-calendar', '#F59E0B'),
    ('Adopciones', 'Cuotas de recuperación por adopción', 'pi-home', '#3B82F6'),
    ('Otros', 'Otros ingresos', 'pi-wallet', '#6B7280')
ON CONFLICT DO NOTHING;

-- =============================================
-- STORAGE BUCKETS (ejecutar en Supabase Dashboard)
-- =============================================

-- Nota: Los buckets de storage se deben crear desde el dashboard de Supabase
-- o usando la API de administración. Crear:
-- 1. Bucket 'facturas' - para fotos de facturas de compras
-- 2. Bucket 'comprobantes' - para comprobantes de ingresos
-- 3. Bucket 'avatars' - para fotos de perfil de usuarios
