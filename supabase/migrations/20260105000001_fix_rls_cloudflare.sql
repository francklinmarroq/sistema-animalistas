-- =============================================
-- FIX: Error RLS 42501 en producción (Cloudflare)
-- El problema: auth.uid() es NULL después de signUp()
-- porque la sesión no se establece inmediatamente
-- Solución: Función RPC con SECURITY DEFINER
-- =============================================

-- Crear función para crear perfil de usuario
-- SECURITY DEFINER permite ejecutar con privilegios del owner (postgres)
-- Esto bypasea las políticas RLS de forma controlada
CREATE OR REPLACE FUNCTION public.crear_perfil_usuario(
  user_id UUID,
  user_email TEXT,
  user_nombre TEXT,
  user_apellido TEXT,
  user_rol TEXT DEFAULT 'voluntario'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resultado JSONB;
BEGIN
  -- Validar que el rol sea válido
  IF user_rol NOT IN ('administrador', 'tesorero', 'encargado_compras', 'voluntario') THEN
    RAISE EXCEPTION 'Rol inválido: %', user_rol;
  END IF;

  -- Caso especial: Si el rol es 'administrador', verificar que no exista otro admin
  -- Solo permite crear admin si no hay ninguno (setup inicial)
  IF user_rol = 'administrador' THEN
    IF EXISTS (SELECT 1 FROM public.usuarios WHERE rol = 'administrador') THEN
      RAISE EXCEPTION 'Ya existe un administrador en el sistema';
    END IF;
  END IF;

  -- Insertar el perfil
  INSERT INTO public.usuarios (id, email, nombre, apellido, rol)
  VALUES (user_id, user_email, user_nombre, user_apellido, user_rol)
  ON CONFLICT (id) DO NOTHING;

  -- Retornar el usuario creado
  SELECT to_jsonb(u.*) INTO resultado
  FROM public.usuarios u
  WHERE u.id = user_id;

  RETURN resultado;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados y anónimos
-- (necesario para el registro)
GRANT EXECUTE ON FUNCTION public.crear_perfil_usuario TO authenticated;
GRANT EXECUTE ON FUNCTION public.crear_perfil_usuario TO anon;

-- =============================================
-- OPCIÓN ALTERNATIVA: Trigger automático
-- Si prefieres que el perfil se cree automáticamente
-- al registrar un usuario en auth.users
-- =============================================

-- Función para el trigger (crea perfil básico automáticamente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo crear si no existe ya (evita duplicados)
  INSERT INTO public.usuarios (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'voluntario')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- NOTA: El trigger en auth.users requiere acceso a ese schema
-- Descomentar si tienes acceso y prefieres esta opción:
--
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- MANTENER POLÍTICA RLS EXISTENTE COMO FALLBACK
-- =============================================

-- Eliminar política anterior si existe
DROP POLICY IF EXISTS "Usuarios pueden registrarse" ON public.usuarios;

-- Crear política más permisiva para el registro
-- Permite insertar si:
-- 1. El usuario está autenticado y es su propio ID, O
-- 2. No hay ningún administrador aún (setup inicial)
CREATE POLICY "Usuarios pueden registrarse"
    ON public.usuarios FOR INSERT
    WITH CHECK (
      auth.uid() = id
      OR
      NOT EXISTS (SELECT 1 FROM public.usuarios WHERE rol = 'administrador')
    );

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Migración completada exitosamente' as status;
