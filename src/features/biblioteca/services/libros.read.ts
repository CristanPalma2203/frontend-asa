import { api } from '@/lib/api/client'
import type {
  Libro,
  LibroDetalle,
  ListarLibrosParams,
  PagedResponse,
} from '@/features/biblioteca/types/api'

export function listarLibros(params: ListarLibrosParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })

  // GET /api/libros?search=&autor=&categoria=&page=&pageSize=
  if (params.buscar) query.set('search', params.buscar)
  if (params.autor) query.set('autor', params.autor)
  if (params.categoria) query.set('categoria', params.categoria)

  return api<PagedResponse<Libro>>(`/api/libros?${query.toString()}`)
}

export function obtenerLibro(id: number) {
  return api<LibroDetalle>(`/api/libros/${id}`)
}
