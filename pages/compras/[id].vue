<script setup lang="ts">
const route = useRoute()
const { compras, obtenerCompra, cargarCompras, aprobarCompra, rechazarCompra } = useCompras()
const { formatearMoneda } = useConfiguracion()
const { puedeAprobarCompras, usuarioActual } = useAuth()
const { exito, error: mostrarError } = useNotificaciones()

// Estado
const cargando = ref(true)
const procesando = ref(false)
const modalRechazo = ref(false)
const motivoRechazo = ref('')

// Cargar compra
onMounted(async () => {
  await cargarCompras()
  cargando.value = false
})

// Obtener la compra actual
const compra = computed(() => obtenerCompra(route.params.id as string))

// Formatear fecha
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Aprobar compra
const handleAprobar = async () => {
  if (!compra.value) return

  procesando.value = true
  try {
    await aprobarCompra(compra.value.id)
    exito('Compra aprobada', 'La compra ha sido aprobada correctamente')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = false
  }
}

// Rechazar compra
const handleRechazar = async () => {
  if (!compra.value || !motivoRechazo.value) return

  procesando.value = true
  try {
    await rechazarCompra(compra.value.id, motivoRechazo.value)
    modalRechazo.value = false
    motivoRechazo.value = ''
    exito('Compra rechazada', 'La compra ha sido rechazada')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = false
  }
}

// Verificar si el usuario puede revisar esta compra
const puedeRevisar = computed(() => {
  if (!compra.value) return false
  return puedeAprobarCompras.value && compra.value.estado === 'pendiente'
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/compras" class="p-2 -ml-2 text-gray-400 hover:text-gray-600">
        <i class="pi pi-arrow-left text-xl"></i>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Detalle de Compra</h1>
      </div>
    </div>

    <!-- Loading -->
    <UiCargandoSpinner v-if="cargando" texto="Cargando compra..." />

    <!-- No encontrada -->
    <div v-else-if="!compra" class="card text-center py-12">
      <i class="pi pi-exclamation-circle text-5xl text-gray-300 mb-4"></i>
      <p class="text-gray-500">Compra no encontrada</p>
      <NuxtLink to="/compras" class="btn-primary mt-4">
        Volver a compras
      </NuxtLink>
    </div>

    <!-- Detalle de la compra -->
    <template v-else>
      <div class="card space-y-6">
        <!-- Estado y monto -->
        <div class="flex items-start justify-between">
          <UiEstadoBadge :estado="compra.estado" />
          <span class="text-2xl font-bold text-gray-900">
            {{ formatearMoneda(Number(compra.monto)) }}
          </span>
        </div>

        <!-- Descripción -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900">{{ compra.descripcion }}</h2>
          <p class="text-gray-500 mt-1">{{ formatearFecha(compra.fecha_compra) }}</p>
        </div>

        <!-- Detalles -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500">Categoría</p>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="w-6 h-6 rounded flex items-center justify-center"
                :style="{ backgroundColor: (compra.categoria?.color || '#6B7280') + '20', color: compra.categoria?.color }"
              >
                <i :class="['pi text-xs', compra.categoria?.icono || 'pi-tag']"></i>
              </span>
              <span class="font-medium">{{ compra.categoria?.nombre }}</span>
            </div>
          </div>

          <div>
            <p class="text-sm text-gray-500">Cuenta</p>
            <p class="font-medium mt-1">{{ compra.cuenta?.nombre }}</p>
          </div>

          <div>
            <p class="text-sm text-gray-500">Registrado por</p>
            <p class="font-medium mt-1">
              {{ compra.usuario_registro?.nombre }} {{ compra.usuario_registro?.apellido }}
            </p>
          </div>

          <div v-if="compra.revisado_por">
            <p class="text-sm text-gray-500">Revisado por</p>
            <p class="font-medium mt-1">
              {{ compra.usuario_revision?.nombre }} {{ compra.usuario_revision?.apellido }}
            </p>
          </div>
        </div>

        <!-- Notas -->
        <div v-if="compra.notas">
          <p class="text-sm text-gray-500">Notas</p>
          <p class="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{{ compra.notas }}</p>
        </div>

        <!-- Motivo de rechazo -->
        <div v-if="compra.estado === 'rechazada' && compra.motivo_rechazo" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm font-medium text-red-800">Motivo del rechazo:</p>
          <p class="text-red-700 mt-1">{{ compra.motivo_rechazo }}</p>
        </div>

        <!-- Foto de factura -->
        <div v-if="compra.foto_factura_url">
          <p class="text-sm text-gray-500 mb-2">Foto de factura</p>
          <img
            :src="compra.foto_factura_url"
            alt="Factura"
            class="w-full rounded-lg border border-gray-200"
          />
        </div>
      </div>

      <!-- Acciones de revisión -->
      <div v-if="puedeRevisar" class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Acciones de Revisión</h3>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="handleAprobar"
            :disabled="procesando"
            class="btn-secondary flex-1"
          >
            <i class="pi pi-check"></i>
            Aprobar Compra
          </button>
          <button
            @click="modalRechazo = true"
            :disabled="procesando"
            class="btn-danger flex-1"
          >
            <i class="pi pi-times"></i>
            Rechazar Compra
          </button>
        </div>
      </div>
    </template>

    <!-- Modal de rechazo -->
    <UiModalBase
      :visible="modalRechazo"
      titulo="Rechazar Compra"
      @cerrar="modalRechazo = false"
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          Por favor, indica el motivo del rechazo:
        </p>
        <textarea
          v-model="motivoRechazo"
          class="input"
          rows="3"
          placeholder="Motivo del rechazo..."
        ></textarea>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <button
            @click="modalRechazo = false"
            class="btn-outline flex-1"
          >
            Cancelar
          </button>
          <button
            @click="handleRechazar"
            :disabled="!motivoRechazo || procesando"
            class="btn-danger flex-1"
          >
            <i v-if="procesando" class="pi pi-spinner pi-spin"></i>
            Confirmar Rechazo
          </button>
        </div>
      </template>
    </UiModalBase>
  </div>
</template>
