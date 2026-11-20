import { api } from '@/lib/api/client'
import { useAuthStore } from '@/features/auth/store'
import {
  mapEstadoEjemplar,
  mapEstadoLibro,
  mapEstadoReserva,
} from '@/features/biblioteca/estados'
import type {
  Ejemplar,
  Libro,
  LibroDetalle,
  PagedResponse,
  Reserva,
  ReservaCreada,
} from '@/features/biblioteca/types'

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

export async function misReservas() {
  const lectorId = useAuthStore.getState().lectorId
  if (!lectorId) {
    throw new Error('No hay un lector en la sesión.')
  }

  const pagina = await api<PagedResponse<ReservaCruda>>(
    `/api/lectores/${lectorId}/reservas?page=1&pageSize=50`,
  )

  return {
    ...pagina,
    items: pagina.items.map((reserva) => ({
      ...reserva,
      estado: mapEstadoReserva(reserva.estado),
    })),
  }
}
