import type { Usuario, RolUsuario } from '~/types'

// Composable para manejar la autenticación y roles de usuario
export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Estado del usuario actual con su perfil
  const usuarioActual = useState<Usuario | null>('usuario-actual', () => null)
  const cargandoPerfil = useState('cargando-perfil', () => false)

  // Cargar el perfil del usuario actual
  const cargarPerfil = async () => {
    if (!user.value) {
      usuarioActual.value = null
      return
    }

    cargandoPerfil.value = true

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) throw error
      usuarioActual.value = data as Usuario
    } catch (error) {
      console.error('Error cargando perfil:', error)
      usuarioActual.value = null
    } finally {
      cargandoPerfil.value = false
    }
  }

  // Verificar si el usuario tiene un rol específico
  const tieneRol = (roles: RolUsuario | RolUsuario[]): boolean => {
    if (!usuarioActual.value) return false

    const rolesArray = Array.isArray(roles) ? roles : [roles]
    return rolesArray.includes(usuarioActual.value.rol)
  }

  // Verificar si es administrador
  const esAdmin = computed(() => tieneRol('administrador'))

  // Verificar si es tesorero
  const esTesorero = computed(() => tieneRol('tesorero'))

  // Verificar si es encargado de compras
  const esEncargadoCompras = computed(() => tieneRol('encargado_compras'))

  // Verificar si puede aprobar compras (admin o tesorero)
  const puedeAprobarCompras = computed(() => tieneRol(['administrador', 'tesorero']))

  // Verificar si puede registrar ingresos (admin o tesorero)
  const puedeRegistrarIngresos = computed(() => tieneRol(['administrador', 'tesorero']))

  // Iniciar sesión con email y contraseña
  const iniciarSesion = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    await cargarPerfil()
    return data
  }

  // Cerrar sesión
  const cerrarSesion = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    usuarioActual.value = null
    await navigateTo('/login')
  }

  // Registrar nuevo usuario (usado con invitación)
  const registrarUsuario = async (
    email: string,
    password: string,
    nombre: string,
    apellido: string,
    rol: RolUsuario
  ) => {
    // Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    // Crear perfil en la tabla usuarios
    const { error: perfilError } = await supabase.from('usuarios').insert({
      id: authData.user.id,
      email,
      nombre,
      apellido,
      rol
    })

    if (perfilError) throw perfilError

    return authData
  }

  // Observar cambios en la autenticación
  watch(user, async (newUser) => {
    if (newUser) {
      await cargarPerfil()
    } else {
      usuarioActual.value = null
    }
  }, { immediate: true })

  return {
    user,
    usuarioActual,
    cargandoPerfil,
    esAdmin,
    esTesorero,
    esEncargadoCompras,
    puedeAprobarCompras,
    puedeRegistrarIngresos,
    tieneRol,
    cargarPerfil,
    iniciarSesion,
    cerrarSesion,
    registrarUsuario
  }
}
