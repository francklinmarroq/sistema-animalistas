
-- Quitar el constraint NOT NULL de cuenta_id
ALTER TABLE public.compras
ALTER COLUMN cuenta_id DROP NOT NULL;

-- Actualizar la política de actualización para permitir
-- que el encargado edite sus compras rechazadas
DROP POLICY IF EXISTS "Tesoreros y admin pueden aprobar/rechazar compras" ON public.compras;

CREATE POLICY "Usuarios pueden actualizar compras"
    ON public.compras FOR UPDATE
    USING (
        -- Tesoreros y admin pueden aprobar/rechazar
        get_user_role() IN ('administrador', 'tesorero') OR
        -- El que registró puede editar si está pendiente o rechazada
        (registrado_por = auth.uid() AND estado IN ('pendiente', 'rechazada'))
    );

-- Verificar el cambio
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'compras' AND column_name = 'cuenta_id';

