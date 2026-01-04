<script setup lang="ts">
// Layout para páginas de autenticación (login, registro)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo y título -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
          <i class="pi pi-heart-fill text-white text-3xl"></i>
        </div>
        <h1 class="text-2xl font-bold text-white">Sistema Animalistas</h1>
        <p class="text-white/80 mt-1">Control Financiero</p>
      </div>

      <!-- Contenido (formulario) -->
      <div class="bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <slot />
      </div>

      <!-- Footer -->
      <p class="text-center text-white/60 text-sm mt-6">
        Ayudando a los animalitos de la calle
      </p>
    </div>
  </div>
</template>
