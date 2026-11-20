import { api } from '@/lib/api/client'
import type { ReservaCreada, ReservarBody } from '@/features/biblioteca/types/api'

export function reservar(body: ReservarBody) {
  return api<ReservaCreada>('/api/reservas', {
    method: 'POST',
    body: { lectorId: body.lectorId, libroId: body.libroId },
  })
}

export function cancelarReserva(id: number) {
  return api<void>(`/api/reservas/${id}/cancelar`, { method: 'POST' })
}
