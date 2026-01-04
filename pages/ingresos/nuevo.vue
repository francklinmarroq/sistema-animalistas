<script setup lang="ts">
import type { FormIngreso } from '~/types'

const { registrarIngreso } = useIngresos()
const { categoriasIngresosActivas, cargarCategoriasIngresos } = useCategorias()
const { cuentasActivas, cargarCuentas } = useCuentas()
const { puedeRegistrarIngresos } = useAuth()
const { exito, error: mostrarError } = useNotificaciones()

// Verificar permisos
onMounted(() => {
  if (!puedeRegistrarIngresos.value) {
    navigateTo('/')
  }
})

// Estado del formulario
const cargando = ref(false)
const formulario = ref<FormIngreso>({
  descripcion: '',
  monto: null,
  categoria_id: '',
  cuenta_id: '',
  fecha_deposito: new Date().toISOString().split('T')[0],
  comprobante: null,
  notas: ''
})

// Cargar datos necesarios
onMounted(async () => {
  await Promise.all([
    cargarCategoriasIngresos(),
    cargarCuentas()
  ])
})

// Manejar archivo de comprobante
const onArchivoSeleccionado = (archivo: File | null) => {
  formulario.value.comprobante = archivo
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
  if (!formulario.value.cuenta_id) {
    mostrarError('Error', 'Selecciona una cuenta')
    return false
  }
  return true
}

// Guardar ingreso
const guardar = async () => {
  if (!validar()) return

  cargando.value = true

  try {
    await registrarIngreso(formulario.value)
    exito('Ingreso registrado', 'El ingreso ha sido registrado correctamente')
    await navigateTo('/ingresos')
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
      <NuxtLink to="/ingresos" class="p-2 -ml-2 text-gray-400 hover:text-gray-600">
        <i class="pi pi-arrow-left text-xl"></i>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Nuevo Ingreso</h1>
        <p class="text-gray-500 mt-1">Registra un nuevo ingreso</p>
      </div>
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
          placeholder="Ej: Donativo de Juan Pérez"
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
            v-for="cat in categoriasIngresosActivas"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.nombre }}
          </option>
        </select>
      </div>

      <!-- Cuenta destino -->
      <div>
        <label for="cuenta" class="label">Cuenta destino *</label>
        <select
          id="cuenta"
          v-model="formulario.cuenta_id"
          class="input"
          required
        >
          <option value="" disabled>Selecciona una cuenta</option>
          <option
            v-for="cuenta in cuentasActivas"
            :key="cuenta.id"
            :value="cuenta.id"
          >
            {{ cuenta.nombre }} ({{ cuenta.tipo }})
          </option>
        </select>
      </div>

      <!-- Fecha -->
      <div>
        <label for="fecha" class="label">Fecha de depósito *</label>
        <input
          id="fecha"
          v-model="formulario.fecha_deposito"
          type="date"
          class="input"
          required
        />
      </div>

      <!-- Comprobante -->
      <div>
        <label class="label">Comprobante (opcional)</label>
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
          placeholder="Información adicional sobre el ingreso..."
        ></textarea>
      </div>

      <!-- Botones -->
      <div class="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          :disabled="cargando"
          class="btn-secondary flex-1"
        >
          <i v-if="cargando" class="pi pi-spinner pi-spin"></i>
          <i v-else class="pi pi-check"></i>
          {{ cargando ? 'Guardando...' : 'Registrar Ingreso' }}
        </button>

        <NuxtLink to="/ingresos" class="btn-outline flex-1 text-center">
          Cancelar
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
