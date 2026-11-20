import { api } from '@/lib/api/client'
import type { LibroForm } from '@/features/biblioteca/schemas/libro.schema'

export function crearLibro(body: LibroForm) {
  return api<{ idLibro: number }>('/api/libros', { method: 'POST', body })
}

export function editarLibro(id: number, body: LibroForm) {
  return api<void>(`/api/libros/${id}`, { method: 'PUT', body })
}

export function desactivarLibro(id: number) {
  return api<void>(`/api/libros/${id}`, { method: 'DELETE' })
}
