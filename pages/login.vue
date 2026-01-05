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

// Estado de error visible en el formulario
const errorMensaje = ref('')
const errorTitulo = ref('')

// Limpiar error cuando el usuario empieza a escribir
watch([email, password], () => {
  if (errorMensaje.value) {
    errorMensaje.value = ''
    errorTitulo.value = ''
  }
})

// Manejar inicio de sesión
const handleLogin = async () => {
  // Limpiar error anterior
  errorMensaje.value = ''
  errorTitulo.value = ''

  if (!email.value || !password.value) {
    errorTitulo.value = 'Campos incompletos'
    errorMensaje.value = 'Por favor completa todos los campos'
    return
  }

  cargando.value = true

  try {
    await iniciarSesion(email.value, password.value)
    await navigateTo('/')
  } catch (err: any) {
    console.error('Error de login:', err)

    // Obtener el mensaje de error de diferentes fuentes posibles
    const mensajeOriginal = err.message || err.error_description || err.msg || ''

    // Mensajes de error más claros en español
    let titulo = 'Error al iniciar sesión'
    let mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.'

    if (mensajeOriginal.toLowerCase().includes('invalid login credentials') ||
        mensajeOriginal.toLowerCase().includes('invalid credentials')) {
      titulo = 'Credenciales incorrectas'
      mensaje = 'El correo electrónico o la contraseña son incorrectos. Verifica tus datos e intenta de nuevo.'
    } else if (mensajeOriginal.toLowerCase().includes('email not confirmed') ||
               mensajeOriginal.toLowerCase().includes('not confirmed')) {
      titulo = 'Correo no confirmado'
      mensaje = 'Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.'
    } else if (mensajeOriginal.toLowerCase().includes('user not found')) {
      titulo = 'Usuario no encontrado'
      mensaje = 'No existe una cuenta con este correo electrónico. ¿Necesitas registrarte?'
    } else if (mensajeOriginal.toLowerCase().includes('too many requests') ||
               mensajeOriginal.toLowerCase().includes('rate limit')) {
      titulo = 'Demasiados intentos'
      mensaje = 'Has realizado demasiados intentos. Espera unos minutos antes de intentar de nuevo.'
    } else if (mensajeOriginal.toLowerCase().includes('network') ||
               mensajeOriginal.toLowerCase().includes('fetch')) {
      titulo = 'Error de conexión'
      mensaje = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
    } else if (mensajeOriginal) {
      // Si hay un mensaje pero no lo reconocemos, mostrarlo
      mensaje = mensajeOriginal
    }

    // Mostrar error en el formulario (siempre visible)
    errorTitulo.value = titulo
    errorMensaje.value = mensaje

    // También mostrar como toast
    mostrarError(titulo, mensaje)
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

    <!-- Mensaje de error visible -->
    <Transition name="fade">
      <div
        v-if="errorMensaje"
        class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <i class="pi pi-exclamation-circle text-red-500 text-lg mt-0.5"></i>
          <div>
            <p class="font-medium text-red-800">{{ errorTitulo }}</p>
            <p class="text-sm text-red-600 mt-1">{{ errorMensaje }}</p>
          </div>
        </div>
      </div>
    </Transition>

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

    <!-- Links -->
    <div class="mt-6 space-y-2 text-center text-sm text-gray-500">
      <p>
        ¿Tienes una invitación?
        <NuxtLink to="/registro-invitacion" class="text-primary-600 hover:text-primary-700 font-medium">
          Regístrate aquí
        </NuxtLink>
      </p>
      <p>
        ¿Primera vez?
        <NuxtLink to="/setup" class="text-primary-600 hover:text-primary-700 font-medium">
          Configurar sistema
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
