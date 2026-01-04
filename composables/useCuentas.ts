import type { Cuenta, FormCuenta } from '~/types'

// Composable para manejar las cuentas bancarias y de efectivo
export const useCuentas = () => {
  const supabase = useSupabaseClient()

  // Estado de las cuentas
  const cuentas = useState<Cuenta[]>('cuentas', () => [])
  const cargando = useState('cargando-cuentas', () => false)

  // Cargar todas las cuentas
  const cargarCuentas = async () => {
    cargando.value = true

    try {
      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .order('nombre')

      if (error) throw error
      cuentas.value = data as Cuenta[]
    } catch (error) {
      console.error('Error cargando cuentas:', error)
    } finally {
      cargando.value = false
    }
  }

  // Obtener solo cuentas activas
  const cuentasActivas = computed(() =>
    cuentas.value.filter(c => c.activa)
  )

  // Obtener saldo total de todas las cuentas activas
  const saldoTotal = computed(() =>
    cuentasActivas.value.reduce((sum, c) => sum + Number(c.saldo_actual), 0)
  )

  // Crear una nueva cuenta
  const crearCuenta = async (datos: FormCuenta) => {
    const { data, error } = await supabase
      .from('cuentas')
      .insert({
        nombre: datos.nombre,
        tipo: datos.tipo,
        numero_cuenta: datos.numero_cuenta,
        banco: datos.banco,
        saldo_actual: datos.saldo_actual,
        color: datos.color
      })
      .select()
      .single()

    if (error) throw error

    cuentas.value.push(data as Cuenta)
    return data
  }

  // Actualizar una cuenta
  const actualizarCuenta = async (id: string, datos: Partial<FormCuenta>) => {
    const { data, error } = await supabase
      .from('cuentas')
      .update(datos)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const index = cuentas.value.findIndex(c => c.id === id)
    if (index !== -1) {
      cuentas.value[index] = data as Cuenta
    }

    return data
  }

  // Desactivar una cuenta (soft delete)
  const desactivarCuenta = async (id: string) => {
    return actualizarCuenta(id, { activa: false } as any)
  }

  // Activar una cuenta
  const activarCuenta = async (id: string) => {
    return actualizarCuenta(id, { activa: true } as any)
  }

  // Obtener una cuenta por ID
  const obtenerCuenta = (id: string): Cuenta | undefined => {
    return cuentas.value.find(c => c.id === id)
  }

  return {
    cuentas,
    cuentasActivas,
    saldoTotal,
    cargando,
    cargarCuentas,
    crearCuenta,
    actualizarCuenta,
    desactivarCuenta,
    activarCuenta,
    obtenerCuenta
  }
}
