<script setup lang="ts">
import type { FormInvitacion, RolUsuario } from '~/types'

const { usuarios, invitaciones, invitacionesPendientes, cargando, cargarUsuarios, cargarInvitaciones, crearInvitacion, actualizarRolUsuario, desactivarUsuario, activarUsuario, eliminarInvitacion } = useUsuarios()
const { esAdmin, usuarioActual } = useAuth()
const { exito, error: mostrarError } = useNotificaciones()

// Verificar permisos
onMounted(() => {
  if (!esAdmin.value) {
    navigateTo('/')
  }
})

// Estado
const modalInvitacion = ref(false)
const enviandoInvitacion = ref(false)
const formularioInvitacion = ref<FormInvitacion>({
  email: '',
  rol: 'encargado_compras'
})

// Cargar datos
onMounted(async () => {
  await Promise.all([
    cargarUsuarios(),
    cargarInvitaciones()
  ])
})

// Roles disponibles
const roles: { value: RolUsuario; label: string }[] = [
  { value: 'administrador', label: 'Administrador/a' },
  { value: 'tesorero', label: 'Tesorero/a' },
  { value: 'encargado_compras', label: 'Encargado/a de Compras' }
]

// Nombre del rol
const nombreRol = (rol: string) => {
  return roles.find(r => r.value === rol)?.label || rol
}

// Enviar invitación
const enviarInvitacion = async () => {
  if (!formularioInvitacion.value.email) {
    mostrarError('Error', 'El email es requerido')
    return
  }

  enviandoInvitacion.value = true

  try {
    const invitacion = await crearInvitacion(formularioInvitacion.value, usuarioActual.value!.id)
    modalInvitacion.value = false
    formularioInvitacion.value = { email: '', rol: 'encargado_compras' }

    exito('Invitación creada', `Se ha generado un enlace de invitación para ${invitacion.email}`)
  } catch (err: any) {
    mostrarError('Error', err.message)
  } finally {
    enviandoInvitacion.value = false
  }
}

// Copiar enlace de invitación
const copiarEnlace = async (token: string) => {
  const url = `${window.location.origin}/registro-invitacion/${token}`
  await navigator.clipboard.writeText(url)
  exito('Enlace copiado', 'El enlace de invitación ha sido copiado al portapapeles')
}

// Cambiar rol de usuario
const cambiarRol = async (id: string, nuevoRol: RolUsuario) => {
  try {
    await actualizarRolUsuario(id, nuevoRol)
    exito('Rol actualizado', 'El rol del usuario ha sido actualizado')
  } catch (err: any) {
    mostrarError('Error', err.message)
  }
}

// Toggle estado de usuario
const toggleUsuario = async (id: string, activo: boolean) => {
  try {
    if (activo) {
      await desactivarUsuario(id)
      exito('Usuario desactivado')
    } else {
      await activarUsuario(id)
      exito('Usuario activado')
    }
  } catch (err: any) {
    mostrarError('Error', err.message)
  }
}

// Eliminar invitación
const handleEliminarInvitacion = async (id: string) => {
  try {
    await eliminarInvitacion(id)
    exito('Invitación eliminada')
  } catch (err: any) {
    mostrarError('Error', err.message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p class="text-gray-500 mt-1">Administra usuarios e invitaciones</p>
      </div>

      <button @click="modalInvitacion = true" class="btn-primary">
        <i class="pi pi-user-plus"></i>
        Invitar Usuario
      </button>
    </div>

    <!-- Invitaciones pendientes -->
    <div v-if="invitacionesPendientes.length > 0" class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        <i class="pi pi-envelope mr-2 text-yellow-500"></i>
        Invitaciones Pendientes ({{ invitacionesPendientes.length }})
      </h2>

      <div class="space-y-3">
        <div
          v-for="inv in invitacionesPendientes"
          :key="inv.id"
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
        >
          <div>
            <p class="font-medium text-gray-900">{{ inv.email }}</p>
            <p class="text-sm text-gray-500">
              {{ nombreRol(inv.rol) }} · Expira: {{ new Date(inv.fecha_expiracion).toLocaleDateString('es-MX') }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              @click="copiarEnlace(inv.token)"
              class="btn-outline btn-sm"
            >
              <i class="pi pi-copy"></i>
              Copiar enlace
            </button>
            <button
              @click="handleEliminarInvitacion(inv.id)"
              class="btn-danger btn-sm"
            >
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <UiCargandoSpinner v-if="cargando" texto="Cargando usuarios..." />

    <!-- Lista de usuarios -->
    <div v-else class="card">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">
        <i class="pi pi-users mr-2 text-gray-400"></i>
        Usuarios Registrados ({{ usuarios.length }})
      </h2>

      <div v-if="usuarios.length === 0" class="text-center py-8 text-gray-500">
        <i class="pi pi-users text-4xl mb-2"></i>
        <p>No hay usuarios registrados</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="usuario in usuarios"
          :key="usuario.id"
          :class="[
            'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border',
            usuario.activo ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'
          ]"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
              {{ usuario.nombre.charAt(0) }}
            </div>
            <div>
              <p class="font-medium text-gray-900">
                {{ usuario.nombre }} {{ usuario.apellido }}
                <span v-if="!usuario.activo" class="text-xs text-red-500 ml-2">(Desactivado)</span>
              </p>
              <p class="text-sm text-gray-500">{{ usuario.email }}</p>
            </div>
          </div>

          <div class="flex items-center gap-3 sm:gap-4">
            <!-- Selector de rol -->
            <select
              :value="usuario.rol"
              @change="cambiarRol(usuario.id, ($event.target as HTMLSelectElement).value as RolUsuario)"
              :disabled="usuario.id === usuarioActual?.id"
              class="input py-1 text-sm w-auto"
            >
              <option v-for="rol in roles" :key="rol.value" :value="rol.value">
                {{ rol.label }}
              </option>
            </select>

            <!-- Toggle activar/desactivar -->
            <button
              v-if="usuario.id !== usuarioActual?.id"
              @click="toggleUsuario(usuario.id, usuario.activo)"
              :class="[
                'btn btn-sm',
                usuario.activo ? 'btn-outline text-red-600 border-red-200 hover:bg-red-50' : 'btn-secondary'
              ]"
            >
              <i :class="['pi', usuario.activo ? 'pi-ban' : 'pi-check']"></i>
              {{ usuario.activo ? 'Desactivar' : 'Activar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de invitación -->
    <UiModalBase
      :visible="modalInvitacion"
      titulo="Invitar Usuario"
      @cerrar="modalInvitacion = false"
    >
      <form @submit.prevent="enviarInvitacion" class="space-y-4">
        <div>
          <label for="email" class="label">Correo electrónico *</label>
          <input
            id="email"
            v-model="formularioInvitacion.email"
            type="email"
            class="input"
            placeholder="usuario@email.com"
            required
          />
        </div>

        <div>
          <label for="rol" class="label">Rol *</label>
          <select
            id="rol"
            v-model="formularioInvitacion.rol"
            class="input"
            required
          >
            <option v-for="rol in roles" :key="rol.value" :value="rol.value">
              {{ rol.label }}
            </option>
          </select>
        </div>

        <p class="text-sm text-gray-500">
          Se generará un enlace de invitación que podrás compartir con el usuario.
          El enlace expirará en 7 días.
        </p>
      </form>

      <template #footer>
        <div class="flex gap-3">
          <button
            @click="modalInvitacion = false"
            class="btn-outline flex-1"
          >
            Cancelar
          </button>
          <button
            @click="enviarInvitacion"
            :disabled="enviandoInvitacion || !formularioInvitacion.email"
            class="btn-primary flex-1"
          >
            <i v-if="enviandoInvitacion" class="pi pi-spinner pi-spin"></i>
            <i v-else class="pi pi-send"></i>
            Crear Invitación
          </button>
        </div>
      </template>
    </UiModalBase>
  </div>
</template>
