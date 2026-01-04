<script setup lang="ts">
const { usuarioActual, esTesorero, esAdmin } = useAuth()
const { configuracion, formatearMoneda, cargarConfiguracion } = useConfiguracion()
const { cuentasActivas, saldoTotal, cargarCuentas } = useCuentas()
const { comprasPendientes, cargarCompras } = useCompras()
const { ingresos, cargarIngresos } = useIngresos()

// Cargar datos al montar
onMounted(async () => {
  await Promise.all([
    cargarConfiguracion(),
    cargarCuentas(),
    cargarCompras(),
    cargarIngresos()
  ])
})

// Calcular ingresos del mes actual
const ingresosMesActual = computed(() => {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  return ingresos.value
    .filter(i => new Date(i.fecha_deposito) >= inicioMes)
    .reduce((sum, i) => sum + Number(i.monto), 0)
})

// Calcular egresos del mes actual (solo aprobadas)
const egresosMesActual = computed(() => {
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  return comprasPendientes.value
    .filter(c => c.estado === 'aprobada' && new Date(c.fecha_compra) >= inicioMes)
    .reduce((sum, c) => sum + Number(c.monto), 0)
})

// Nombre del mes actual
const nombreMes = computed(() => {
  return new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
})
</script>

<template>
  <div class="space-y-6">
    <!-- Saludo -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        ¡Hola, {{ usuarioActual?.nombre }}!
      </h1>
      <p class="text-gray-500 mt-1">
        Bienvenido/a al sistema de control financiero
      </p>
    </div>

    <!-- Tarjetas de estadísticas -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UiTarjetaEstadistica
        titulo="Saldo Total"
        :valor="formatearMoneda(saldoTotal)"
        icono="pi-wallet"
        color="blue"
      />

      <UiTarjetaEstadistica
        titulo="Compras Pendientes"
        :valor="comprasPendientes.length"
        icono="pi-clock"
        color="yellow"
      />

      <UiTarjetaEstadistica
        v-if="esTesorero || esAdmin"
        titulo="Ingresos del Mes"
        :valor="formatearMoneda(ingresosMesActual)"
        icono="pi-arrow-down"
        color="green"
      />

      <UiTarjetaEstadistica
        v-if="esTesorero || esAdmin"
        titulo="Egresos del Mes"
        :valor="formatearMoneda(egresosMesActual)"
        icono="pi-arrow-up"
        color="red"
      />
    </div>

    <!-- Saldos por cuenta -->
    <div class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        <i class="pi pi-credit-card mr-2 text-gray-400"></i>
        Saldos por Cuenta
      </h2>

      <div v-if="cuentasActivas.length === 0" class="text-center py-8 text-gray-500">
        <i class="pi pi-inbox text-4xl mb-2"></i>
        <p>No hay cuentas configuradas</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="cuenta in cuentasActivas"
          :key="cuenta.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
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
              <p class="text-xs text-gray-500 capitalize">{{ cuenta.tipo }}</p>
            </div>
          </div>
          <span class="font-semibold text-gray-900">
            {{ formatearMoneda(Number(cuenta.saldo_actual)) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Accesos rápidos -->
    <div class="grid grid-cols-2 gap-4">
      <NuxtLink
        to="/compras/nueva"
        class="card-hover flex flex-col items-center justify-center py-6 text-center"
      >
        <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
          <i class="pi pi-plus text-xl text-primary-600"></i>
        </div>
        <span class="font-medium text-gray-900">Nueva Compra</span>
      </NuxtLink>

      <NuxtLink
        v-if="esTesorero || esAdmin"
        to="/ingresos/nuevo"
        class="card-hover flex flex-col items-center justify-center py-6 text-center"
      >
        <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
          <i class="pi pi-plus text-xl text-green-600"></i>
        </div>
        <span class="font-medium text-gray-900">Nuevo Ingreso</span>
      </NuxtLink>

      <NuxtLink
        v-if="esTesorero || esAdmin"
        to="/tesoreria/revisar"
        class="card-hover flex flex-col items-center justify-center py-6 text-center"
      >
        <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-3">
          <i class="pi pi-check-square text-xl text-yellow-600"></i>
        </div>
        <span class="font-medium text-gray-900">Revisar Compras</span>
        <span v-if="comprasPendientes.length > 0" class="text-xs text-yellow-600 mt-1">
          {{ comprasPendientes.length }} pendiente(s)
        </span>
      </NuxtLink>

      <NuxtLink
        to="/compras"
        class="card-hover flex flex-col items-center justify-center py-6 text-center"
      >
        <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
          <i class="pi pi-list text-xl text-blue-600"></i>
        </div>
        <span class="font-medium text-gray-900">Ver Compras</span>
      </NuxtLink>
    </div>
  </div>
</template>
