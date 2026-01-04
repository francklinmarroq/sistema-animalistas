<script setup lang="ts">
interface Props {
  titulo: string
  valor: string | number
  icono: string
  color?: 'primary' | 'green' | 'red' | 'yellow' | 'blue'
  tendencia?: number // Porcentaje de cambio
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary'
})

const coloresIcono = {
  primary: 'bg-primary-100 text-primary-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  blue: 'bg-blue-100 text-blue-600'
}
</script>

<template>
  <div class="card">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-gray-500 mb-1">{{ titulo }}</p>
        <p class="stat-value">{{ valor }}</p>

        <!-- Tendencia (opcional) -->
        <div v-if="tendencia !== undefined" class="mt-2 flex items-center gap-1">
          <i
            :class="[
              'pi text-xs',
              tendencia >= 0 ? 'pi-arrow-up text-green-500' : 'pi-arrow-down text-red-500'
            ]"
          ></i>
          <span
            :class="[
              'text-xs font-medium',
              tendencia >= 0 ? 'text-green-500' : 'text-red-500'
            ]"
          >
            {{ Math.abs(tendencia) }}%
          </span>
          <span class="text-xs text-gray-400">vs mes anterior</span>
        </div>
      </div>

      <div :class="['p-3 rounded-lg', coloresIcono[color]]">
        <i :class="['pi', icono, 'text-xl']"></i>
      </div>
    </div>
  </div>
</template>
