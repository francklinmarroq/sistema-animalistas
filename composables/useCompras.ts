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
    solo_mias?: boolean
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
        .order('created_at', { ascending: false })

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
      if (filtros?.solo_mias && usuarioActual.value) {
        query = query.eq('registrado_por', usuarioActual.value.id)
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

  // Compras rechazadas del usuario actual (para notificación)
  const misComprasRechazadas = computed(() =>
    compras.value.filter(c =>
      c.estado === 'rechazada' &&
      c.registrado_por === usuarioActual.value?.id
    )
  )

  // Total de compras aprobadas
  const totalComprasAprobadas = computed(() =>
    comprasAprobadas.value.reduce((sum, c) => sum + Number(c.monto), 0)
  )

  // Subir foto de factura
  const subirFotoFactura = async (archivo: File): Promise<string | null> => {
    try {
      const extension = archivo.name.split('.').pop()
      const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`
      const ruta = `${usuarioActual.value?.id}/${nombreArchivo}`

      const { error } = await supabase.storage
        .from('facturas')
        .upload(ruta, archivo)

      if (error) {
        console.error('Error subiendo factura:', error)
        if (error.message?.includes('not found') || error.message?.includes('Bucket')) {
          console.warn('El bucket "facturas" no existe en Supabase Storage')
          return null
        }
        throw error
      }

      const { data } = supabase.storage.from('facturas').getPublicUrl(ruta)
      return data.publicUrl
    } catch (err) {
      console.error('Error en subirFotoFactura:', err)
      return null
    }
  }

  // Registrar una nueva compra (sin cuenta - la asigna el tesorero)
  const registrarCompra = async (datos: FormCompra) => {
    let fotoUrl: string | null = null

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
        cuenta_id: datos.cuenta_id || null, // Puede ser null, lo asigna el tesorero
        fecha_compra: datos.fecha_compra,
        foto_factura_url: fotoUrl,
        notas: datos.notas,
        registrado_por: usuarioActual.value?.id,
        estado: 'pendiente'
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

  // Aprobar una compra (el tesorero asigna la cuenta)
  const aprobarCompra = async (id: string, cuenta_id: string) => {
    if (!cuenta_id) {
      throw new Error('Debes seleccionar una cuenta para aprobar la compra')
    }

    const { data, error } = await supabase
      .from('compras')
      .update({
        estado: 'aprobada',
        cuenta_id: cuenta_id,
        revisado_por: usuarioActual.value?.id,
        fecha_revision: new Date().toISOString(),
        motivo_rechazo: null // Limpiar motivo de rechazo si existía
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
    if (!motivo) {
      throw new Error('Debes indicar el motivo del rechazo')
    }

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

  // Editar una compra rechazada (solo el que la registró)
  const editarCompraRechazada = async (id: string, datos: Partial<FormCompra>) => {
    const compra = compras.value.find(c => c.id === id)

    if (!compra) throw new Error('Compra no encontrada')
    if (compra.estado !== 'rechazada') throw new Error('Solo puedes editar compras rechazadas')
    if (compra.registrado_por !== usuarioActual.value?.id) {
      throw new Error('Solo puedes editar tus propias compras')
    }

    let fotoUrl = compra.foto_factura_url

    // Subir nueva foto si existe
    if (datos.foto_factura) {
      const nuevaUrl = await subirFotoFactura(datos.foto_factura)
      if (nuevaUrl) fotoUrl = nuevaUrl
    }

    const { data, error } = await supabase
      .from('compras')
      .update({
        descripcion: datos.descripcion || compra.descripcion,
        monto: datos.monto || compra.monto,
        categoria_id: datos.categoria_id || compra.categoria_id,
        fecha_compra: datos.fecha_compra || compra.fecha_compra,
        foto_factura_url: fotoUrl,
        notas: datos.notas !== undefined ? datos.notas : compra.notas
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

  // Reenviar compra rechazada para nueva revisión
  const reenviarParaRevision = async (id: string) => {
    const compra = compras.value.find(c => c.id === id)

    if (!compra) throw new Error('Compra no encontrada')
    if (compra.estado !== 'rechazada') throw new Error('Solo puedes reenviar compras rechazadas')
    if (compra.registrado_por !== usuarioActual.value?.id) {
      throw new Error('Solo puedes reenviar tus propias compras')
    }

    const { data, error } = await supabase
      .from('compras')
      .update({
        estado: 'pendiente',
        revisado_por: null,
        fecha_revision: null,
        motivo_rechazo: null
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
    misComprasRechazadas,
    totalComprasAprobadas,
    cargando,
    cargarCompras,
    registrarCompra,
    aprobarCompra,
    rechazarCompra,
    editarCompraRechazada,
    reenviarParaRevision,
    obtenerCompra,
    subirFotoFactura
  }
}
