import { api } from '@/lib/api/client'
import type { EjemplarLista } from '@/features/biblioteca/types/api'

export function listarEjemplares(idLibro: number) {
  return api<EjemplarLista[]>(`/api/libros/${idLibro}/ejemplares`)
}
