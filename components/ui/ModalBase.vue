<script setup lang="ts">
interface Props {
  visible: boolean
  titulo?: string
  ancho?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  titulo: '',
  ancho: 'md'
})

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()

// Clases de ancho
const anchoClases = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4'
}

// Cerrar con Escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.visible) {
      emit('cerrar')
    }
  }
  document.addEventListener('keydown', handleEscape)
  onUnmounted(() => document.removeEventListener('keydown', handleEscape))
})

// Prevenir scroll del body cuando está abierto
watch(() => props.visible, (visible) => {
  if (visible) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Overlay -->
        <div
          class="absolute inset-0 bg-black/50"
          @click="emit('cerrar')"
        ></div>

        <!-- Modal -->
        <div
          :class="[
            'relative bg-white rounded-xl shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col',
            anchoClases[ancho]
          ]"
        >
          <!-- Header -->
          <div v-if="titulo || $slots.header" class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <slot name="header">
              <h2 class="text-lg font-semibold text-gray-900">{{ titulo }}</h2>
            </slot>
            <button
              @click="emit('cerrar')"
              class="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              aria-label="Cerrar"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Contenido -->
          <div class="flex-1 overflow-y-auto p-4">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
