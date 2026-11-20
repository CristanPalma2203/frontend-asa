import { api } from '@/lib/api/client'
import { useAuthStore } from '@/features/auth/store'
import {
  mapEstadoEjemplar,
  mapEstadoLector,
  mapEstadoLibro,
  mapEstadoReserva,
} from '@/features/biblioteca/estados'
import type {
  Ejemplar,
  EjemplarLista,
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

type LibroDetalleCrudo = Omit<LibroDetalle, 'estado' | 'ejemplares'> & {
  estado: unknown
  ejemplares: Array<Omit<Ejemplar, 'estado'> & { estado: unknown }>
}

type ReservaCruda = Omit<Reserva, 'estado'> & { estado: unknown }
type ReservaCreadaCruda = Omit<ReservaCreada, 'estado'> & { estado: unknown }

export function listarLibros(params: ListarLibrosParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })

  if (params.buscar) query.set('buscar', params.buscar)
  if (params.categoria) query.set('categoria', params.categoria)

  return api<PagedResponse<Libro>>(`/api/libros?${query.toString()}`)
}

export async function obtenerLibro(id: number): Promise<LibroDetalle> {
  const libro = await api<LibroDetalleCrudo>(`/api/libros/${id}`)
  return {
    ...libro,
    estado: mapEstadoLibro(libro.estado),
    ejemplares: libro.ejemplares.map((ejemplar) => ({
      ...ejemplar,
      estado: mapEstadoEjemplar(ejemplar.estado),
    })),
  }
}

export async function reservar(input: { lectorId: number; libroId: number }) {
  const reserva = await api<ReservaCreadaCruda>('/api/reservas', {
    method: 'POST',
    body: { lectorId: input.lectorId, libroId: input.libroId },
  })

  return {
    ...reserva,
    estado: mapEstadoReserva(reserva.estado),
  }
}

export function cancelarReserva(id: number) {
  return api<void>(`/api/reservas/${id}/cancelar`, { method: 'POST' })
}

export type FiltroReservas = 'Activa' | 'Cancelada' | 'Todas'

const estadoQuery: Record<Exclude<FiltroReservas, 'Todas'>, string> = {
  Activa: '0',
  Cancelada: '1',
}

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
  if (filtro !== 'Todas') query.set('estado', estadoQuery[filtro])

  const pagina = await api<PagedResponse<ReservaCruda>>(
    `/api/lectores/${lectorId}/reservas?${query.toString()}`,
  )

  return {
    ...pagina,
    items: pagina.items.map((reserva) => ({
      ...reserva,
      estado: mapEstadoReserva(reserva.estado),
    })),
  }
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

export async function listarEjemplares(idLibro: number) {
  const items = await api<Array<Omit<EjemplarLista, 'estado'> & { estado: unknown }>>(
    `/api/libros/${idLibro}/ejemplares`,
  )
  return items.map((item) => ({ ...item, estado: mapEstadoEjemplar(item.estado) }))
}

export function crearEjemplar(idLibro: number, body: EjemplarForm) {
  return api<void>(`/api/libros/${idLibro}/ejemplares`, { method: 'POST', body })
}

export function cambiarEstadoEjemplar(
  idLibro: number,
  idEjemplar: number,
  estado: 'Disponible' | 'Inactivo',
  rowVersion: string,
) {
  return api<void>(`/api/libros/${idLibro}/ejemplares/${idEjemplar}/estado`, {
    method: 'PUT',
    body: { estado: estado === 'Disponible' ? 0 : 3, rowVersion },
  })
}

export async function listarLectores(params: {
  page: number
  pageSize: number
  buscar?: string
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
  if (params.buscar) query.set('buscar', params.buscar)
  const pagina = await api<PagedResponse<Omit<LectorLista, 'estado'> & { estado: unknown }>>(
    `/api/lectores?${query.toString()}`,
  )
  return {
    ...pagina,
    items: pagina.items.map((item) => ({ ...item, estado: mapEstadoLector(item.estado) })),
  }
}

export async function obtenerLector(id: number): Promise<Lector> {
  const lector = await api<Omit<Lector, 'estado'> & { estado: unknown }>(`/api/lectores/${id}`)
  return { ...lector, estado: mapEstadoLector(lector.estado) }
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
