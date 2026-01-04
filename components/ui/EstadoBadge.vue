<script setup lang="ts">
import type { EstadoCompra } from '~/types'

interface Props {
  estado: EstadoCompra
}

defineProps<Props>()

const configuracion = {
  pendiente: {
    clase: 'badge-pending',
    icono: 'pi-clock',
    texto: 'Pendiente'
  },
  aprobada: {
    clase: 'badge-success',
    icono: 'pi-check',
    texto: 'Aprobada'
  },
  rechazada: {
    clase: 'badge-danger',
    icono: 'pi-times',
    texto: 'Rechazada'
  }
}
</script>

<template>
  <span :class="['badge', configuracion[estado].clase]">
    <i :class="['pi', configuracion[estado].icono, 'text-xs mr-1']"></i>
    {{ configuracion[estado].texto }}
  </span>
</template>
