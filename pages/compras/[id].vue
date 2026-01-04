<script setup lang="ts">
import type { FormCompra } from '~/types'

const route = useRoute()
const { compras, obtenerCompra, cargarCompras, aprobarCompra, rechazarCompra, editarCompraRechazada, reenviarParaRevision } = useCompras()
const { categoriasComprasActivas, cargarCategoriasCompras } = useCategorias()
const { cuentasActivas, cargarCuentas } = useCuentas()
const { formatearMoneda } = useConfiguracion()
const { puedeAprobarCompras, usuarioActual } = useAuth()
const { exito, error: mostrarError } = useNotificaciones()

// Estado
const cargando = ref(true)
const procesando = ref(false)
const modalRechazo = ref(false)
const motivoRechazo = ref('')
const modoEdicion = ref(false)
const cuentaSeleccionada = ref('')

// Formulario de edición
const formularioEdicion = ref<Partial<FormCompra>>({
  descripcion: '',
  monto: null,
  categoria_id: '',
  fecha_compra: '',
  notas: '',
  foto_factura: null
})

// Cargar compra y datos relacionados
onMounted(async () => {
  await Promise.all([
    cargarCompras(),
    cargarCategoriasCompras(),
    cargarCuentas()
  ])

  // Inicializar formulario de edición con datos actuales
  if (compra.value) {
    formularioEdicion.value = {
      descripcion: compra.value.descripcion,
      monto: Number(compra.value.monto),
      categoria_id: compra.value.categoria_id,
      fecha_compra: compra.value.fecha_compra,
      notas: compra.value.notas || ''
    }
  }

  cargando.value = false
})

// Obtener la compra actual
const compra = computed(() => obtenerCompra(route.params.id as string))

// Watch para actualizar formulario cuando cambia la compra
watch(compra, (nuevaCompra) => {
  if (nuevaCompra) {
    formularioEdicion.value = {
      descripcion: nuevaCompra.descripcion,
      monto: Number(nuevaCompra.monto),
      categoria_id: nuevaCompra.categoria_id,
      fecha_compra: nuevaCompra.fecha_compra,
      notas: nuevaCompra.notas || ''
    }
  }
})

// Formatear fecha
const formatearFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Verificar si el usuario puede editar esta compra (solo si es rechazada y suya)
const puedeEditar = computed(() => {
  if (!compra.value || !usuarioActual.value) return false
  return compra.value.estado === 'rechazada' &&
         compra.value.registrado_por === usuarioActual.value.id
})

// Verificar si el usuario puede revisar esta compra
const puedeRevisar = computed(() => {
  if (!compra.value) return false
  return puedeAprobarCompras.value && compra.value.estado === 'pendiente'
})

// Detectar si es PDF
const esPDF = (url: string | undefined) => {
  return url?.toLowerCase().endsWith('.pdf')
}

// Manejar archivo de factura
const onArchivoSeleccionado = (archivo: File | null) => {
  formularioEdicion.value.foto_factura = archivo
}

// Aprobar compra
const handleAprobar = async () => {
  if (!compra.value) return

  if (!cuentaSeleccionada.value) {
    mostrarError('Error', 'Debes seleccionar una cuenta de origen')
    return
  }

  procesando.value = true
  try {
    await aprobarCompra(compra.value.id, cuentaSeleccionada.value)
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
    exito('Compra rechazada', 'El encargado será notificado para corregirla')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = false
  }
}

// Guardar cambios de edición
const guardarCambios = async () => {
  if (!compra.value) return

  // Validar
  if (!formularioEdicion.value.descripcion) {
    mostrarError('Error', 'La descripción es requerida')
    return
  }
  if (!formularioEdicion.value.monto || formularioEdicion.value.monto <= 0) {
    mostrarError('Error', 'El monto debe ser mayor a 0')
    return
  }
  if (!formularioEdicion.value.categoria_id) {
    mostrarError('Error', 'Selecciona una categoría')
    return
  }

  procesando.value = true
  try {
    await editarCompraRechazada(compra.value.id, formularioEdicion.value)
    modoEdicion.value = false
    exito('Cambios guardados', 'Los cambios han sido guardados correctamente')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = false
  }
}

// Reenviar para revisión
const handleReenviar = async () => {
  if (!compra.value) return

  procesando.value = true
  try {
    await reenviarParaRevision(compra.value.id)
    exito('Compra reenviada', 'La compra ha sido enviada para nueva revisión')
    await navigateTo('/compras')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    procesando.value = false
  }
}

// Cancelar edición
const cancelarEdicion = () => {
  if (compra.value) {
    formularioEdicion.value = {
      descripcion: compra.value.descripcion,
      monto: Number(compra.value.monto),
      categoria_id: compra.value.categoria_id,
      fecha_compra: compra.value.fecha_compra,
      notas: compra.value.notas || ''
    }
  }
  modoEdicion.value = false
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/compras" class="p-2 -ml-2 text-gray-400 hover:text-gray-600">
        <i class="pi pi-arrow-left text-xl"></i>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ modoEdicion ? 'Editar Compra' : 'Detalle de Compra' }}
        </h1>
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
      <!-- Alerta de compra rechazada (solo para el dueño) -->
      <div v-if="puedeEditar && !modoEdicion" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-triangle text-red-500 text-xl shrink-0 mt-0.5"></i>
          <div class="flex-1">
            <h3 class="font-medium text-red-800">Esta compra fue rechazada</h3>
            <p class="text-sm text-red-700 mt-1">
              Puedes editar los datos y solicitar una nueva revisión.
            </p>
          </div>
        </div>
      </div>

      <!-- Modo visualización -->
      <div v-if="!modoEdicion" class="card space-y-6">
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
            <p class="font-medium mt-1">{{ compra.cuenta?.nombre || 'Pendiente de asignar' }}</p>
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
        <div>
          <p class="text-sm text-gray-500 mb-2">Foto de factura</p>

          <!-- Sin documento -->
          <div v-if="!compra.foto_factura_url" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <i class="pi pi-exclamation-triangle text-3xl text-yellow-400 mb-2"></i>
            <p class="text-yellow-800 font-medium">No se adjuntó documento</p>
          </div>

          <!-- PDF -->
          <a
            v-else-if="esPDF(compra.foto_factura_url)"
            :href="compra.foto_factura_url"
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
          <div v-else>
            <img
              :src="compra.foto_factura_url"
              alt="Factura"
              class="w-full rounded-lg border border-gray-200 max-h-96 object-contain bg-gray-50"
            />
            <a
              :href="compra.foto_factura_url"
              target="_blank"
              class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-2"
            >
              <i class="pi pi-external-link"></i>
              Ver imagen completa
            </a>
          </div>
        </div>
      </div>

      <!-- Modo edición -->
      <form v-else @submit.prevent="guardarCambios" class="card space-y-4">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p class="text-sm text-blue-800">
            <i class="pi pi-info-circle mr-1"></i>
            Modifica los datos necesarios y guarda los cambios. Luego podrás solicitar una nueva revisión.
          </p>
        </div>

        <!-- Descripción -->
        <div>
          <label for="descripcion" class="label">Descripción *</label>
          <input
            id="descripcion"
            v-model="formularioEdicion.descripcion"
            type="text"
            class="input"
            placeholder="Ej: Alimento para gatos - Tienda XYZ"
            required
          />
        </div>

        <!-- Monto -->
        <div>
          <label for="monto" class="label">Monto *</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              id="monto"
              v-model.number="formularioEdicion.monto"
              type="number"
              step="0.01"
              min="0.01"
              class="input pl-8"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <!-- Categoría -->
        <div>
          <label for="categoria" class="label">Categoría *</label>
          <select
            id="categoria"
            v-model="formularioEdicion.categoria_id"
            class="input"
            required
          >
            <option value="" disabled>Selecciona una categoría</option>
            <option
              v-for="cat in categoriasComprasActivas"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.nombre }}
            </option>
          </select>
        </div>

        <!-- Fecha -->
        <div>
          <label for="fecha" class="label">Fecha de compra *</label>
          <input
            id="fecha"
            v-model="formularioEdicion.fecha_compra"
            type="date"
            class="input"
            required
          />
        </div>

        <!-- Foto de factura actual -->
        <div v-if="compra.foto_factura_url">
          <p class="text-sm text-gray-500 mb-2">Documento actual:</p>
          <div v-if="esPDF(compra.foto_factura_url)" class="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
            <i class="pi pi-file-pdf text-red-500"></i>
            <span class="text-sm">Documento PDF adjunto</span>
          </div>
          <img
            v-else
            :src="compra.foto_factura_url"
            alt="Factura actual"
            class="w-32 h-32 object-cover rounded-lg border"
          />
        </div>

        <!-- Nueva foto de factura -->
        <div>
          <label class="label">Nueva foto de factura (opcional)</label>
          <p class="text-xs text-gray-500 mb-2">Solo sube una nueva imagen si deseas reemplazar la actual</p>
          <UiSubidorArchivo
            accept="image/*,.pdf"
            :max-size="5"
            @archivo="onArchivoSeleccionado"
          />
        </div>

        <!-- Notas -->
        <div>
          <label for="notas" class="label">Notas adicionales (opcional)</label>
          <textarea
            id="notas"
            v-model="formularioEdicion.notas"
            class="input"
            rows="3"
            placeholder="Información adicional sobre la compra..."
          ></textarea>
        </div>

        <!-- Botones de edición -->
        <div class="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            :disabled="procesando"
            class="btn-primary flex-1"
          >
            <i v-if="procesando" class="pi pi-spinner pi-spin"></i>
            <i v-else class="pi pi-save"></i>
            {{ procesando ? 'Guardando...' : 'Guardar Cambios' }}
          </button>

          <button
            type="button"
            @click="cancelarEdicion"
            class="btn-outline flex-1"
          >
            Cancelar
          </button>
        </div>
      </form>

      <!-- Acciones para compra rechazada (editar/reenviar) -->
      <div v-if="puedeEditar && !modoEdicion" class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Acciones</h3>
        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="modoEdicion = true"
            class="btn-primary flex-1"
          >
            <i class="pi pi-pencil"></i>
            Editar Compra
          </button>
          <button
            @click="handleReenviar"
            :disabled="procesando"
            class="btn-secondary flex-1"
          >
            <i v-if="procesando" class="pi pi-spinner pi-spin"></i>
            <i v-else class="pi pi-send"></i>
            Solicitar Nueva Revisión
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-3 text-center">
          Puedes editar los datos antes de solicitar una nueva revisión, o reenviar directamente.
        </p>
      </div>

      <!-- Acciones de revisión (para tesorero) -->
      <div v-if="puedeRevisar" class="card">
        <h3 class="font-semibold text-gray-900 mb-4">Acciones de Revisión</h3>

        <!-- Seleccionar cuenta -->
        <div class="mb-4">
          <label class="label">Cuenta de origen (requerido para aprobar)</label>
          <select
            v-model="cuentaSeleccionada"
            class="input"
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

        <div class="flex flex-col sm:flex-row gap-3">
          <button
            @click="handleAprobar"
            :disabled="procesando || !cuentaSeleccionada"
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
