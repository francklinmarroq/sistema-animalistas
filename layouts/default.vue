<script setup lang="ts">
import type { MenuItem } from '~/types'

const { usuarioActual, cerrarSesion, esAdmin, esTesorero } = useAuth()
const { configuracion } = useConfiguracion()

// Estado del menú móvil
const menuAbierto = ref(false)

// Menú de navegación basado en roles
const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi-home',
      to: '/',
      roles: ['administrador', 'tesorero', 'encargado_compras']
    },
    {
      label: 'Compras',
      icon: 'pi-shopping-cart',
      to: '/compras',
      roles: ['administrador', 'tesorero', 'encargado_compras']
    },
    {
      label: 'Ingresos',
      icon: 'pi-wallet',
      to: '/ingresos',
      roles: ['administrador', 'tesorero']
    },
    {
      label: 'Revisar Compras',
      icon: 'pi-check-square',
      to: '/tesoreria/revisar',
      roles: ['administrador', 'tesorero']
    },
    {
      label: 'Usuarios',
      icon: 'pi-users',
      to: '/admin/usuarios',
      roles: ['administrador']
    },
    {
      label: 'Configuración',
      icon: 'pi-cog',
      to: '/admin/configuracion',
      roles: ['administrador']
    }
  ]

  // Filtrar por rol del usuario actual
  if (!usuarioActual.value) return []

  return items.filter(item =>
    item.roles.includes(usuarioActual.value!.rol)
  )
})

// Cerrar menú al navegar
const route = useRoute()
watch(() => route.path, () => {
  menuAbierto.value = false
})

// Manejar cierre de sesión
const handleCerrarSesion = async () => {
  await cerrarSesion()
}

// Nombre para mostrar del rol
const nombreRol = computed(() => {
  const roles: Record<string, string> = {
    administrador: 'Administrador',
    tesorero: 'Tesorero/a',
    encargado_compras: 'Encargado/a de Compras'
  }
  return roles[usuarioActual.value?.rol || ''] || ''
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header móvil -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40 lg:hidden">
      <div class="flex items-center justify-between px-4 h-14">
        <button
          @click="menuAbierto = !menuAbierto"
          class="p-2 -ml-2 text-gray-600 hover:text-gray-900"
          aria-label="Abrir menú"
        >
          <i class="pi pi-bars text-xl"></i>
        </button>

        <span class="font-semibold text-gray-900 truncate">
          {{ configuracion?.nombre_organizacion || 'Sistema Animalistas' }}
        </span>

        <NuxtLink to="/perfil" class="p-2 -mr-2">
          <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
            {{ usuarioActual?.nombre?.charAt(0) || 'U' }}
          </div>
        </NuxtLink>
      </div>
    </header>

    <!-- Overlay del menú móvil -->
    <Transition name="fade">
      <div
        v-if="menuAbierto"
        class="fixed inset-0 bg-black/50 z-40 lg:hidden"
        @click="menuAbierto = false"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        menuAbierto ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo y nombre -->
      <div class="h-16 flex items-center px-4 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
            <i class="pi pi-heart-fill text-white text-xl"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="font-bold text-gray-900 truncate text-sm">
              {{ configuracion?.nombre_organizacion || 'Sistema Animalistas' }}
            </h1>
            <p class="text-xs text-gray-500">Control Financiero</p>
          </div>
        </div>

        <button
          @click="menuAbierto = false"
          class="lg:hidden p-2 text-gray-400 hover:text-gray-600"
          aria-label="Cerrar menú"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Navegación -->
      <nav class="p-4 space-y-1 overflow-y-auto" style="height: calc(100% - 8rem);">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="nav-item-active"
        >
          <i :class="['pi', item.icon, 'text-lg']"></i>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Usuario actual -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
            {{ usuarioActual?.nombre?.charAt(0) || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 truncate text-sm">
              {{ usuarioActual?.nombre }} {{ usuarioActual?.apellido }}
            </p>
            <p class="text-xs text-gray-500">{{ nombreRol }}</p>
          </div>
        </div>

        <button
          @click="handleCerrarSesion"
          class="w-full btn btn-outline btn-sm text-red-600 border-red-200 hover:bg-red-50"
        >
          <i class="pi pi-sign-out"></i>
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Contenido principal -->
    <main class="lg:ml-72 min-h-screen">
      <div class="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <slot />
      </div>
    </main>

    <!-- Componente de notificaciones -->
    <NotificacionesToast />
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
