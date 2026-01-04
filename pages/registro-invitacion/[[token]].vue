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

// Verificar token
const verificarToken = async () => {
  if (!token.value) {
    mostrarError('Error', 'Por favor ingresa el código de invitación')
    return
  }

  verificando.value = true

  try {
    const inv = await verificarInvitacion(token.value)

    if (!inv) {
      mostrarError('Invitación inválida', 'El código no existe o ha expirado')
      return
    }

    invitacion.value = inv
    paso.value = 'registro'
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    verificando.value = false
  }
}

// Registrar usuario
const handleRegistro = async () => {
  if (!invitacion.value) return

  if (password.value !== confirmarPassword.value) {
    mostrarError('Error', 'Las contraseñas no coinciden')
    return
  }

  if (password.value.length < 6) {
    mostrarError('Error', 'La contraseña debe tener al menos 6 caracteres')
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

    let mensaje = err.message || 'Error desconocido'

    if (err.message?.includes('already registered') || err.message?.includes('already exists')) {
      mensaje = 'Ya existe una cuenta con este email'
    } else if (err.message?.includes('password')) {
      mensaje = 'La contraseña debe tener al menos 6 caracteres'
    } else if (err.status === 422) {
      mensaje = 'Error de validación. Verifica que el email sea válido y la contraseña tenga al menos 6 caracteres.'
    }

    mostrarError('Error al registrar', mensaje)
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
