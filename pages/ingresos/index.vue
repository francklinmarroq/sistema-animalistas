<script setup lang="ts">
const { ingresos, cargando, cargarIngresos } = useIngresos()
const { formatearMoneda } = useConfiguracion()
const { puedeRegistrarIngresos } = useAuth()

// Filtros
const busqueda = ref('')

// Cargar ingresos al montar
onMounted(() => {
  cargarIngresos()
})

// Ingresos filtrados
const ingresosFiltrados = computed(() => {
  if (!busqueda.value) return ingresos.value

  const termino = busqueda.value.toLowerCase()
  return ingresos.value.filter(i =>
    i.descripcion.toLowerCase().includes(termino) ||
    i.categoria?.nombre.toLowerCase().includes(termino)
  )
})

// Formatear fecha
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Verificar permisos
onMounted(() => {
  if (!puedeRegistrarIngresos.value) {
    navigateTo('/')
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Ingresos</h1>
        <p class="text-gray-500 mt-1">Historial de ingresos registrados</p>
      </div>

      <NuxtLink to="/ingresos/nuevo" class="btn-secondary">
        <i class="pi pi-plus"></i>
        Nuevo Ingreso
      </NuxtLink>
    </div>

    <!-- Búsqueda -->
    <div class="card">
      <div class="relative">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input
          v-model="busqueda"
          type="text"
          class="input pl-10"
          placeholder="Buscar ingresos..."
        />
      </div>
    </div>

    <!-- Loading -->
    <UiCargandoSpinner v-if="cargando" texto="Cargando ingresos..." />

    <!-- Lista vacía -->
    <div v-else-if="ingresosFiltrados.length === 0" class="card text-center py-12">
      <i class="pi pi-wallet text-5xl text-gray-300 mb-4"></i>
      <p class="text-gray-500">No hay ingresos registrados</p>
      <NuxtLink to="/ingresos/nuevo" class="btn-secondary mt-4">
        Registrar primer ingreso
      </NuxtLink>
    </div>

    <!-- Lista de ingresos (móvil) -->
    <div v-else class="mobile-card-list">
      <NuxtLink
        v-for="ingreso in ingresosFiltrados"
        :key="ingreso.id"
        :to="`/ingresos/${ingreso.id}`"
        class="card-hover block"
      >
        <div class="flex items-start gap-3">
          <!-- Icono de categoría -->
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :style="{ backgroundColor: (ingreso.categoria?.color || '#22C55E') + '20', color: ingreso.categoria?.color || '#22C55E' }"
          >
            <i :class="['pi', ingreso.categoria?.icono || 'pi-wallet']"></i>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate">{{ ingreso.descripcion }}</p>
            <p class="text-sm text-gray-500">{{ ingreso.categoria?.nombre }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatearFecha(ingreso.fecha_deposito) }}</p>
          </div>

          <!-- Monto -->
          <div class="text-right shrink-0">
            <p class="font-semibold text-green-600">+{{ formatearMoneda(Number(ingreso.monto)) }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ ingreso.cuenta?.nombre }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Tabla (desktop) -->
    <div v-if="ingresosFiltrados.length > 0" class="desktop-table">
      <div class="card overflow-hidden p-0">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="ingreso in ingresosFiltrados"
              :key="ingreso.id"
              class="hover:bg-gray-50 cursor-pointer"
              @click="navigateTo(`/ingresos/${ingreso.id}`)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ backgroundColor: (ingreso.categoria?.color || '#22C55E') + '20', color: ingreso.categoria?.color }"
                  >
                    <i :class="['pi text-sm', ingreso.categoria?.icono || 'pi-wallet']"></i>
                  </div>
                  <span class="font-medium text-gray-900">{{ ingreso.descripcion }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ ingreso.categoria?.nombre }}</td>
              <td class="px-4 py-3 text-gray-600">{{ formatearFecha(ingreso.fecha_deposito) }}</td>
              <td class="px-4 py-3 text-gray-600">{{ ingreso.cuenta?.nombre }}</td>
              <td class="px-4 py-3 text-right font-semibold text-green-600">+{{ formatearMoneda(Number(ingreso.monto)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
