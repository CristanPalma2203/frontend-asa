import { api } from '@/lib/api/client'
import type { EjemplarForm } from '@/features/biblioteca/schemas/ejemplar.schema'
import type { EstadoEjemplarEditable } from '@/features/biblioteca/types/estados'

export function crearEjemplar(idLibro: number, body: EjemplarForm) {
  return api<void>(`/api/libros/${idLibro}/ejemplares`, { method: 'POST', body })
}

export function cambiarEstadoEjemplar(
  idLibro: number,
  idEjemplar: number,
  estado: EstadoEjemplarEditable,
  rowVersion: string,
) {
  return api<void>(`/api/libros/${idLibro}/ejemplares/${idEjemplar}/estado`, {
    method: 'PUT',
    body: { estado, rowVersion },
  })
}
