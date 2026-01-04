<script setup lang="ts">
// Página de confirmación de email de Supabase
definePageMeta({
  layout: 'auth'
})

const route = useRoute()

// Redirigir al login después de unos segundos
onMounted(() => {
  setTimeout(() => {
    navigateTo('/login')
  }, 3000)
})
</script>

<template>
  <div class="text-center">
    <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
      <i class="pi pi-check text-3xl text-green-600"></i>
    </div>

    <h2 class="text-xl font-semibold text-gray-900 mb-2">
      ¡Email Confirmado!
    </h2>

    <p class="text-gray-500 mb-4">
      Tu cuenta ha sido verificada correctamente.
      Serás redirigido al login en unos segundos...
    </p>

    <NuxtLink to="/login" class="btn-primary">
      Ir al Login
    </NuxtLink>
  </div>
</template>
