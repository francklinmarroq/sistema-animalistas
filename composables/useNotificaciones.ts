import type { Notificacion } from '~/types'

// Composable para manejar las notificaciones del sistema (toasts)
export const useNotificaciones = () => {
  // Lista de notificaciones activas
  const notificaciones = useState<Notificacion[]>('notificaciones', () => [])

  // Agregar una notificación
  const agregar = (notificacion: Omit<Notificacion, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const duracion = notificacion.duracion ?? 5000

    notificaciones.value.push({
      id,
      ...notificacion
    })

    // Eliminar automáticamente después de la duración
    if (duracion > 0) {
      setTimeout(() => {
        eliminar(id)
      }, duracion)
    }

    return id
  }

  // Eliminar una notificación por ID
  const eliminar = (id: string) => {
    const index = notificaciones.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notificaciones.value.splice(index, 1)
    }
  }

  // Métodos de conveniencia
  const exito = (titulo: string, mensaje: string = '') => {
    return agregar({
      tipo: 'success',
      titulo,
      mensaje
    })
  }

  const error = (titulo: string, mensaje: string = '') => {
    return agregar({
      tipo: 'error',
      titulo,
      mensaje,
      duracion: 8000 // Errores duran más tiempo
    })
  }

  const advertencia = (titulo: string, mensaje: string = '') => {
    return agregar({
      tipo: 'warning',
      titulo,
      mensaje
    })
  }

  const info = (titulo: string, mensaje: string = '') => {
    return agregar({
      tipo: 'info',
      titulo,
      mensaje
    })
  }

  // Limpiar todas las notificaciones
  const limpiarTodas = () => {
    notificaciones.value = []
  }

  return {
    notificaciones,
    agregar,
    eliminar,
    exito,
    error,
    advertencia,
    info,
    limpiarTodas
  }
}
