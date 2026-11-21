import type { ChatLibro, ChatMsg } from '@/features/luxia/types/chat'

// Historial del chat en localStorage, con límites de tamaño.
export const MAX_MESSAGE = 1000
export const HISTORY_LIMIT = 10
export const STORAGE_KEY = 'asa-luxia-history'

function esLibro(l: unknown): l is ChatLibro {
  const v = l as ChatLibro | null
  return (
    !!v &&
    Number.isInteger(v.idLibro) &&
    typeof v.titulo === 'string' &&
    typeof v.disponibles === 'number'
  )
}

/** Solo los campos de la tarjeta; un historial antiguo sin isbn/autor muestra el respaldo. */
function libroGuardado(l: ChatLibro): ChatLibro {
  return {
    idLibro: l.idLibro,
    isbn: typeof l.isbn === 'string' ? l.isbn : '',
    titulo: l.titulo,
    autor: typeof l.autor === 'string' ? l.autor : '',
    disponibles: l.disponibles,
  }
}

export function loadHistory(): ChatMsg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (m): m is ChatMsg =>
          !!m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.text === 'string',
      )
      .map((m) => ({
        role: m.role,
        text: m.text.slice(0, MAX_MESSAGE),
        ...(Array.isArray(m.libros)
          ? { libros: m.libros.filter(esLibro).map(libroGuardado) }
          : {}),
        ...(typeof m.consulta === 'string' ? { consulta: m.consulta } : {}),
        ...(typeof m.sugerencia === 'string'
          ? { sugerencia: m.sugerencia }
          : {}),
        ...(typeof m.categoria === 'string' ? { categoria: m.categoria } : {}),
        ...(typeof m.total === 'number' ? { total: m.total } : {}),
      }))
      .slice(-HISTORY_LIMIT)
  } catch {
    return []
  }
}

export function saveHistory(list: ChatMsg[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(-HISTORY_LIMIT)),
    )
  } catch {
    /* localStorage no disponible */
  }
}

/** Borra el historial guardado (al cerrar sesión: el siguiente usuario no ve la conversación). */
export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* localStorage no disponible */
  }
}
