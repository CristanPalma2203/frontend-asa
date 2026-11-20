export const mensajesError = {
  'sin-stock': 'No hay ejemplares disponibles para este libro.',
  'reserva-duplicada': 'Ya tienes una reserva activa de este libro.',
  'lector-inactivo': 'Tu cuenta de lector está inactiva y no puede reservar.',
  'ejemplar-ya-reservado': 'Ese ejemplar se acaba de reservar. Inténtalo de nuevo.',
  'libro-no-encontrado': 'No se encontró el libro.',
  'credenciales-invalidas': 'El correo o la contraseña no son válidos.',
} as const

export function mensajeDeError(code: string | undefined, fallback: string) {
  if (!code) return fallback
  return mensajesError[code as keyof typeof mensajesError] ?? fallback
}
