<script setup lang="ts">
const { notificaciones, eliminar } = useNotificaciones()

// Colores por tipo de notificación
const colores = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

// Iconos por tipo
const iconos = {
  success: 'pi-check-circle',
  error: 'pi-times-circle',
  warning: 'pi-exclamation-triangle',
  info: 'pi-info-circle'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 space-y-2 w-80 max-w-[calc(100vw-2rem)]">
      <TransitionGroup name="toast">
        <div
          v-for="notif in notificaciones"
          :key="notif.id"
          :class="[
            'p-4 rounded-lg border shadow-lg flex items-start gap-3',
            colores[notif.tipo]
          ]"
        >
          <i :class="['pi', iconos[notif.tipo], 'text-lg mt-0.5']"></i>

          <div class="flex-1 min-w-0">
            <p class="font-medium">{{ notif.titulo }}</p>
            <p v-if="notif.mensaje" class="text-sm mt-0.5 opacity-90">
              {{ notif.mensaje }}
            </p>
          </div>

          <button
            @click="eliminar(notif.id)"
            class="p-1 hover:opacity-70 transition-opacity"
            aria-label="Cerrar notificación"
          >
            <i class="pi pi-times text-sm"></i>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
