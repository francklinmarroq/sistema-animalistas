import type { CategoriaCompra, CategoriaIngreso, FormCategoria } from '~/types'

// Composable para manejar las categorías de compras e ingresos
export const useCategorias = () => {
  const supabase = useSupabaseClient()

  // Estado de las categorías
  const categoriasCompras = useState<CategoriaCompra[]>('categorias-compras', () => [])
  const categoriasIngresos = useState<CategoriaIngreso[]>('categorias-ingresos', () => [])
  const cargando = useState('cargando-categorias', () => false)

  // Cargar categorías de compras
  const cargarCategoriasCompras = async () => {
    cargando.value = true

    try {
      const { data, error } = await supabase
        .from('categorias_compras')
        .select('*')
        .order('nombre')

      if (error) throw error
      categoriasCompras.value = data as CategoriaCompra[]
    } catch (error) {
      console.error('Error cargando categorías de compras:', error)
    } finally {
      cargando.value = false
    }
  }

  // Cargar categorías de ingresos
  const cargarCategoriasIngresos = async () => {
    cargando.value = true

    try {
      const { data, error } = await supabase
        .from('categorias_ingresos')
        .select('*')
        .order('nombre')

      if (error) throw error
      categoriasIngresos.value = data as CategoriaIngreso[]
    } catch (error) {
      console.error('Error cargando categorías de ingresos:', error)
    } finally {
      cargando.value = false
    }
  }

  // Cargar todas las categorías
  const cargarTodasCategorias = async () => {
    await Promise.all([
      cargarCategoriasCompras(),
      cargarCategoriasIngresos()
    ])
  }

  // Categorías activas
  const categoriasComprasActivas = computed(() =>
    categoriasCompras.value.filter(c => c.activa)
  )

  const categoriasIngresosActivas = computed(() =>
    categoriasIngresos.value.filter(c => c.activa)
  )

  // Crear categoría de compras
  const crearCategoriaCompra = async (datos: FormCategoria) => {
    const { data, error } = await supabase
      .from('categorias_compras')
      .insert({
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        icono: datos.icono,
        color: datos.color
      })
      .select()
      .single()

    if (error) throw error

    categoriasCompras.value.push(data as CategoriaCompra)
    return data
  }

  // Crear categoría de ingresos
  const crearCategoriaIngreso = async (datos: FormCategoria) => {
    const { data, error } = await supabase
      .from('categorias_ingresos')
      .insert({
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        icono: datos.icono,
        color: datos.color
      })
      .select()
      .single()

    if (error) throw error

    categoriasIngresos.value.push(data as CategoriaIngreso)
    return data
  }

  // Actualizar categoría de compras
  const actualizarCategoriaCompra = async (id: string, datos: Partial<FormCategoria>) => {
    const { data, error } = await supabase
      .from('categorias_compras')
      .update(datos)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const index = categoriasCompras.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categoriasCompras.value[index] = data as CategoriaCompra
    }

    return data
  }

  // Actualizar categoría de ingresos
  const actualizarCategoriaIngreso = async (id: string, datos: Partial<FormCategoria>) => {
    const { data, error } = await supabase
      .from('categorias_ingresos')
      .update(datos)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const index = categoriasIngresos.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categoriasIngresos.value[index] = data as CategoriaIngreso
    }

    return data
  }

  // Togglear estado activo de categoría de compras
  const toggleCategoriaCompra = async (id: string) => {
    const categoria = categoriasCompras.value.find(c => c.id === id)
    if (!categoria) return

    return actualizarCategoriaCompra(id, { activa: !categoria.activa } as any)
  }

  // Togglear estado activo de categoría de ingresos
  const toggleCategoriaIngreso = async (id: string) => {
    const categoria = categoriasIngresos.value.find(c => c.id === id)
    if (!categoria) return

    return actualizarCategoriaIngreso(id, { activa: !categoria.activa } as any)
  }

  // Obtener categoría por ID
  const obtenerCategoriaCompra = (id: string): CategoriaCompra | undefined => {
    return categoriasCompras.value.find(c => c.id === id)
  }

  const obtenerCategoriaIngreso = (id: string): CategoriaIngreso | undefined => {
    return categoriasIngresos.value.find(c => c.id === id)
  }

  return {
    categoriasCompras,
    categoriasIngresos,
    categoriasComprasActivas,
    categoriasIngresosActivas,
    cargando,
    cargarCategoriasCompras,
    cargarCategoriasIngresos,
    cargarTodasCategorias,
    crearCategoriaCompra,
    crearCategoriaIngreso,
    actualizarCategoriaCompra,
    actualizarCategoriaIngreso,
    toggleCategoriaCompra,
    toggleCategoriaIngreso,
    obtenerCategoriaCompra,
    obtenerCategoriaIngreso
  }
}
