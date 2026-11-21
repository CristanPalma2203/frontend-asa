import { ApiError } from '@/lib/api/client'

export const mensajesError = {
  'sin-stock': 'No hay ejemplares disponibles para este libro.',
  'reserva-duplicada': 'Ya tienes una reserva activa de este libro.',
  'lector-inactivo': 'Tu cuenta de lector está inactiva y no puede reservar.',
  'ejemplar-ya-reservado':
    'Ese ejemplar se acaba de reservar. Inténtalo de nuevo.',
  'libro-no-encontrado': 'No se encontró el libro.',
  'lector-con-reservas-activas':
    'El lector tiene reservas activas y no se puede desactivar.',
  'isbn-duplicado': 'Ya existe un libro con ese ISBN.',
  'codigo-inventario-duplicado':
    'Ya existe un ejemplar con ese código de inventario.',
  'estado-no-permitido':
    'Solo se puede pasar el ejemplar a Disponible o Inactivo.',
  'ejemplar-reservado':
    'El ejemplar tiene una reserva activa y no se puede cambiar.',
  'conflicto-concurrencia': 'Otro usuario cambió este ejemplar.',
  'ejemplar-no-encontrado': 'No se encontró el ejemplar.',
  'correo-duplicado': 'Ya existe un lector o un usuario con ese correo.',
  'identificador-duplicado': 'Ya existe un lector con ese identificador.',
  'validacion-fallida': 'Revisa los datos enviados.',
  'libro-con-reservas-activas':
    'El libro tiene reservas activas y no se puede desactivar.',
  'reserva-no-activa': 'Solo se puede cancelar una reserva activa.',
  'reserva-no-encontrada': 'No se encontró la reserva.',
  'credenciales-invalidas': 'El correo o la contraseña no son válidos.',
  'libro-inactivo': 'Este libro está inactivo y no se puede reservar.',
  'lector-no-encontrado': 'No se encontró el lector.',
  'acceso-denegado': 'No tienes permiso para hacer esta acción.',
  'registro-duplicado': 'Ya existe un registro con esos datos.',
} as const

export function mensajeDeError(code: string | undefined, fallback: string) {
  if (!code) return fallback
  return mensajesError[code as keyof typeof mensajesError] ?? fallback
}

export function mensajeGeneral(
  error: unknown,
  codigosConCampo: readonly string[],
): string | null {
  if (!error) return null
  if (!(error instanceof ApiError)) {
    return 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
  }
  if (error.code && codigosConCampo.includes(error.code)) return null
  return mensajeDeError(error.code, error.detail ?? error.title)
}
