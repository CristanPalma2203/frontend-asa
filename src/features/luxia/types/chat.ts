export type ChatRole = 'user' | 'assistant'

export interface ChatLibro {
  idLibro: number
  isbn: string
  titulo: string
  autor: string
  disponibles: number
  categoria?: string
}

export interface ChatMsg {
  role: ChatRole
  text: string
  libros?: ChatLibro[]
  consulta?: string
  sugerencia?: string
  categoria?: string
  total?: number
}
