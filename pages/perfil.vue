<script setup lang="ts">
const { usuarioActual, cargarPerfil } = useAuth()
const { exito, error: mostrarError } = useNotificaciones()
const supabase = useSupabaseClient()

// Estado
const guardando = ref(false)
const cambiandoPassword = ref(false)

// Formulario de perfil
const formPerfil = ref({
  nombre: '',
  apellido: ''
})

// Formulario de contraseña
const formPassword = ref({
  passwordActual: '',
  passwordNueva: '',
  confirmarPassword: ''
})

// Sincronizar con usuario actual
watch(usuarioActual, (user) => {
  if (user) {
    formPerfil.value = {
      nombre: user.nombre,
      apellido: user.apellido
    }
  }
}, { immediate: true })

// Guardar perfil
const guardarPerfil = async () => {
  if (!usuarioActual.value) return

  guardando.value = true
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({
        nombre: formPerfil.value.nombre,
        apellido: formPerfil.value.apellido
      })
      .eq('id', usuarioActual.value.id)

    if (error) throw error

    await cargarPerfil()
    exito('Perfil actualizado')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    guardando.value = false
  }
}

// Cambiar contraseña
const cambiarPassword = async () => {
  if (formPassword.value.passwordNueva !== formPassword.value.confirmarPassword) {
    mostrarError('Error', 'Las contraseñas no coinciden')
    return
  }

  if (formPassword.value.passwordNueva.length < 6) {
    mostrarError('Error', 'La contraseña debe tener al menos 6 caracteres')
    return
  }

  cambiandoPassword.value = true
  try {
    const { error } = await supabase.auth.updateUser({
      password: formPassword.value.passwordNueva
    })

    if (error) throw error

    formPassword.value = {
      passwordActual: '',
      passwordNueva: '',
      confirmarPassword: ''
    }
    exito('Contraseña actualizada')
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    cambiandoPassword.value = false
  }
}

// Nombre del rol
const nombreRol = computed(() => {
  const roles: Record<string, string> = {
    administrador: 'Administrador/a',
    tesorero: 'Tesorero/a',
    encargado_compras: 'Encargado/a de Compras'
  }
  return roles[usuarioActual.value?.rol || ''] || ''
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Mi Perfil</h1>
      <p class="text-gray-500 mt-1">Administra tu información personal</p>
    </div>

    <!-- Info del usuario -->
    <div class="card">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold">
          {{ usuarioActual?.nombre?.charAt(0) || 'U' }}
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">
            {{ usuarioActual?.nombre }} {{ usuarioActual?.apellido }}
          </h2>
          <p class="text-gray-500">{{ usuarioActual?.email }}</p>
          <span class="badge badge-info mt-2">{{ nombreRol }}</span>
        </div>
      </div>
    </div>

    <!-- Formulario de perfil -->
    <form @submit.prevent="guardarPerfil" class="card space-y-4">
      <h3 class="font-semibold text-gray-900">Información Personal</h3>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="nombre" class="label">Nombre</label>
          <input
            id="nombre"
            v-model="formPerfil.nombre"
            type="text"
            class="input"
            required
          />
        </div>
        <div>
          <label for="apellido" class="label">Apellido</label>
          <input
            id="apellido"
            v-model="formPerfil.apellido"
            type="text"
            class="input"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        :disabled="guardando"
        class="btn-primary"
      >
        <i v-if="guardando" class="pi pi-spinner pi-spin"></i>
        <i v-else class="pi pi-check"></i>
        Guardar Cambios
      </button>
    </form>

    <!-- Cambiar contraseña -->
    <form @submit.prevent="cambiarPassword" class="card space-y-4">
      <h3 class="font-semibold text-gray-900">Cambiar Contraseña</h3>

      <div>
        <label for="password-nueva" class="label">Nueva contraseña</label>
        <input
          id="password-nueva"
          v-model="formPassword.passwordNueva"
          type="password"
          class="input"
          placeholder="Mínimo 6 caracteres"
          required
        />
      </div>

      <div>
        <label for="confirmar-password" class="label">Confirmar contraseña</label>
        <input
          id="confirmar-password"
          v-model="formPassword.confirmarPassword"
          type="password"
          class="input"
          required
        />
      </div>

      <button
        type="submit"
        :disabled="cambiandoPassword"
        class="btn-primary"
      >
        <i v-if="cambiandoPassword" class="pi pi-spinner pi-spin"></i>
        <i v-else class="pi pi-lock"></i>
        Cambiar Contraseña
      </button>
    </form>
  </div>
</template>
