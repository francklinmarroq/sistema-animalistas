<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const { iniciarSesion } = useAuth()
const { error: mostrarError } = useNotificaciones()

// Estado del formulario
const email = ref('')
const password = ref('')
const cargando = ref(false)
const mostrarPassword = ref(false)

// Manejar inicio de sesión
const handleLogin = async () => {
  if (!email.value || !password.value) {
    mostrarError('Error', 'Por favor completa todos los campos')
    return
  }

  cargando.value = true

  try {
    await iniciarSesion(email.value, password.value)
    await navigateTo('/')
  } catch (err: any) {
    console.error('Error de login:', err)
    mostrarError('Error al iniciar sesión', err.message || 'Credenciales incorrectas')
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-6 text-center">
      Iniciar Sesión
    </h2>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email -->
      <div>
        <label for="email" class="label">Correo electrónico</label>
        <div class="relative">
          <i class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            id="email"
            v-model="email"
            type="email"
            class="input pl-10"
            placeholder="tu@email.com"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <!-- Contraseña -->
      <div>
        <label for="password" class="label">Contraseña</label>
        <div class="relative">
          <i class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            id="password"
            v-model="password"
            :type="mostrarPassword ? 'text' : 'password'"
            class="input pl-10 pr-10"
            placeholder="Tu contraseña"
            autocomplete="current-password"
            required
          />
          <button
            type="button"
            @click="mostrarPassword = !mostrarPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <i :class="['pi', mostrarPassword ? 'pi-eye-slash' : 'pi-eye']"></i>
          </button>
        </div>
      </div>

      <!-- Botón de envío -->
      <button
        type="submit"
        :disabled="cargando"
        class="btn-primary w-full"
      >
        <i v-if="cargando" class="pi pi-spinner pi-spin"></i>
        <span v-else>Iniciar Sesión</span>
      </button>
    </form>

    <!-- Link de registro -->
    <p class="mt-6 text-center text-sm text-gray-500">
      ¿Tienes una invitación?
      <NuxtLink to="/registro-invitacion" class="text-primary-600 hover:text-primary-700 font-medium">
        Regístrate aquí
      </NuxtLink>
    </p>
  </div>
</template>
