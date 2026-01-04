// =============================================
// TIPOS PRINCIPALES DEL SISTEMA FINANCIERO
// Sistema de Control Financiero - Organización Animalista
// =============================================

// Roles disponibles en el sistema
export type RolUsuario = 'administrador' | 'tesorero' | 'encargado_compras'

// Estados posibles de una compra
export type EstadoCompra = 'pendiente' | 'aprobada' | 'rechazada'

// =============================================
// USUARIOS Y AUTENTICACIÓN
// =============================================

export interface Usuario {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: RolUsuario
  activo: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Invitacion {
  id: string
  email: string
  rol: RolUsuario
  token: string
  invitado_por: string
  usado: boolean
  fecha_expiracion: string
  created_at: string
}

// =============================================
// CONFIGURACIÓN DEL SISTEMA
// =============================================

export interface ConfiguracionSistema {
  id: string
  moneda_codigo: string      // Ejemplo: 'MXN', 'USD', 'GTQ'
  moneda_simbolo: string     // Ejemplo: '$', 'Q'
  moneda_nombre: string      // Ejemplo: 'Peso Mexicano'
  nombre_organizacion: string
  logo_url?: string
  updated_at: string
  updated_by: string
}

// =============================================
// CUENTAS BANCARIAS / EFECTIVO
// =============================================

export type TipoCuenta = 'banco' | 'efectivo' | 'digital'

export interface Cuenta {
  id: string
  nombre: string
  tipo: TipoCuenta
  numero_cuenta?: string
  banco?: string
  saldo_actual: number
  activa: boolean
  color: string             // Para identificar visualmente
  created_at: string
  updated_at: string
}

// =============================================
// CATEGORÍAS
// =============================================

export interface CategoriaCompra {
  id: string
  nombre: string
  descripcion?: string
  icono: string             // Nombre del icono de PrimeIcons
  color: string
  activa: boolean
  created_at: string
}

export interface CategoriaIngreso {
  id: string
  nombre: string
  descripcion?: string
  icono: string
  color: string
  activa: boolean
  created_at: string
}

// =============================================
// COMPRAS
// =============================================

export interface Compra {
  id: string
  descripcion: string
  monto: number
  categoria_id: string
  cuenta_id: string
  fecha_compra: string
  foto_factura_url?: string
  notas?: string
  estado: EstadoCompra
  registrado_por: string
  revisado_por?: string
  fecha_revision?: string
  motivo_rechazo?: string
  created_at: string
  updated_at: string
  // Relaciones (para cuando se hace JOIN)
  categoria?: CategoriaCompra
  cuenta?: Cuenta
  usuario_registro?: Usuario
  usuario_revision?: Usuario
}

// =============================================
// INGRESOS
// =============================================

export interface Ingreso {
  id: string
  descripcion: string
  monto: number
  categoria_id: string
  cuenta_id: string
  fecha_deposito: string
  comprobante_url?: string   // Foto o PDF del comprobante
  notas?: string
  registrado_por: string
  created_at: string
  updated_at: string
  // Relaciones
  categoria?: CategoriaIngreso
  cuenta?: Cuenta
  usuario_registro?: Usuario
}

// =============================================
// DASHBOARD Y ESTADÍSTICAS
// =============================================

export interface ResumenFinanciero {
  saldo_total: number
  ingresos_mes: number
  egresos_mes: number
  compras_pendientes: number
  ingresos_por_categoria: { categoria: string; total: number }[]
  egresos_por_categoria: { categoria: string; total: number }[]
  saldos_por_cuenta: { cuenta: string; saldo: number; color: string }[]
  ultimos_movimientos: (Compra | Ingreso)[]
}

// =============================================
// FORMULARIOS Y VALIDACIÓN
// =============================================

export interface FormCompra {
  descripcion: string
  monto: number | null
  categoria_id: string
  cuenta_id: string
  fecha_compra: string
  foto_factura?: File | null
  notas?: string
}

export interface FormIngreso {
  descripcion: string
  monto: number | null
  categoria_id: string
  cuenta_id: string
  fecha_deposito: string
  comprobante?: File | null
  notas?: string
}

export interface FormInvitacion {
  email: string
  rol: RolUsuario
}

export interface FormCategoria {
  nombre: string
  descripcion?: string
  icono: string
  color: string
}

export interface FormCuenta {
  nombre: string
  tipo: TipoCuenta
  numero_cuenta?: string
  banco?: string
  saldo_actual: number
  color: string
}

// =============================================
// RESPUESTAS DE API
// =============================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// =============================================
// NAVEGACIÓN Y UI
// =============================================

export interface MenuItem {
  label: string
  icon: string
  to: string
  roles: RolUsuario[]     // Qué roles pueden ver este item
}

export interface Notificacion {
  id: string
  tipo: 'success' | 'error' | 'warning' | 'info'
  titulo: string
  mensaje: string
  duracion?: number
}
