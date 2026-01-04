import type { ConfiguracionSistema } from '~/types'

// Composable para manejar la configuración del sistema
export const useConfiguracion = () => {
  const supabase = useSupabaseClient()

  // Estado de la configuración
  const configuracion = useState<ConfiguracionSistema | null>('configuracion', () => null)
  const cargando = useState('cargando-config', () => false)

  // Cargar configuración del sistema
  const cargarConfiguracion = async () => {
    cargando.value = true

    try {
      const { data, error } = await supabase
        .from('configuracion_sistema')
        .select('*')
        .limit(1)
        .single()

      if (error) throw error
      configuracion.value = data as ConfiguracionSistema
    } catch (error) {
      console.error('Error cargando configuración:', error)
    } finally {
      cargando.value = false
    }
  }

  // Actualizar configuración
  const actualizarConfiguracion = async (datos: Partial<ConfiguracionSistema>) => {
    if (!configuracion.value) return

    const { data, error } = await supabase
      .from('configuracion_sistema')
      .update({
        ...datos,
        updated_at: new Date().toISOString()
      })
      .eq('id', configuracion.value.id)
      .select()
      .single()

    if (error) throw error
    configuracion.value = data as ConfiguracionSistema
    return data
  }

  // Formatear moneda
  const formatearMoneda = (cantidad: number): string => {
    if (!configuracion.value) return `$${cantidad.toFixed(2)}`

    return `${configuracion.value.moneda_simbolo}${cantidad.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  // Cargar configuración al iniciar
  onMounted(() => {
    if (!configuracion.value) {
      cargarConfiguracion()
    }
  })

  return {
    configuracion,
    cargando,
    cargarConfiguracion,
    actualizarConfiguracion,
    formatearMoneda
  }
}
