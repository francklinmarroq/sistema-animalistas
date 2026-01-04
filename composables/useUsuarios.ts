import type { Usuario, Invitacion, FormInvitacion, RolUsuario } from '~/types'

// Composable para manejar usuarios e invitaciones (solo Admin)
export const useUsuarios = () => {
  const supabase = useSupabaseClient()

  // Estado
  const usuarios = useState<Usuario[]>('usuarios', () => [])
  const invitaciones = useState<Invitacion[]>('invitaciones', () => [])
  const cargando = useState('cargando-usuarios', () => false)

  // Cargar todos los usuarios
  const cargarUsuarios = async () => {
    cargando.value = true

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre')

      if (error) throw error
      usuarios.value = data as Usuario[]
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      cargando.value = false
    }
  }

  // Cargar todas las invitaciones
  const cargarInvitaciones = async () => {
    cargando.value = true

    try {
      const { data, error } = await supabase
        .from('invitaciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      invitaciones.value = data as Invitacion[]
    } catch (error) {
      console.error('Error cargando invitaciones:', error)
    } finally {
      cargando.value = false
    }
  }

  // Usuarios por rol
  const usuariosPorRol = (rol: RolUsuario) => {
    return usuarios.value.filter(u => u.rol === rol)
  }

  // Usuarios activos
  const usuariosActivos = computed(() =>
    usuarios.value.filter(u => u.activo)
  )

  // Invitaciones pendientes
  const invitacionesPendientes = computed(() =>
    invitaciones.value.filter(i => !i.usado && new Date(i.fecha_expiracion) > new Date())
  )

  // Crear una invitación
  const crearInvitacion = async (datos: FormInvitacion, invitadoPor: string) => {
    const { data, error } = await supabase
      .from('invitaciones')
      .insert({
        email: datos.email,
        rol: datos.rol,
        invitado_por: invitadoPor
      })
      .select()
      .single()

    if (error) throw error

    invitaciones.value.unshift(data as Invitacion)
    return data
  }

  // Verificar una invitación por token
  const verificarInvitacion = async (token: string): Promise<Invitacion | null> => {
    const { data, error } = await supabase
      .from('invitaciones')
      .select('*')
      .eq('token', token)
      .eq('usado', false)
      .gte('fecha_expiracion', new Date().toISOString())
      .single()

    if (error) return null
    return data as Invitacion
  }

  // Marcar invitación como usada
  const marcarInvitacionUsada = async (id: string) => {
    const { error } = await supabase
      .from('invitaciones')
      .update({ usado: true })
      .eq('id', id)

    if (error) throw error

    const index = invitaciones.value.findIndex(i => i.id === id)
    if (index !== -1) {
      invitaciones.value[index].usado = true
    }
  }

  // Actualizar rol de un usuario
  const actualizarRolUsuario = async (id: string, rol: RolUsuario) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ rol })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const index = usuarios.value.findIndex(u => u.id === id)
    if (index !== -1) {
      usuarios.value[index] = data as Usuario
    }

    return data
  }

  // Desactivar usuario
  const desactivarUsuario = async (id: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const index = usuarios.value.findIndex(u => u.id === id)
    if (index !== -1) {
      usuarios.value[index] = data as Usuario
    }

    return data
  }

  // Activar usuario
  const activarUsuario = async (id: string) => {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ activo: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const index = usuarios.value.findIndex(u => u.id === id)
    if (index !== -1) {
      usuarios.value[index] = data as Usuario
    }

    return data
  }

  // Eliminar invitación
  const eliminarInvitacion = async (id: string) => {
    const { error } = await supabase
      .from('invitaciones')
      .delete()
      .eq('id', id)

    if (error) throw error

    const index = invitaciones.value.findIndex(i => i.id === id)
    if (index !== -1) {
      invitaciones.value.splice(index, 1)
    }
  }

  return {
    usuarios,
    invitaciones,
    usuariosActivos,
    invitacionesPendientes,
    cargando,
    cargarUsuarios,
    cargarInvitaciones,
    usuariosPorRol,
    crearInvitacion,
    verificarInvitacion,
    marcarInvitacionUsada,
    actualizarRolUsuario,
    desactivarUsuario,
    activarUsuario,
    eliminarInvitacion
  }
}
