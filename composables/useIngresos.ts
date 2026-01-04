import type { Ingreso, FormIngreso } from '~/types'

// Composable para manejar los ingresos
export const useIngresos = () => {
  const supabase = useSupabaseClient()
  const { usuarioActual } = useAuth()

  // Estado de los ingresos
  const ingresos = useState<Ingreso[]>('ingresos', () => [])
  const cargando = useState('cargando-ingresos', () => false)

  // Cargar todos los ingresos con relaciones
  const cargarIngresos = async (filtros?: {
    categoria_id?: string
    cuenta_id?: string
    desde?: string
    hasta?: string
  }) => {
    cargando.value = true

    try {
      let query = supabase
        .from('ingresos')
        .select(`
          *,
          categoria:categorias_ingresos(*),
          cuenta:cuentas(*),
          usuario_registro:usuarios!ingresos_registrado_por_fkey(*)
        `)
        .order('fecha_deposito', { ascending: false })

      // Aplicar filtros
      if (filtros?.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id)
      }
      if (filtros?.cuenta_id) {
        query = query.eq('cuenta_id', filtros.cuenta_id)
      }
      if (filtros?.desde) {
        query = query.gte('fecha_deposito', filtros.desde)
      }
      if (filtros?.hasta) {
        query = query.lte('fecha_deposito', filtros.hasta)
      }

      const { data, error } = await query

      if (error) throw error
      ingresos.value = data as Ingreso[]
    } catch (error) {
      console.error('Error cargando ingresos:', error)
    } finally {
      cargando.value = false
    }
  }

  // Total de ingresos
  const totalIngresos = computed(() =>
    ingresos.value.reduce((sum, i) => sum + Number(i.monto), 0)
  )

  // Subir comprobante (foto o PDF)
  const subirComprobante = async (archivo: File): Promise<string | null> => {
    try {
      const extension = archivo.name.split('.').pop()
      const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
      const ruta = `${usuarioActual.value?.id}/${nombreArchivo}`

      const { error } = await supabase.storage
        .from('comprobantes')
        .upload(ruta, archivo)

      if (error) {
        console.error('Error subiendo comprobante:', error)
        if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
          console.warn('El bucket "comprobantes" no existe en Supabase Storage')
          return null
        }
        throw error
      }

      const { data } = supabase.storage.from('comprobantes').getPublicUrl(ruta)
      return data.publicUrl
    } catch (err) {
      console.error('Error en subirComprobante:', err)
      return null
    }
  }

  // Registrar un nuevo ingreso
  const registrarIngreso = async (datos: FormIngreso) => {
    let comprobanteUrl: string | null = null

    // Subir comprobante si existe
    if (datos.comprobante) {
      comprobanteUrl = await subirComprobante(datos.comprobante)
    }

    const { data, error } = await supabase
      .from('ingresos')
      .insert({
        descripcion: datos.descripcion,
        monto: datos.monto,
        categoria_id: datos.categoria_id,
        cuenta_id: datos.cuenta_id,
        fecha_deposito: datos.fecha_deposito,
        comprobante_url: comprobanteUrl,
        notas: datos.notas,
        registrado_por: usuarioActual.value?.id
      })
      .select(`
        *,
        categoria:categorias_ingresos(*),
        cuenta:cuentas(*),
        usuario_registro:usuarios!ingresos_registrado_por_fkey(*)
      `)
      .single()

    if (error) throw error

    ingresos.value.unshift(data as Ingreso)
    return data
  }

  // Actualizar un ingreso
  const actualizarIngreso = async (id: string, datos: Partial<FormIngreso>) => {
    const { data, error } = await supabase
      .from('ingresos')
      .update(datos)
      .eq('id', id)
      .select(`
        *,
        categoria:categorias_ingresos(*),
        cuenta:cuentas(*),
        usuario_registro:usuarios!ingresos_registrado_por_fkey(*)
      `)
      .single()

    if (error) throw error

    const index = ingresos.value.findIndex(i => i.id === id)
    if (index !== -1) {
      ingresos.value[index] = data as Ingreso
    }

    return data
  }

  // Eliminar un ingreso
  const eliminarIngreso = async (id: string) => {
    const { error } = await supabase
      .from('ingresos')
      .delete()
      .eq('id', id)

    if (error) throw error

    const index = ingresos.value.findIndex(i => i.id === id)
    if (index !== -1) {
      ingresos.value.splice(index, 1)
    }
  }

  // Obtener un ingreso por ID
  const obtenerIngreso = (id: string): Ingreso | undefined => {
    return ingresos.value.find(i => i.id === id)
  }

  return {
    ingresos,
    totalIngresos,
    cargando,
    cargarIngresos,
    registrarIngreso,
    actualizarIngreso,
    eliminarIngreso,
    obtenerIngreso,
    subirComprobante
  }
}
