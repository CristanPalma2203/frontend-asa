import { api } from '@/lib/api/client'
import type {
  Lector,
  LectorLista,
  ListarLectoresParams,
  PagedResponse,
} from '@/features/biblioteca/types/api'

export function listarLectores(params: ListarLectoresParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
  if (params.buscar) query.set('buscar', params.buscar)
  return api<PagedResponse<LectorLista>>(`/api/lectores?${query.toString()}`)
}

export function obtenerLector(id: number) {
  return api<Lector>(`/api/lectores/${id}`)
}
