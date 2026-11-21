export type ChatRole = 'user' | 'assistant'

/** Libro enlazado bajo una respuesta de LuxIA (solo lo necesario para el enlace a la ficha). */
export interface ChatLibro {
  idLibro: number
  titulo: string
  disponibles: number
}

export interface ChatMsg {
  role: ChatRole
  text: string
  /** Solo respuestas de LuxIA: enlaces a las fichas de los libros encontrados. */
  libros?: ChatLibro[]
  /** Con más resultados que enlaces: búsqueda para «Ver todos en el catálogo». */
  consulta?: string
  total?: number
}
