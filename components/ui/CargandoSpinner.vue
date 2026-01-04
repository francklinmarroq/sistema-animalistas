<script setup lang="ts">
interface Props {
  texto?: string
  tamano?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  texto: 'Cargando...',
  tamano: 'md'
})

const tamanoClases = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-8">
    <div :class="['animate-spin rounded-full border-3 border-gray-200 border-t-primary-500', tamanoClases[tamano]]"></div>
    <p v-if="texto" class="text-sm text-gray-500">{{ texto }}</p>
  </div>
</template>

<style scoped>
.border-3 {
  border-width: 3px;
}
</style>
