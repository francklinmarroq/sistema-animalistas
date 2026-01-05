<script setup lang="ts">
import type { Invitacion } from '~/types'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const { registrarUsuario } = useAuth()
const { verificarInvitacion, marcarInvitacionUsada } = useUsuarios()
const { exito, error: mostrarError } = useNotificaciones()

// Estado
const token = ref(route.params.token as string || '')
const invitacion = ref<Invitacion | null>(null)
const verificando = ref(false)
const cargando = ref(false)
const paso = ref<'token' | 'registro'>(route.params.token ? 'token' : 'token')

// Datos del formulario
const nombre = ref('')
const apellido = ref('')
const password = ref('')
const confirmarPassword = ref('')
const mostrarPassword = ref(false)

// Estado de error visible en el formulario
const errorMensaje = ref('')
const errorTitulo = ref('')

// Limpiar error cuando el usuario interactúa
watch([token, nombre, apellido, password, confirmarPassword], () => {
  if (errorMensaje.value) {
    errorMensaje.value = ''
    errorTitulo.value = ''
  }
})

// Verificar token
const verificarToken = async () => {
  // Limpiar error anterior
  errorMensaje.value = ''
  errorTitulo.value = ''

  if (!token.value) {
    errorTitulo.value = 'Código requerido'
    errorMensaje.value = 'Por favor ingresa el código de invitación'
    return
  }

  verificando.value = true

  try {
    const inv = await verificarInvitacion(token.value)

    if (!inv) {
      errorTitulo.value = 'Invitación inválida'
      errorMensaje.value = 'El código no existe, ya fue usado o ha expirado. Solicita una nueva invitación.'
      mostrarError('Invitación inválida', 'El código no existe o ha expirado')
      return
    }

    invitacion.value = inv
    paso.value = 'registro'
  } catch (err: any) {
    errorTitulo.value = 'Error de verificación'
    errorMensaje.value = err.message || 'No se pudo verificar el código de invitación'
    mostrarError('Error', err.message)
  } finally {
    verificando.value = false
  }
}

// Registrar usuario
const handleRegistro = async () => {
  // Limpiar error anterior
  errorMensaje.value = ''
  errorTitulo.value = ''

  if (!invitacion.value) return

  if (password.value !== confirmarPassword.value) {
    errorTitulo.value = 'Contraseñas no coinciden'
    errorMensaje.value = 'Las contraseñas que ingresaste no coinciden. Verifica e intenta de nuevo.'
    return
  }

  if (password.value.length < 6) {
    errorTitulo.value = 'Contraseña muy corta'
    errorMensaje.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  cargando.value = true

  try {
    await registrarUsuario(
      invitacion.value.email,
      password.value,
      nombre.value,
      apellido.value,
      invitacion.value.rol
    )

    // Intentar marcar la invitación como usada (puede fallar por RLS, pero no es crítico)
    try {
      await marcarInvitacionUsada(invitacion.value.id)
    } catch (e) {
      console.warn('No se pudo marcar la invitación como usada:', e)
    }

    exito('¡Registro exitoso!', 'Ahora puedes iniciar sesión')
    await navigateTo('/login')
  } catch (err: any) {
    console.error('Error completo:', err)

    const mensajeOriginal = err.message || err.error_description || ''

    let titulo = 'Error al registrar'
    let mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.'

    if (mensajeOriginal.toLowerCase().includes('already registered') ||
        mensajeOriginal.toLowerCase().includes('already exists') ||
        mensajeOriginal.toLowerCase().includes('user already')) {
      titulo = 'Cuenta existente'
      mensaje = 'Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión.'
    } else if (mensajeOriginal.toLowerCase().includes('password')) {
      titulo = 'Contraseña inválida'
      mensaje = 'La contraseña debe tener al menos 6 caracteres'
    } else if (mensajeOriginal.toLowerCase().includes('email')) {
      titulo = 'Email inválido'
      mensaje = 'El formato del correo electrónico no es válido'
    } else if (err.status === 422) {
      titulo = 'Error de validación'
      mensaje = 'Verifica que el email sea válido y la contraseña tenga al menos 6 caracteres.'
    } else if (mensajeOriginal.toLowerCase().includes('network') ||
               mensajeOriginal.toLowerCase().includes('fetch')) {
      titulo = 'Error de conexión'
      mensaje = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
    } else if (mensajeOriginal) {
      mensaje = mensajeOriginal
    }

    // Mostrar error en el formulario
    errorTitulo.value = titulo
    errorMensaje.value = mensaje

    // También mostrar como toast
    mostrarError(titulo, mensaje)
  } finally {
    cargando.value = false
  }
}

// Verificar token al cargar si viene en la URL
onMounted(async () => {
  if (route.params.token) {
    await verificarToken()
  }
})

// Nombre del rol en español
const nombreRol = computed(() => {
  const roles: Record<string, string> = {
    administrador: 'Administrador/a',
    tesorero: 'Tesorero/a',
    encargado_compras: 'Encargado/a de Compras'
  }
  return roles[invitacion.value?.rol || ''] || ''
})
</script>

<template>
  <div>
    <!-- Paso 1: Ingresar token -->
    <template v-if="paso === 'token'">
      <h2 class="text-xl font-semibold text-gray-900 mb-2 text-center">
        Registro con Invitación
      </h2>
      <p class="text-gray-500 text-sm text-center mb-6">
        Ingresa el código de invitación que recibiste
      </p>

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

      <form @submit.prevent="verificarToken" class="space-y-4">
        <div>
          <label for="token" class="label">Código de invitación</label>
          <input
            id="token"
            v-model="token"
            type="text"
            class="input text-center font-mono"
            placeholder="abc123..."
            required
          />
        </div>

        <button
          type="submit"
          :disabled="verificando"
          class="btn-primary w-full"
        >
          <i v-if="verificando" class="pi pi-spinner pi-spin"></i>
          <span v-else>Verificar Código</span>
        </button>
      </form>
    </template>

    <!-- Paso 2: Formulario de registro -->
    <template v-else>
      <h2 class="text-xl font-semibold text-gray-900 mb-2 text-center">
        Completa tu Registro
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

      <!-- Info de la invitación -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
        <p class="text-sm text-green-800">
          <i class="pi pi-check-circle mr-1"></i>
          Invitación válida para <strong>{{ invitacion?.email }}</strong>
        </p>
        <p class="text-xs text-green-600 mt-1">
          Rol asignado: {{ nombreRol }}
        </p>
      </div>

      <form @submit.prevent="handleRegistro" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="nombre" class="label">Nombre</label>
            <input
              id="nombre"
              v-model="nombre"
              type="text"
              class="input"
              placeholder="Tu nombre"
              required
            />
          </div>
          <div>
            <label for="apellido" class="label">Apellido</label>
            <input
              id="apellido"
              v-model="apellido"
              type="text"
              class="input"
              placeholder="Tu apellido"
              required
            />
          </div>
        </div>

        <div>
          <label for="password" class="label">Contraseña</label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="mostrarPassword ? 'text' : 'password'"
              class="input pr-10"
              placeholder="Mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              @click="mostrarPassword = !mostrarPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <i :class="['pi', mostrarPassword ? 'pi-eye-slash' : 'pi-eye']"></i>
            </button>
          </div>
        </div>

        <div>
          <label for="confirmar" class="label">Confirmar Contraseña</label>
          <input
            id="confirmar"
            v-model="confirmarPassword"
            :type="mostrarPassword ? 'text' : 'password'"
            class="input"
            placeholder="Repite tu contraseña"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="cargando"
          class="btn-primary w-full"
        >
          <i v-if="cargando" class="pi pi-spinner pi-spin"></i>
          <span v-else>Crear Cuenta</span>
        </button>
      </form>
    </template>

    <p class="mt-6 text-center text-sm text-gray-500">
      ¿Ya tienes cuenta?
      <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
        Inicia sesión
      </NuxtLink>
    </p>
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
