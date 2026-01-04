<script setup lang="ts">
import type { FormCategoria, FormCuenta, TipoCuenta } from '~/types'

const { esAdmin } = useAuth()
const { configuracion, cargarConfiguracion, actualizarConfiguracion } = useConfiguracion()
const { cuentas, cuentasActivas, cargarCuentas, crearCuenta, actualizarCuenta, desactivarCuenta } = useCuentas()
const { categoriasCompras, categoriasIngresos, cargarTodasCategorias, crearCategoriaCompra, crearCategoriaIngreso, actualizarCategoriaCompra, actualizarCategoriaIngreso, toggleCategoriaCompra, toggleCategoriaIngreso } = useCategorias()
const { exito, error: mostrarError } = useNotificaciones()

// Verificar permisos
onMounted(() => {
  if (!esAdmin.value) {
    navigateTo('/')
  }
})

// Cargar datos
onMounted(async () => {
  await Promise.all([
    cargarConfiguracion(),
    cargarCuentas(),
    cargarTodasCategorias()
  ])
})

// Tabs
const tabActiva = ref<'general' | 'cuentas' | 'categorias-compras' | 'categorias-ingresos'>('general')

// ========== CONFIGURACIÓN GENERAL ==========
const guardandoConfig = ref(false)
const configForm = ref({
  nombre_organizacion: '',
  moneda_codigo: '',
  moneda_simbolo: '',
  moneda_nombre: ''
})

// Sincronizar formulario con configuración
watch(configuracion, (config) => {
  if (config) {
    configForm.value = {
      nombre_organizacion: config.nombre_organizacion,
      moneda_codigo: config.moneda_codigo,
      moneda_simbolo: config.moneda_simbolo,
      moneda_nombre: config.moneda_nombre
    }
  }
}, { immediate: true })

const guardarConfiguracion = async () => {
  guardandoConfig.value = true
  try {
    await actualizarConfiguracion(configForm.value)
    exito('Configuración guardada')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    guardandoConfig.value = false
  }
}

// ========== CUENTAS ==========
const modalCuenta = ref(false)
const editandoCuenta = ref<string | null>(null)
const guardandoCuenta = ref(false)
const formCuenta = ref<FormCuenta>({
  nombre: '',
  tipo: 'banco',
  numero_cuenta: '',
  banco: '',
  saldo_actual: 0,
  color: '#3B82F6'
})

const tiposCuenta: { value: TipoCuenta; label: string }[] = [
  { value: 'banco', label: 'Cuenta Bancaria' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'digital', label: 'Billetera Digital' }
]

const coloresDisponibles = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6']

const abrirModalCuenta = (cuenta?: typeof cuentas.value[0]) => {
  if (cuenta) {
    editandoCuenta.value = cuenta.id
    formCuenta.value = {
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      numero_cuenta: cuenta.numero_cuenta || '',
      banco: cuenta.banco || '',
      saldo_actual: Number(cuenta.saldo_actual),
      color: cuenta.color
    }
  } else {
    editandoCuenta.value = null
    formCuenta.value = {
      nombre: '',
      tipo: 'banco',
      numero_cuenta: '',
      banco: '',
      saldo_actual: 0,
      color: '#3B82F6'
    }
  }
  modalCuenta.value = true
}

const guardarCuenta = async () => {
  if (!formCuenta.value.nombre) {
    mostrarError('Error', 'El nombre es requerido')
    return
  }

  guardandoCuenta.value = true
  try {
    if (editandoCuenta.value) {
      await actualizarCuenta(editandoCuenta.value, formCuenta.value)
      exito('Cuenta actualizada')
    } else {
      await crearCuenta(formCuenta.value)
      exito('Cuenta creada')
    }
    modalCuenta.value = false
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    guardandoCuenta.value = false
  }
}

// ========== CATEGORÍAS ==========
const modalCategoria = ref(false)
const tipoCategoria = ref<'compra' | 'ingreso'>('compra')
const editandoCategoria = ref<string | null>(null)
const guardandoCategoria = ref(false)
const formCategoria = ref<FormCategoria>({
  nombre: '',
  descripcion: '',
  icono: 'pi-tag',
  color: '#6366F1'
})

const iconosDisponibles = [
  'pi-tag', 'pi-shopping-cart', 'pi-heart', 'pi-box', 'pi-car',
  'pi-home', 'pi-wallet', 'pi-money-bill', 'pi-credit-card',
  'pi-gift', 'pi-calendar', 'pi-users', 'pi-building', 'pi-truck'
]

const abrirModalCategoria = (tipo: 'compra' | 'ingreso', categoria?: any) => {
  tipoCategoria.value = tipo
  if (categoria) {
    editandoCategoria.value = categoria.id
    formCategoria.value = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      icono: categoria.icono,
      color: categoria.color
    }
  } else {
    editandoCategoria.value = null
    formCategoria.value = {
      nombre: '',
      descripcion: '',
      icono: tipo === 'compra' ? 'pi-tag' : 'pi-wallet',
      color: tipo === 'compra' ? '#6366F1' : '#22C55E'
    }
  }
  modalCategoria.value = true
}

const guardarCategoria = async () => {
  if (!formCategoria.value.nombre) {
    mostrarError('Error', 'El nombre es requerido')
    return
  }

  guardandoCategoria.value = true
  try {
    if (tipoCategoria.value === 'compra') {
      if (editandoCategoria.value) {
        await actualizarCategoriaCompra(editandoCategoria.value, formCategoria.value)
      } else {
        await crearCategoriaCompra(formCategoria.value)
      }
    } else {
      if (editandoCategoria.value) {
        await actualizarCategoriaIngreso(editandoCategoria.value, formCategoria.value)
      } else {
        await crearCategoriaIngreso(formCategoria.value)
      }
    }
    exito(editandoCategoria.value ? 'Categoría actualizada' : 'Categoría creada')
    modalCategoria.value = false
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    guardandoCategoria.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Configuración</h1>
      <p class="text-gray-500 mt-1">Configura el sistema según las necesidades de tu organización</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-2">
      <button
        v-for="tab in [
          { id: 'general', label: 'General', icon: 'pi-cog' },
          { id: 'cuentas', label: 'Cuentas', icon: 'pi-credit-card' },
          { id: 'categorias-compras', label: 'Cat. Compras', icon: 'pi-shopping-cart' },
          { id: 'categorias-ingresos', label: 'Cat. Ingresos', icon: 'pi-wallet' }
        ]"
        :key="tab.id"
        @click="tabActiva = tab.id as any"
        :class="[
          'btn btn-sm whitespace-nowrap',
          tabActiva === tab.id ? 'bg-primary-500 text-white' : 'btn-outline'
        ]"
      >
        <i :class="['pi', tab.icon]"></i>
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab: General -->
    <div v-if="tabActiva === 'general'" class="card space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Configuración General</h2>

      <div>
        <label class="label">Nombre de la organización</label>
        <input v-model="configForm.nombre_organizacion" type="text" class="input" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label class="label">Código de moneda</label>
          <input v-model="configForm.moneda_codigo" type="text" class="input" placeholder="MXN" />
        </div>
        <div>
          <label class="label">Símbolo</label>
          <input v-model="configForm.moneda_simbolo" type="text" class="input" placeholder="$" />
        </div>
        <div>
          <label class="label">Nombre de moneda</label>
          <input v-model="configForm.moneda_nombre" type="text" class="input" placeholder="Peso Mexicano" />
        </div>
      </div>

      <button
        @click="guardarConfiguracion"
        :disabled="guardandoConfig"
        class="btn-primary"
      >
        <i v-if="guardandoConfig" class="pi pi-spinner pi-spin"></i>
        <i v-else class="pi pi-check"></i>
        Guardar Cambios
      </button>
    </div>

    <!-- Tab: Cuentas -->
    <div v-if="tabActiva === 'cuentas'" class="card space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Cuentas</h2>
        <button @click="abrirModalCuenta()" class="btn-primary btn-sm">
          <i class="pi pi-plus"></i>
          Nueva Cuenta
        </button>
      </div>

      <div v-if="cuentas.length === 0" class="text-center py-8 text-gray-500">
        <i class="pi pi-credit-card text-4xl mb-2"></i>
        <p>No hay cuentas configuradas</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="cuenta in cuentas"
          :key="cuenta.id"
          :class="[
            'flex items-center justify-between p-4 rounded-lg border',
            cuenta.activa ? 'bg-white' : 'bg-gray-100 opacity-60'
          ]"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: cuenta.color + '20', color: cuenta.color }"
            >
              <i :class="['pi', cuenta.tipo === 'banco' ? 'pi-building' : cuenta.tipo === 'efectivo' ? 'pi-money-bill' : 'pi-credit-card']"></i>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ cuenta.nombre }}</p>
              <p class="text-sm text-gray-500 capitalize">{{ cuenta.tipo }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="abrirModalCuenta(cuenta)" class="btn-outline btn-sm">
              <i class="pi pi-pencil"></i>
            </button>
            <button
              @click="desactivarCuenta(cuenta.id)"
              v-if="cuenta.activa"
              class="btn-outline btn-sm text-red-600 border-red-200"
            >
              <i class="pi pi-ban"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Categorías de Compras -->
    <div v-if="tabActiva === 'categorias-compras'" class="card space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Categorías de Compras</h2>
        <button @click="abrirModalCategoria('compra')" class="btn-primary btn-sm">
          <i class="pi pi-plus"></i>
          Nueva Categoría
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="cat in categoriasCompras"
          :key="cat.id"
          :class="[
            'flex items-center justify-between p-4 rounded-lg border',
            cat.activa ? 'bg-white' : 'bg-gray-100 opacity-60'
          ]"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: cat.color + '20', color: cat.color }"
            >
              <i :class="['pi', cat.icono]"></i>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ cat.nombre }}</p>
              <p v-if="cat.descripcion" class="text-sm text-gray-500">{{ cat.descripcion }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="abrirModalCategoria('compra', cat)" class="btn-outline btn-sm">
              <i class="pi pi-pencil"></i>
            </button>
            <button
              @click="toggleCategoriaCompra(cat.id)"
              :class="['btn-outline btn-sm', cat.activa ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200']"
            >
              <i :class="['pi', cat.activa ? 'pi-ban' : 'pi-check']"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Categorías de Ingresos -->
    <div v-if="tabActiva === 'categorias-ingresos'" class="card space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Categorías de Ingresos</h2>
        <button @click="abrirModalCategoria('ingreso')" class="btn-primary btn-sm">
          <i class="pi pi-plus"></i>
          Nueva Categoría
        </button>
      </div>

      <div class="space-y-3">
        <div
          v-for="cat in categoriasIngresos"
          :key="cat.id"
          :class="[
            'flex items-center justify-between p-4 rounded-lg border',
            cat.activa ? 'bg-white' : 'bg-gray-100 opacity-60'
          ]"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :style="{ backgroundColor: cat.color + '20', color: cat.color }"
            >
              <i :class="['pi', cat.icono]"></i>
            </div>
            <div>
              <p class="font-medium text-gray-900">{{ cat.nombre }}</p>
              <p v-if="cat.descripcion" class="text-sm text-gray-500">{{ cat.descripcion }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="abrirModalCategoria('ingreso', cat)" class="btn-outline btn-sm">
              <i class="pi pi-pencil"></i>
            </button>
            <button
              @click="toggleCategoriaIngreso(cat.id)"
              :class="['btn-outline btn-sm', cat.activa ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200']"
            >
              <i :class="['pi', cat.activa ? 'pi-ban' : 'pi-check']"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Cuenta -->
    <UiModalBase
      :visible="modalCuenta"
      :titulo="editandoCuenta ? 'Editar Cuenta' : 'Nueva Cuenta'"
      @cerrar="modalCuenta = false"
    >
      <form @submit.prevent="guardarCuenta" class="space-y-4">
        <div>
          <label class="label">Nombre *</label>
          <input v-model="formCuenta.nombre" type="text" class="input" required />
        </div>

        <div>
          <label class="label">Tipo *</label>
          <select v-model="formCuenta.tipo" class="input">
            <option v-for="t in tiposCuenta" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>

        <div v-if="formCuenta.tipo === 'banco'">
          <label class="label">Banco</label>
          <input v-model="formCuenta.banco" type="text" class="input" />
        </div>

        <div v-if="formCuenta.tipo === 'banco'">
          <label class="label">Número de cuenta</label>
          <input v-model="formCuenta.numero_cuenta" type="text" class="input" />
        </div>

        <div v-if="!editandoCuenta">
          <label class="label">Saldo inicial</label>
          <input v-model.number="formCuenta.saldo_actual" type="number" step="0.01" class="input" />
        </div>

        <div>
          <label class="label">Color</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in coloresDisponibles"
              :key="color"
              type="button"
              @click="formCuenta.color = color"
              :class="['w-8 h-8 rounded-lg border-2 transition-transform', formCuenta.color === color ? 'border-gray-900 scale-110' : 'border-transparent']"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex gap-3">
          <button @click="modalCuenta = false" class="btn-outline flex-1">Cancelar</button>
          <button @click="guardarCuenta" :disabled="guardandoCuenta" class="btn-primary flex-1">
            <i v-if="guardandoCuenta" class="pi pi-spinner pi-spin"></i>
            Guardar
          </button>
        </div>
      </template>
    </UiModalBase>

    <!-- Modal: Categoría -->
    <UiModalBase
      :visible="modalCategoria"
      :titulo="editandoCategoria ? 'Editar Categoría' : 'Nueva Categoría'"
      @cerrar="modalCategoria = false"
    >
      <form @submit.prevent="guardarCategoria" class="space-y-4">
        <div>
          <label class="label">Nombre *</label>
          <input v-model="formCategoria.nombre" type="text" class="input" required />
        </div>

        <div>
          <label class="label">Descripción</label>
          <input v-model="formCategoria.descripcion" type="text" class="input" />
        </div>

        <div>
          <label class="label">Icono</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="icono in iconosDisponibles"
              :key="icono"
              type="button"
              @click="formCategoria.icono = icono"
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all',
                formCategoria.icono === icono ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              ]"
            >
              <i :class="['pi', icono]"></i>
            </button>
          </div>
        </div>

        <div>
          <label class="label">Color</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in coloresDisponibles"
              :key="color"
              type="button"
              @click="formCategoria.color = color"
              :class="['w-8 h-8 rounded-lg border-2 transition-transform', formCategoria.color === color ? 'border-gray-900 scale-110' : 'border-transparent']"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex gap-3">
          <button @click="modalCategoria = false" class="btn-outline flex-1">Cancelar</button>
          <button @click="guardarCategoria" :disabled="guardandoCategoria" class="btn-primary flex-1">
            <i v-if="guardandoCategoria" class="pi pi-spinner pi-spin"></i>
            Guardar
          </button>
        </div>
      </template>
    </UiModalBase>
  </div>
</template>
