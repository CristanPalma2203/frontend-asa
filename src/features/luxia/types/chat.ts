export type ChatRole = 'user' | 'assistant'

/** Libro bajo una respuesta de LuxIA: lo que pinta su tarjeta (se guarda en el historial). */
export interface ChatLibro {
  idLibro: number
  isbn: string
  titulo: string
  autor: string
  disponibles: number
}

export interface ChatMsg {
  role: ChatRole
  text: string
  /** Solo respuestas de LuxIA: enlaces a las fichas de los libros encontrados. */
  libros?: ChatLibro[]
  /** Con varios resultados: búsqueda para «Ver todos en el catálogo». */
  consulta?: string
  /** Siguiente pregunta propuesta tras esta respuesta (un solo chip). */
  sugerencia?: string
  /** Con varios resultados de una categoría: la abre en el catálogo. */
  categoria?: string
  total?: number
}
