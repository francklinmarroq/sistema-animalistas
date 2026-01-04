<script setup lang="ts">
const { compras, comprasPendientes, cargando, cargarCompras, aprobarCompra, rechazarCompra } = useCompras()
const { formatearMoneda } = useConfiguracion()
const { puedeAprobarCompras } = useAuth()
const { exito, error: mostrarError } = useNotificaciones()

// Estado
const procesando = ref<string | null>(null)
const modalRechazo = ref(false)
const compraSeleccionada = ref<string | null>(null)
const motivoRechazo = ref('')

// Verificar permisos
onMounted(() => {
  if (!puedeAprobarCompras.value) {
    navigateTo('/')
  }
})

// Cargar compras
onMounted(() => {
  cargarCompras({ estado: 'pendiente' })
})

// Formatear fecha
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short'
  })
}

// Aprobar compra
const handleAprobar = async (id: string) => {
  procesando.value = id
  try {
    await aprobarCompra(id)
    exito('Compra aprobada', 'La compra ha sido aprobada correctamente')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = null
  }
}

// Abrir modal de rechazo
const abrirRechazo = (id: string) => {
  compraSeleccionada.value = id
  motivoRechazo.value = ''
  modalRechazo.value = true
}

// Rechazar compra
const handleRechazar = async () => {
  if (!compraSeleccionada.value || !motivoRechazo.value) return

  procesando.value = compraSeleccionada.value
  try {
    await rechazarCompra(compraSeleccionada.value, motivoRechazo.value)
    modalRechazo.value = false
    exito('Compra rechazada', 'La compra ha sido rechazada')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = null
    compraSeleccionada.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Revisar Compras</h1>
      <p class="text-gray-500 mt-1">
        Aprueba o rechaza las compras pendientes de revisión
      </p>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="flex gap-4">
      <div class="card flex-1 text-center">
        <p class="text-3xl font-bold text-yellow-600">{{ comprasPendientes.length }}</p>
        <p class="text-sm text-gray-500">Pendientes</p>
      </div>
    </div>

    <!-- Loading -->
    <UiCargandoSpinner v-if="cargando" texto="Cargando compras pendientes..." />

    <!-- Sin compras pendientes -->
    <div v-else-if="comprasPendientes.length === 0" class="card text-center py-12">
      <i class="pi pi-check-circle text-5xl text-green-400 mb-4"></i>
      <p class="text-xl font-medium text-gray-900">¡Todo al día!</p>
      <p class="text-gray-500 mt-2">No hay compras pendientes de revisión</p>
    </div>

    <!-- Lista de compras pendientes -->
    <div v-else class="space-y-4">
      <div
        v-for="compra in comprasPendientes"
        :key="compra.id"
        class="card"
      >
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          <!-- Info de la compra -->
          <div class="flex-1">
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                :style="{ backgroundColor: (compra.categoria?.color || '#6B7280') + '20', color: compra.categoria?.color }"
              >
                <i :class="['pi', compra.categoria?.icono || 'pi-tag']"></i>
              </div>

              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900">{{ compra.descripcion }}</h3>
                <p class="text-sm text-gray-500">{{ compra.categoria?.nombre }}</p>
                <div class="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                  <span>
                    <i class="pi pi-calendar mr-1"></i>
                    {{ formatearFecha(compra.fecha_compra) }}
                  </span>
                  <span>
                    <i class="pi pi-user mr-1"></i>
                    {{ compra.usuario_registro?.nombre }}
                  </span>
                  <span>
                    <i class="pi pi-credit-card mr-1"></i>
                    {{ compra.cuenta?.nombre }}
                  </span>
                </div>
              </div>

              <div class="text-right">
                <p class="text-xl font-bold text-gray-900">
                  {{ formatearMoneda(Number(compra.monto)) }}
                </p>
              </div>
            </div>

            <!-- Notas -->
            <p v-if="compra.notas" class="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {{ compra.notas }}
            </p>

            <!-- Factura -->
            <div v-if="compra.foto_factura_url" class="mt-3">
              <a
                :href="compra.foto_factura_url"
                target="_blank"
                class="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <i class="pi pi-image"></i>
                Ver factura
                <i class="pi pi-external-link text-xs"></i>
              </a>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex sm:flex-col gap-2 sm:w-32">
            <button
              @click="handleAprobar(compra.id)"
              :disabled="procesando === compra.id"
              class="btn-secondary btn-sm flex-1"
            >
              <i v-if="procesando === compra.id" class="pi pi-spinner pi-spin"></i>
              <i v-else class="pi pi-check"></i>
              <span class="sm:hidden lg:inline">Aprobar</span>
            </button>
            <button
              @click="abrirRechazo(compra.id)"
              :disabled="procesando === compra.id"
              class="btn-danger btn-sm flex-1"
            >
              <i class="pi pi-times"></i>
              <span class="sm:hidden lg:inline">Rechazar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

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
            :disabled="!motivoRechazo || procesando !== null"
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
