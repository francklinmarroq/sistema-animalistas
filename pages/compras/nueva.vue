<script setup lang="ts">
import type { FormCompra } from '~/types'

const { registrarCompra } = useCompras()
const { categoriasComprasActivas, cargarCategoriasCompras } = useCategorias()
const { exito, error: mostrarError } = useNotificaciones()

// Estado del formulario
const cargando = ref(false)
const formulario = ref<FormCompra>({
  descripcion: '',
  monto: null,
  categoria_id: '',
  cuenta_id: '', // Se asignará por el tesorero al aprobar
  fecha_compra: new Date().toISOString().split('T')[0],
  foto_factura: null,
  notas: ''
})

// Cargar datos necesarios
onMounted(async () => {
  await cargarCategoriasCompras()
})

// Manejar archivo de factura
const onArchivoSeleccionado = (archivo: File | null) => {
  formulario.value.foto_factura = archivo
}

// Validar formulario
const validar = (): boolean => {
  if (!formulario.value.descripcion) {
    mostrarError('Error', 'La descripción es requerida')
    return false
  }
  if (!formulario.value.monto || formulario.value.monto <= 0) {
    mostrarError('Error', 'El monto debe ser mayor a 0')
    return false
  }
  if (!formulario.value.categoria_id) {
    mostrarError('Error', 'Selecciona una categoría')
    return false
  }
  return true
}

// Guardar compra
const guardar = async () => {
  if (!validar()) return

  cargando.value = true

  try {
    await registrarCompra(formulario.value)
    exito('Compra registrada', 'La compra ha sido enviada para revisión del tesorero')
    await navigateTo('/compras')
  } catch (err: any) {
    mostrarError('Error al guardar', err.message)
  } finally {
    cargando.value = false
  }
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
        <h1 class="text-2xl font-bold text-gray-900">Nueva Compra</h1>
        <p class="text-gray-500 mt-1">Registra una compra para revisión</p>
      </div>
    </div>

    <!-- Info -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p class="text-sm text-blue-800">
        <i class="pi pi-info-circle mr-2"></i>
        La compra será enviada al tesorero/a para su revisión y aprobación.
        El tesorero asignará la cuenta de la que saldrá el dinero.
      </p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="guardar" class="card space-y-4">
      <!-- Descripción -->
      <div>
        <label for="descripcion" class="label">Descripción *</label>
        <input
          id="descripcion"
          v-model="formulario.descripcion"
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
            v-model.number="formulario.monto"
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
          v-model="formulario.categoria_id"
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
          v-model="formulario.fecha_compra"
          type="date"
          class="input"
          required
        />
      </div>

      <!-- Foto de factura -->
      <div>
        <label class="label">Foto de factura / comprobante *</label>
        <p class="text-xs text-gray-500 mb-2">Sube una foto clara de la factura o comprobante de compra</p>
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
          v-model="formulario.notas"
          class="input"
          rows="3"
          placeholder="Información adicional sobre la compra..."
        ></textarea>
      </div>

      <!-- Botones -->
      <div class="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          :disabled="cargando"
          class="btn-primary flex-1"
        >
          <i v-if="cargando" class="pi pi-spinner pi-spin"></i>
          <i v-else class="pi pi-send"></i>
          {{ cargando ? 'Enviando...' : 'Enviar para Revisión' }}
        </button>

        <NuxtLink to="/compras" class="btn-outline flex-1 text-center">
          Cancelar
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
