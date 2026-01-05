<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const supabase = useSupabaseClient()
const { exito, error: mostrarError } = useNotificaciones()

// Estado
const paso = ref(1)
const cargando = ref(false)
const yaConfigurado = ref(false)
const verificando = ref(true)

// Formulario
const email = ref('')
const password = ref('')
const confirmarPassword = ref('')
const nombre = ref('')
const apellido = ref('')
const mostrarPassword = ref(false)

// Estado de error visible en el formulario
const errorMensaje = ref('')
const errorTitulo = ref('')

// Limpiar error cuando el usuario interactúa
watch([email, password, confirmarPassword, nombre, apellido], () => {
  if (errorMensaje.value) {
    errorMensaje.value = ''
    errorTitulo.value = ''
  }
})

// Verificar si ya existe un administrador
onMounted(async () => {
  try {
    const { data } = await supabase
      .from('usuarios')
      .select('id')
      .eq('rol', 'administrador')
      .limit(1)

    if (data && data.length > 0) {
      yaConfigurado.value = true
    }
  } catch (err) {
    console.log('Verificando estado del sistema...')
  } finally {
    verificando.value = false
  }
})

// Crear el administrador
const crearAdmin = async () => {
  // Limpiar error anterior
  errorMensaje.value = ''
  errorTitulo.value = ''

  // Validaciones
  if (!email.value || !password.value || !nombre.value || !apellido.value) {
    errorTitulo.value = 'Campos incompletos'
    errorMensaje.value = 'Todos los campos son requeridos'
    return
  }

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
    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    // 2. Crear perfil usando función RPC (bypasea RLS de forma segura)
    const { data: perfilData, error: perfilError } = await supabase.rpc('crear_perfil_usuario', {
      user_id: authData.user.id,
      user_email: email.value,
      user_nombre: nombre.value,
      user_apellido: apellido.value,
      user_rol: 'administrador'
    })

    if (perfilError) throw perfilError

    exito('¡Administrador creado!', 'Ya puedes iniciar sesión')
    paso.value = 2

  } catch (err: any) {
    console.error('Error completo al crear admin:', err)

    const mensajeOriginal = err.message || err.error_description || ''

    let titulo = 'Error al crear administrador'
    let mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.'

    if (mensajeOriginal.toLowerCase().includes('user already registered') ||
        mensajeOriginal.toLowerCase().includes('already exists') ||
        mensajeOriginal.toLowerCase().includes('already')) {
      titulo = 'Cuenta existente'
      mensaje = 'Ya existe un usuario con este correo electrónico. Intenta iniciar sesión.'
    } else if (mensajeOriginal.toLowerCase().includes('password')) {
      titulo = 'Contraseña inválida'
      mensaje = 'La contraseña debe tener al menos 6 caracteres'
    } else if (mensajeOriginal.toLowerCase().includes('email')) {
      titulo = 'Email inválido'
      mensaje = 'El formato del correo electrónico no es válido'
    } else if (err.status === 422 || mensajeOriginal.includes('422')) {
      titulo = 'Error de validación'
      mensaje = 'Verifica que los datos sean correctos.'
    } else if (mensajeOriginal.toLowerCase().includes('failed to fetch') ||
               mensajeOriginal.toLowerCase().includes('network')) {
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
</script>

<template>
  <div>
    <!-- Verificando -->
    <div v-if="verificando" class="text-center py-8">
      <i class="pi pi-spinner pi-spin text-3xl text-primary-500"></i>
      <p class="text-gray-500 mt-2">Verificando sistema...</p>
    </div>

    <!-- Ya configurado -->
    <template v-else-if="yaConfigurado">
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-check text-3xl text-green-600"></i>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Sistema Ya Configurado
        </h2>
        <p class="text-gray-500 mb-6">
          Ya existe un administrador. Inicia sesión para continuar.
        </p>
        <NuxtLink to="/login" class="btn-primary">
          Ir al Login
        </NuxtLink>
      </div>
    </template>

    <!-- Paso 1: Crear admin -->
    <template v-else-if="paso === 1">
      <h2 class="text-xl font-semibold text-gray-900 mb-2 text-center">
        Configuración Inicial
      </h2>
      <p class="text-gray-500 text-sm text-center mb-6">
        Crea la cuenta de administrador para comenzar
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

      <form @submit.prevent="crearAdmin" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label for="nombre" class="label">Nombre *</label>
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
            <label for="apellido" class="label">Apellido *</label>
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
          <label for="email" class="label">Correo electrónico *</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="input"
            placeholder="admin@tuorganizacion.com"
            required
          />
        </div>

        <div>
          <label for="password" class="label">Contraseña *</label>
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
          <label for="confirmar" class="label">Confirmar Contraseña *</label>
          <input
            id="confirmar"
            v-model="confirmarPassword"
            :type="mostrarPassword ? 'text' : 'password'"
            class="input"
            placeholder="Repite tu contraseña"
            required
          />
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <i class="pi pi-info-circle mr-1"></i>
            Esta cuenta tendrá rol de <strong>Administrador</strong> con acceso completo al sistema.
          </p>
        </div>

        <button
          type="submit"
          :disabled="cargando"
          class="btn-primary w-full"
        >
          <i v-if="cargando" class="pi pi-spinner pi-spin"></i>
          <span v-else>Crear Administrador</span>
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-gray-500">
        <NuxtLink to="/login" class="text-primary-600 hover:text-primary-700">
          ¿Ya tienes cuenta? Inicia sesión
        </NuxtLink>
      </p>
    </template>

    <!-- Paso 2: Éxito -->
    <template v-else>
      <div class="text-center">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-check text-3xl text-green-600"></i>
        </div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          ¡Configuración Completa!
        </h2>
        <p class="text-gray-500 mb-6">
          Tu cuenta de administrador ha sido creada exitosamente.
        </p>
        <NuxtLink to="/login" class="btn-primary">
          Ir al Login
        </NuxtLink>
      </div>
    </template>
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
