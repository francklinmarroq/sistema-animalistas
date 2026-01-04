<script setup lang="ts">
interface Props {
  accept?: string
  maxSize?: number // en MB
  preview?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*,.pdf',
  maxSize: 5,
  preview: true
})

const emit = defineEmits<{
  (e: 'archivo', archivo: File | null): void
}>()

const archivo = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const arrastrando = ref(false)
const error = ref<string | null>(null)

const inputRef = ref<HTMLInputElement | null>(null)

// Abrir selector de archivos
const abrirSelector = () => {
  inputRef.value?.click()
}

// Procesar archivo seleccionado
const procesarArchivo = (file: File) => {
  error.value = null

  // Validar tamaño
  const sizeMB = file.size / (1024 * 1024)
  if (sizeMB > props.maxSize) {
    error.value = `El archivo es muy grande. Máximo ${props.maxSize}MB`
    return
  }

  archivo.value = file
  emit('archivo', file)

  // Generar preview si es imagen
  if (props.preview && file.type.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(file)
  } else {
    previewUrl.value = null
  }
}

// Manejar selección desde input
const onInputChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    procesarArchivo(input.files[0])
  }
}

// Manejar drag & drop
const onDrop = (e: DragEvent) => {
  arrastrando.value = false
  if (e.dataTransfer?.files?.[0]) {
    procesarArchivo(e.dataTransfer.files[0])
  }
}

// Eliminar archivo
const eliminarArchivo = () => {
  archivo.value = null
  previewUrl.value = null
  error.value = null
  emit('archivo', null)
  if (inputRef.value) {
    inputRef.value.value = ''
  }
}

// Limpiar URL de preview al desmontar
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

// Determinar si es PDF
const esPDF = computed(() => archivo.value?.type === 'application/pdf')
</script>

<template>
  <div class="space-y-2">
    <!-- Área de drop -->
    <div
      v-if="!archivo"
      @click="abrirSelector"
      @dragover.prevent="arrastrando = true"
      @dragleave.prevent="arrastrando = false"
      @drop.prevent="onDrop"
      :class="[
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
        arrastrando ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
      ]"
    >
      <i class="pi pi-cloud-upload text-3xl text-gray-400 mb-2"></i>
      <p class="text-sm text-gray-600">
        Arrastra un archivo aquí o <span class="text-primary-600 font-medium">haz clic para seleccionar</span>
      </p>
      <p class="text-xs text-gray-400 mt-1">
        Máximo {{ maxSize }}MB
      </p>
    </div>

    <!-- Preview del archivo -->
    <div v-else class="relative">
      <!-- Preview de imagen -->
      <div v-if="previewUrl" class="relative rounded-lg overflow-hidden">
        <img
          :src="previewUrl"
          :alt="archivo.name"
          class="w-full h-48 object-cover"
        />
      </div>

      <!-- Preview de PDF -->
      <div v-else-if="esPDF" class="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
        <i class="pi pi-file-pdf text-3xl text-red-500"></i>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">{{ archivo.name }}</p>
          <p class="text-xs text-gray-500">{{ (archivo.size / 1024).toFixed(1) }} KB</p>
        </div>
      </div>

      <!-- Otro tipo de archivo -->
      <div v-else class="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
        <i class="pi pi-file text-3xl text-gray-400"></i>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 truncate">{{ archivo.name }}</p>
          <p class="text-xs text-gray-500">{{ (archivo.size / 1024).toFixed(1) }} KB</p>
        </div>
      </div>

      <!-- Botón eliminar -->
      <button
        @click="eliminarArchivo"
        class="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
        aria-label="Eliminar archivo"
      >
        <i class="pi pi-times text-sm"></i>
      </button>
    </div>

    <!-- Error -->
    <p v-if="error" class="text-sm text-red-500">
      <i class="pi pi-exclamation-circle mr-1"></i>
      {{ error }}
    </p>

    <!-- Input oculto -->
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      class="hidden"
      @change="onInputChange"
    />
  </div>
</template>
