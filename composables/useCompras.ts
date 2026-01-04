import type { Compra, FormCompra, EstadoCompra } from '~/types'

// Composable para manejar las compras
export const useCompras = () => {
  const supabase = useSupabaseClient()
  const { usuarioActual } = useAuth()

  // Estado de las compras
  const compras = useState<Compra[]>('compras', () => [])
  const cargando = useState('cargando-compras', () => false)

  // Cargar todas las compras con relaciones
  const cargarCompras = async (filtros?: {
    estado?: EstadoCompra
    categoria_id?: string
    cuenta_id?: string
    desde?: string
    hasta?: string
  }) => {
    cargando.value = true

    try {
      let query = supabase
        .from('compras')
        .select(`
          *,
          categoria:categorias_compras(*),
          cuenta:cuentas(*),
          usuario_registro:usuarios!compras_registrado_por_fkey(*),
          usuario_revision:usuarios!compras_revisado_por_fkey(*)
        `)
        .order('fecha_compra', { ascending: false })

      // Aplicar filtros
      if (filtros?.estado) {
        query = query.eq('estado', filtros.estado)
      }
      if (filtros?.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id)
      }
      if (filtros?.cuenta_id) {
        query = query.eq('cuenta_id', filtros.cuenta_id)
      }
      if (filtros?.desde) {
        query = query.gte('fecha_compra', filtros.desde)
      }
      if (filtros?.hasta) {
        query = query.lte('fecha_compra', filtros.hasta)
      }

      const { data, error } = await query

      if (error) throw error
      compras.value = data as Compra[]
    } catch (error) {
      console.error('Error cargando compras:', error)
    } finally {
      cargando.value = false
    }
  }

  // Compras por estado
  const comprasPendientes = computed(() =>
    compras.value.filter(c => c.estado === 'pendiente')
  )

  const comprasAprobadas = computed(() =>
    compras.value.filter(c => c.estado === 'aprobada')
  )

  const comprasRechazadas = computed(() =>
    compras.value.filter(c => c.estado === 'rechazada')
  )

  // Total de compras aprobadas
  const totalComprasAprobadas = computed(() =>
    comprasAprobadas.value.reduce((sum, c) => sum + Number(c.monto), 0)
  )

  // Subir foto de factura
  const subirFotoFactura = async (archivo: File): Promise<string> => {
    const extension = archivo.name.split('.').pop()
    const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
    const ruta = `${usuarioActual.value?.id}/${nombreArchivo}`

    const { error } = await supabase.storage
      .from('facturas')
      .upload(ruta, archivo)

    if (error) throw error

    const { data } = supabase.storage.from('facturas').getPublicUrl(ruta)
    return data.publicUrl
  }

  // Registrar una nueva compra
  const registrarCompra = async (datos: FormCompra) => {
    let fotoUrl: string | undefined

    // Subir foto si existe
    if (datos.foto_factura) {
      fotoUrl = await subirFotoFactura(datos.foto_factura)
    }

    const { data, error } = await supabase
      .from('compras')
      .insert({
        descripcion: datos.descripcion,
        monto: datos.monto,
        categoria_id: datos.categoria_id,
        cuenta_id: datos.cuenta_id,
        fecha_compra: datos.fecha_compra,
        foto_factura_url: fotoUrl,
        notas: datos.notas,
        registrado_por: usuarioActual.value?.id
      })
      .select(`
        *,
        categoria:categorias_compras(*),
        cuenta:cuentas(*),
        usuario_registro:usuarios!compras_registrado_por_fkey(*)
      `)
      .single()

    if (error) throw error

    compras.value.unshift(data as Compra)
    return data
  }

  // Aprobar una compra
  const aprobarCompra = async (id: string) => {
    const { data, error } = await supabase
      .from('compras')
      .update({
        estado: 'aprobada',
        revisado_por: usuarioActual.value?.id,
        fecha_revision: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        categoria:categorias_compras(*),
        cuenta:cuentas(*),
        usuario_registro:usuarios!compras_registrado_por_fkey(*),
        usuario_revision:usuarios!compras_revisado_por_fkey(*)
      `)
      .single()

    if (error) throw error

    const index = compras.value.findIndex(c => c.id === id)
    if (index !== -1) {
      compras.value[index] = data as Compra
    }

    return data
  }

  // Rechazar una compra
  const rechazarCompra = async (id: string, motivo: string) => {
    const { data, error } = await supabase
      .from('compras')
      .update({
        estado: 'rechazada',
        revisado_por: usuarioActual.value?.id,
        fecha_revision: new Date().toISOString(),
        motivo_rechazo: motivo
      })
      .eq('id', id)
      .select(`
        *,
        categoria:categorias_compras(*),
        cuenta:cuentas(*),
        usuario_registro:usuarios!compras_registrado_por_fkey(*),
        usuario_revision:usuarios!compras_revisado_por_fkey(*)
      `)
      .single()

    if (error) throw error

    const index = compras.value.findIndex(c => c.id === id)
    if (index !== -1) {
      compras.value[index] = data as Compra
    }

    return data
  }

  // Obtener una compra por ID
  const obtenerCompra = (id: string): Compra | undefined => {
    return compras.value.find(c => c.id === id)
  }

  return {
    compras,
    comprasPendientes,
    comprasAprobadas,
    comprasRechazadas,
    totalComprasAprobadas,
    cargando,
    cargarCompras,
    registrarCompra,
    aprobarCompra,
    rechazarCompra,
    obtenerCompra,
    subirFotoFactura
  }
}
