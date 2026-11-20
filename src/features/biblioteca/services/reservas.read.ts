import { api } from '@/lib/api/client'
import type { PagedResponse, Reserva } from '@/features/biblioteca/types/api'
import type { FiltroReservas } from '@/features/biblioteca/types/estados'

export function listarReservasDeLector(
  lectorId: number,
  filtro: FiltroReservas = 'Activa',
  page = 1,
  pageSize = 20,
) {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (filtro !== 'Todas') query.set('estado', filtro)

  return api<PagedResponse<Reserva>>(`/api/lectores/${lectorId}/reservas?${query.toString()}`)
}
