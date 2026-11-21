import { z } from 'zod'

import type { FiltroReservas } from '@/features/biblioteca/types/estados'

export const misReservasSearchSchema = z.object({
  estado: z.enum(['Activa', 'Cancelada', 'Todas']).catch('Todas'),
})

export type MisReservasSearch = {
  estado?: Exclude<FiltroReservas, 'Todas'> | 'Todas'
}

export function parseMisReservasSearch(
  search: Record<string, unknown>,
): MisReservasSearch {
  const estado = misReservasSearchSchema.parse(search).estado
  return estado === 'Todas' ? {} : { estado }
}

export function filtroHistorial(search: MisReservasSearch): FiltroReservas {
  return search.estado ?? 'Todas'
}
