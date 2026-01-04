 -- =============================================
-- CORRECCIONES DE POLÍTICAS RLS
-- Ejecutar este script en Supabase SQL Editor
-- =============================================

-- Eliminar políticas problemáticas de invitaciones
DROP POLICY IF EXISTS "Solo admin puede actualizar invitaciones" ON public.invitaciones;
DROP POLICY IF EXISTS "Admin puede ver todas las invitaciones" ON public.invitaciones;
DROP POLICY IF EXISTS "Cualquiera puede ver su invitación por token" ON public.invitaciones;
DROP POLICY IF EXISTS "Solo admin puede crear invitaciones" ON public.invitaciones;

-- Crear nuevas políticas más permisivas para invitaciones

-- Cualquiera puede ver invitaciones (necesario para verificar el token)
CREATE POLICY "Cualquiera puede ver invitaciones"
    ON public.invitaciones FOR SELECT
    USING (true);

-- Solo admin puede crear invitaciones
CREATE POLICY "Admin puede crear invitaciones"
    ON public.invitaciones FOR INSERT
    WITH CHECK (get_user_role() = 'administrador');

-- Cualquier usuario autenticado puede marcar una invitación como usada
CREATE POLICY "Usuario puede marcar invitación como usada"
    ON public.invitaciones FOR UPDATE
    USING (true)
    WITH CHECK (usado = true);

-- Solo admin puede eliminar invitaciones
CREATE POLICY "Admin puede eliminar invitaciones"
    ON public.invitaciones FOR DELETE
    USING (get_user_role() = 'administrador');

-- =============================================
-- CORREGIR POLÍTICAS DE USUARIOS
-- =============================================

-- Eliminar política problemática
DROP POLICY IF EXISTS "Solo admin puede insertar usuarios" ON public.usuarios;

-- Permitir que usuarios se inserten a sí mismos (para registro)
CREATE POLICY "Usuarios pueden registrarse"
    ON public.usuarios FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =============================================
-- VERIFICACIÓN
-- =============================================

-- Verificar que las políticas se crearon correctamente
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('invitaciones', 'usuarios')
ORDER BY tablename, policyname;
