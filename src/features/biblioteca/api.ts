import { api } from '@/lib/api/client'
import { useAuthStore } from '@/features/auth/store'
import type {
  EjemplarLista,
  EstadoEjemplar,
  EstadoReserva,
  Libro,
  LibroDetalle,
  Lector,
  LectorLista,
  PagedResponse,
  Reserva,
  ReservaCreada,
} from '@/features/biblioteca/types'
import type { EjemplarForm, LibroForm } from '@/features/biblioteca/schemas'

export type ListarLibrosParams = {
  page: number
  pageSize: number
  buscar?: string
  categoria?: string
}

export function listarLibros(params: ListarLibrosParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })

  if (params.buscar) query.set('buscar', params.buscar)
  if (params.categoria) query.set('categoria', params.categoria)

  return api<PagedResponse<Libro>>(`/api/libros?${query.toString()}`)
}

export function obtenerLibro(id: number) {
  return api<LibroDetalle>(`/api/libros/${id}`)
}

export function reservar(input: { lectorId: number; libroId: number }) {
  return api<ReservaCreada>('/api/reservas', {
    method: 'POST',
    body: { lectorId: input.lectorId, libroId: input.libroId },
  })
}

export function cancelarReserva(id: number) {
  return api<void>(`/api/reservas/${id}/cancelar`, { method: 'POST' })
}

export type FiltroReservas = Extract<EstadoReserva, 'Activa' | 'Cancelada'> | 'Todas'

export async function misReservas(
  filtro: FiltroReservas = 'Activa',
  page = 1,
  pageSize = 20,
) {
  const lectorId = useAuthStore.getState().lectorId
  if (!lectorId) {
    throw new Error('No hay un lector en la sesión.')
  }

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (filtro !== 'Todas') query.set('estado', filtro)

  return api<PagedResponse<Reserva>>(`/api/lectores/${lectorId}/reservas?${query.toString()}`)
}

export function crearLibro(body: LibroForm) {
  return api<{ idLibro: number }>('/api/libros', { method: 'POST', body })
}

export function editarLibro(id: number, body: LibroForm) {
  return api<void>(`/api/libros/${id}`, { method: 'PUT', body })
}

export function desactivarLibro(id: number) {
  return api<void>(`/api/libros/${id}`, { method: 'DELETE' })
}

export function listarEjemplares(idLibro: number) {
  return api<EjemplarLista[]>(`/api/libros/${idLibro}/ejemplares`)
}

export function crearEjemplar(idLibro: number, body: EjemplarForm) {
  return api<void>(`/api/libros/${idLibro}/ejemplares`, { method: 'POST', body })
}

export function cambiarEstadoEjemplar(
  idLibro: number,
  idEjemplar: number,
  estado: Extract<EstadoEjemplar, 'Disponible' | 'Inactivo'>,
  rowVersion: string,
) {
  return api<void>(`/api/libros/${idLibro}/ejemplares/${idEjemplar}/estado`, {
    method: 'PUT',
    body: { estado, rowVersion },
  })
}

export function listarLectores(params: {
  page: number
  pageSize: number
  buscar?: string
}) {
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

export function crearLector(body: {
  identificador: string
  nombre: string
  correo: string
  password?: string
}) {
  return api<void>('/api/lectores', {
    method: 'POST',
    body: {
      identificador: body.identificador,
      nombre: body.nombre,
      correo: body.correo,
      ...(body.password ? { password: body.password } : {}),
    },
  })
}

export function editarLector(
  id: number,
  body: { identificador: string; nombre: string; correo: string },
) {
  return api<void>(`/api/lectores/${id}`, { method: 'PUT', body })
}

export function desactivarLector(id: number) {
  return api<void>(`/api/lectores/${id}`, { method: 'DELETE' })
}
