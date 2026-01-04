<script setup lang="ts">
import type { Compra } from '~/types'

const { compras, cargando, cargarCompras } = useCompras()
const { formatearMoneda } = useConfiguracion()

// Filtros
const filtroEstado = ref<string>('')
const busqueda = ref('')

// Cargar compras al montar
onMounted(() => {
  cargarCompras()
})

// Compras filtradas
const comprasFiltradas = computed(() => {
  let resultado = compras.value

  // Filtrar por estado
  if (filtroEstado.value) {
    resultado = resultado.filter(c => c.estado === filtroEstado.value)
  }

  // Filtrar por búsqueda
  if (busqueda.value) {
    const termino = busqueda.value.toLowerCase()
    resultado = resultado.filter(c =>
      c.descripcion.toLowerCase().includes(termino) ||
      c.categoria?.nombre.toLowerCase().includes(termino)
    )
  }

  return resultado
})

// Formatear fecha
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Compras</h1>
        <p class="text-gray-500 mt-1">Historial de compras registradas</p>
      </div>

      <NuxtLink to="/compras/nueva" class="btn-primary">
        <i class="pi pi-plus"></i>
        Nueva Compra
      </NuxtLink>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Búsqueda -->
        <div class="flex-1 relative">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            v-model="busqueda"
            type="text"
            class="input pl-10"
            placeholder="Buscar compras..."
          />
        </div>

        <!-- Filtro por estado -->
        <select v-model="filtroEstado" class="input w-full sm:w-48">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="aprobada">Aprobadas</option>
          <option value="rechazada">Rechazadas</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <UiCargandoSpinner v-if="cargando" texto="Cargando compras..." />

    <!-- Lista vacía -->
    <div v-else-if="comprasFiltradas.length === 0" class="card text-center py-12">
      <i class="pi pi-shopping-cart text-5xl text-gray-300 mb-4"></i>
      <p class="text-gray-500">No hay compras registradas</p>
      <NuxtLink to="/compras/nueva" class="btn-primary mt-4">
        Registrar primera compra
      </NuxtLink>
    </div>

    <!-- Lista de compras (móvil) -->
    <div v-else class="mobile-card-list">
      <NuxtLink
        v-for="compra in comprasFiltradas"
        :key="compra.id"
        :to="`/compras/${compra.id}`"
        class="card-hover block"
      >
        <div class="flex items-start gap-3">
          <!-- Icono de categoría -->
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :style="{ backgroundColor: (compra.categoria?.color || '#6B7280') + '20', color: compra.categoria?.color || '#6B7280' }"
          >
            <i :class="['pi', compra.categoria?.icono || 'pi-tag']"></i>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate">{{ compra.descripcion }}</p>
            <p class="text-sm text-gray-500">{{ compra.categoria?.nombre }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatearFecha(compra.fecha_compra) }}</p>
          </div>

          <!-- Monto y estado -->
          <div class="text-right shrink-0">
            <p class="font-semibold text-gray-900">{{ formatearMoneda(Number(compra.monto)) }}</p>
            <UiEstadoBadge :estado="compra.estado" class="mt-1" />
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Tabla (desktop) -->
    <div v-if="comprasFiltradas.length > 0" class="desktop-table">
      <div class="card overflow-hidden p-0">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="compra in comprasFiltradas"
              :key="compra.id"
              class="hover:bg-gray-50 cursor-pointer"
              @click="navigateTo(`/compras/${compra.id}`)"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    :style="{ backgroundColor: (compra.categoria?.color || '#6B7280') + '20', color: compra.categoria?.color || '#6B7280' }"
                  >
                    <i :class="['pi text-sm', compra.categoria?.icono || 'pi-tag']"></i>
                  </div>
                  <span class="font-medium text-gray-900">{{ compra.descripcion }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ compra.categoria?.nombre }}</td>
              <td class="px-4 py-3 text-gray-600">{{ formatearFecha(compra.fecha_compra) }}</td>
              <td class="px-4 py-3 text-gray-600">{{ compra.cuenta?.nombre }}</td>
              <td class="px-4 py-3 text-right font-semibold">{{ formatearMoneda(Number(compra.monto)) }}</td>
              <td class="px-4 py-3 text-center">
                <UiEstadoBadge :estado="compra.estado" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
