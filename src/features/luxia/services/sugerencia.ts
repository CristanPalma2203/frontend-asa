import { textos } from '@/features/luxia/textos'
import type { ChatMsg } from '@/features/luxia/types/chat'

/**
 * La única sugerencia del chat, debajo de la última respuesta de LuxIA (también con historial
 * guardado): su sugerencia contextual o, si no trae, una predeterminada. Sin conversación, la
 * primera predeterminada. Nunca mientras LuxIA responde ni si el último mensaje es del usuario.
 */
export function elegirSugerencia(
  msgs: ChatMsg[],
  ocupado: boolean,
): string | null {
  if (ocupado) return null
  const ultimo = msgs[msgs.length - 1]
  if (!ultimo) return textos.chips[0]
  if (ultimo.role !== 'assistant') return null
  return ultimo.sugerencia ?? textos.chips[0]
}

/** Sugerencia contextual tras una búsqueda: el siguiente paso natural con el primer libro. */
export function sugerenciaTrasBusqueda(
  titulo: string | undefined,
  pidioReservar: boolean,
) {
  if (!titulo || pidioReservar) return undefined
  return `¿Cómo reservo ${titulo}?`
}
