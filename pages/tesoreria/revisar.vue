<script setup lang="ts">
import type { Compra } from '~/types'

const { compras, comprasPendientes, cargando, cargarCompras, aprobarCompra, rechazarCompra } = useCompras()
const { cuentasActivas, cargarCuentas } = useCuentas()
const { formatearMoneda } = useConfiguracion()
const { puedeAprobarCompras } = useAuth()
const { exito, error: mostrarError } = useNotificaciones()

// Estado
const procesando = ref<string | null>(null)
const compraSeleccionada = ref<Compra | null>(null)
const modalDetalle = ref(false)
const modalRechazo = ref(false)
const motivoRechazo = ref('')
const cuentaSeleccionada = ref('')

// Verificar permisos
onMounted(async () => {
  if (!puedeAprobarCompras.value) {
    await navigateTo('/')
    return
  }

  await Promise.all([
    cargarCompras({ estado: 'pendiente' }),
    cargarCuentas()
  ])
})

// Formatear fecha
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Abrir detalle de compra
const verDetalle = (compra: Compra) => {
  compraSeleccionada.value = compra
  cuentaSeleccionada.value = ''
  modalDetalle.value = true
}

// Aprobar compra
const handleAprobar = async () => {
  if (!compraSeleccionada.value) return

  if (!cuentaSeleccionada.value) {
    mostrarError('Error', 'Debes seleccionar una cuenta de origen')
    return
  }

  procesando.value = compraSeleccionada.value.id
  try {
    await aprobarCompra(compraSeleccionada.value.id, cuentaSeleccionada.value)
    modalDetalle.value = false
    exito('Compra aprobada', 'La compra ha sido aprobada y el saldo actualizado')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = null
  }
}

// Abrir modal de rechazo
const abrirRechazo = () => {
  motivoRechazo.value = ''
  modalRechazo.value = true
}

// Rechazar compra
const handleRechazar = async () => {
  if (!compraSeleccionada.value || !motivoRechazo.value) return

  procesando.value = compraSeleccionada.value.id
  try {
    await rechazarCompra(compraSeleccionada.value.id, motivoRechazo.value)
    modalRechazo.value = false
    modalDetalle.value = false
    exito('Compra rechazada', 'El encargado será notificado para corregirla')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = null
  }
}

// Detectar si es PDF
const esPDF = (url: string | undefined) => {
  return url?.toLowerCase().endsWith('.pdf')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Revisar Compras</h1>
      <p class="text-gray-500 mt-1">
        Revisa los documentos y aprueba o rechaza las compras pendientes
      </p>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-2 gap-4">
      <div class="card text-center">
        <p class="text-3xl font-bold text-yellow-600">{{ comprasPendientes.length }}</p>
        <p class="text-sm text-gray-500">Pendientes de revisión</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-gray-600">
          {{ formatearMoneda(comprasPendientes.reduce((sum, c) => sum + Number(c.monto), 0)) }}
        </p>
        <p class="text-sm text-gray-500">Monto total pendiente</p>
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
        class="card cursor-pointer hover:shadow-md transition-shadow"
        @click="verDetalle(compra)"
      >
        <div class="flex items-start gap-4">
          <!-- Icono de categoría -->
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            :style="{ backgroundColor: (compra.categoria?.color || '#6B7280') + '20', color: compra.categoria?.color }"
          >
            <i :class="['pi text-xl', compra.categoria?.icono || 'pi-tag']"></i>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900">{{ compra.descripcion }}</h3>
            <p class="text-sm text-gray-500 mt-1">{{ compra.categoria?.nombre }}</p>
            <div class="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span>
                <i class="pi pi-calendar mr-1"></i>
                {{ formatearFecha(compra.fecha_compra) }}
              </span>
              <span>
                <i class="pi pi-user mr-1"></i>
                {{ compra.usuario_registro?.nombre }} {{ compra.usuario_registro?.apellido }}
              </span>
              <span v-if="compra.foto_factura_url" class="text-green-600">
                <i class="pi pi-file mr-1"></i>
                Con documento
              </span>
              <span v-else class="text-red-500">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                Sin documento
              </span>
            </div>
          </div>

          <!-- Monto -->
          <div class="text-right shrink-0">
            <p class="text-xl font-bold text-gray-900">
              {{ formatearMoneda(Number(compra.monto)) }}
            </p>
            <p class="text-xs text-gray-400 mt-1">Click para revisar</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de detalle -->
    <UiModalBase
      :visible="modalDetalle"
      titulo="Revisar Compra"
      ancho="lg"
      @cerrar="modalDetalle = false"
    >
      <template v-if="compraSeleccionada">
        <div class="space-y-6">
          <!-- Monto destacado -->
          <div class="text-center py-4 bg-gray-50 rounded-lg">
            <p class="text-sm text-gray-500">Monto solicitado</p>
            <p class="text-3xl font-bold text-gray-900">
              {{ formatearMoneda(Number(compraSeleccionada.monto)) }}
            </p>
          </div>

          <!-- Detalles -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Descripción</p>
              <p class="font-medium">{{ compraSeleccionada.descripcion }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Categoría</p>
              <div class="flex items-center gap-2">
                <span
                  class="w-6 h-6 rounded flex items-center justify-center"
                  :style="{ backgroundColor: (compraSeleccionada.categoria?.color || '#6B7280') + '20', color: compraSeleccionada.categoria?.color }"
                >
                  <i :class="['pi text-xs', compraSeleccionada.categoria?.icono || 'pi-tag']"></i>
                </span>
                <span class="font-medium">{{ compraSeleccionada.categoria?.nombre }}</span>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-500">Fecha de compra</p>
              <p class="font-medium">{{ formatearFecha(compraSeleccionada.fecha_compra) }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Solicitado por</p>
              <p class="font-medium">
                {{ compraSeleccionada.usuario_registro?.nombre }}
                {{ compraSeleccionada.usuario_registro?.apellido }}
              </p>
            </div>
          </div>

          <!-- Notas -->
          <div v-if="compraSeleccionada.notas">
            <p class="text-sm text-gray-500">Notas</p>
            <p class="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
              {{ compraSeleccionada.notas }}
            </p>
          </div>

          <!-- Documento / Factura -->
          <div>
            <p class="text-sm text-gray-500 mb-2">Documento / Factura</p>

            <!-- Sin documento -->
            <div v-if="!compraSeleccionada.foto_factura_url" class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
              <p class="text-red-800 font-medium">No se adjuntó documento</p>
              <p class="text-sm text-red-600 mt-1">Esta compra no tiene factura o comprobante adjunto</p>
            </div>

            <!-- PDF -->
            <a
              v-else-if="esPDF(compraSeleccionada.foto_factura_url)"
              :href="compraSeleccionada.foto_factura_url"
              target="_blank"
              class="flex items-center gap-3 p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i class="pi pi-file-pdf text-4xl text-red-500"></i>
              <div>
                <p class="font-medium text-gray-900">Ver documento PDF</p>
                <p class="text-sm text-gray-500">Click para abrir en nueva pestaña</p>
              </div>
              <i class="pi pi-external-link ml-auto text-gray-400"></i>
            </a>

            <!-- Imagen -->
            <div v-else class="space-y-2">
              <img
                :src="compraSeleccionada.foto_factura_url"
                alt="Factura"
                class="w-full rounded-lg border border-gray-200 max-h-96 object-contain bg-gray-50"
              />
              <a
                :href="compraSeleccionada.foto_factura_url"
                target="_blank"
                class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <i class="pi pi-external-link"></i>
                Ver imagen completa
              </a>
            </div>
          </div>

          <!-- Seleccionar cuenta (para aprobar) -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label class="label text-blue-800">
              <i class="pi pi-credit-card mr-1"></i>
              Cuenta de origen (requerido para aprobar)
            </label>
            <select
              v-model="cuentaSeleccionada"
              class="input mt-2"
            >
              <option value="" disabled>Selecciona la cuenta de donde saldrá el dinero</option>
              <option
                v-for="cuenta in cuentasActivas"
                :key="cuenta.id"
                :value="cuenta.id"
              >
                {{ cuenta.nombre }} - Saldo: {{ formatearMoneda(Number(cuenta.saldo_actual)) }}
              </option>
            </select>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="handleAprobar"
            :disabled="procesando !== null || !cuentaSeleccionada"
            class="btn-secondary flex-1"
          >
            <i v-if="procesando" class="pi pi-spinner pi-spin"></i>
            <i v-else class="pi pi-check"></i>
            Aprobar Compra
          </button>
          <button
            @click="abrirRechazo"
            :disabled="procesando !== null"
            class="btn-danger flex-1"
          >
            <i class="pi pi-times"></i>
            Rechazar
          </button>
          <button
            @click="modalDetalle = false"
            class="btn-outline flex-1"
          >
            Cerrar
          </button>
        </div>
      </template>
    </UiModalBase>

    <!-- Modal de rechazo -->
    <UiModalBase
      :visible="modalRechazo"
      titulo="Rechazar Compra"
      @cerrar="modalRechazo = false"
    >
      <div class="space-y-4">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p class="text-sm text-yellow-800">
            <i class="pi pi-info-circle mr-1"></i>
            El encargado de compras será notificado y podrá corregir la compra para enviarla nuevamente.
          </p>
        </div>

        <div>
          <label class="label">Motivo del rechazo *</label>
          <textarea
            v-model="motivoRechazo"
            class="input"
            rows="3"
            placeholder="Explica por qué se rechaza esta compra..."
          ></textarea>
        </div>
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
