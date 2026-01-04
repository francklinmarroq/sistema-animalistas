<script setup lang="ts">
const route = useRoute()
const { ingresos, obtenerIngreso, cargarIngresos } = useIngresos()
const { formatearMoneda } = useConfiguracion()
const { puedeRegistrarIngresos } = useAuth()

// Estado
const cargando = ref(true)

// Verificar permisos
onMounted(() => {
  if (!puedeRegistrarIngresos.value) {
    navigateTo('/')
  }
})

// Cargar ingreso
onMounted(async () => {
  await cargarIngresos()
  cargando.value = false
})

// Obtener el ingreso actual
const ingreso = computed(() => obtenerIngreso(route.params.id as string))

// Formatear fecha
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Detectar si el comprobante es PDF
const esPDF = computed(() => {
  return ingreso.value?.comprobante_url?.toLowerCase().endsWith('.pdf')
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/ingresos" class="p-2 -ml-2 text-gray-400 hover:text-gray-600">
        <i class="pi pi-arrow-left text-xl"></i>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Detalle de Ingreso</h1>
      </div>
    </div>

    <!-- Loading -->
    <UiCargandoSpinner v-if="cargando" texto="Cargando ingreso..." />

    <!-- No encontrado -->
    <div v-else-if="!ingreso" class="card text-center py-12">
      <i class="pi pi-exclamation-circle text-5xl text-gray-300 mb-4"></i>
      <p class="text-gray-500">Ingreso no encontrado</p>
      <NuxtLink to="/ingresos" class="btn-secondary mt-4">
        Volver a ingresos
      </NuxtLink>
    </div>

    <!-- Detalle del ingreso -->
    <template v-else>
      <div class="card space-y-6">
        <!-- Monto -->
        <div class="text-center py-4">
          <span class="text-3xl font-bold text-green-600">
            +{{ formatearMoneda(Number(ingreso.monto)) }}
          </span>
        </div>

        <!-- Descripción -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900">{{ ingreso.descripcion }}</h2>
          <p class="text-gray-500 mt-1">{{ formatearFecha(ingreso.fecha_deposito) }}</p>
        </div>

        <!-- Detalles -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Categoría</p>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="w-6 h-6 rounded flex items-center justify-center"
                :style="{ backgroundColor: (ingreso.categoria?.color || '#22C55E') + '20', color: ingreso.categoria?.color }"
              >
                <i :class="['pi text-xs', ingreso.categoria?.icono || 'pi-wallet']"></i>
              </span>
              <span class="font-medium">{{ ingreso.categoria?.nombre }}</span>
            </div>
          </div>

          <div>
            <p class="text-sm text-gray-500">Cuenta destino</p>
            <p class="font-medium mt-1">{{ ingreso.cuenta?.nombre }}</p>
          </div>

          <div>
            <p class="text-sm text-gray-500">Registrado por</p>
            <p class="font-medium mt-1">
              {{ ingreso.usuario_registro?.nombre }} {{ ingreso.usuario_registro?.apellido }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500">Fecha de registro</p>
            <p class="font-medium mt-1">
              {{ new Date(ingreso.created_at).toLocaleDateString('es-MX') }}
            </p>
          </div>
        </div>

        <!-- Notas -->
        <div v-if="ingreso.notas">
          <p class="text-sm text-gray-500">Notas</p>
          <p class="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{{ ingreso.notas }}</p>
        </div>

        <!-- Comprobante -->
        <div v-if="ingreso.comprobante_url">
          <p class="text-sm text-gray-500 mb-2">Comprobante</p>

          <!-- Si es PDF -->
          <a
            v-if="esPDF"
            :href="ingreso.comprobante_url"
            target="_blank"
            class="flex items-center gap-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <i class="pi pi-file-pdf text-3xl text-red-500"></i>
            <div>
              <p class="font-medium text-gray-900">Ver comprobante PDF</p>
              <p class="text-xs text-gray-500">Clic para abrir en nueva pestaña</p>
            </div>
            <i class="pi pi-external-link ml-auto text-gray-400"></i>
          </a>

          <!-- Si es imagen -->
          <img
            v-else
            :src="ingreso.comprobante_url"
            alt="Comprobante"
            class="w-full rounded-lg border border-gray-200"
          />
        </div>
      </div>
    </template>
  </div>
</template>
