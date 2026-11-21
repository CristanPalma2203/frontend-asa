import { z } from 'zod'

import type { FiltroReservas } from '@/features/biblioteca/types/estados'

/** Search params de Mis reservas: chip del historial en la URL. */
export const misReservasSearchSchema = z.object({
  estado: z.enum(['Activa', 'Cancelada', 'Todas']).catch('Todas'),
})

export type MisReservasSearch = {
  /** Ausente o `Todas` = sin filtro en la URL. */
  estado?: Exclude<FiltroReservas, 'Todas'> | 'Todas'
}

export function parseMisReservasSearch(
  search: Record<string, unknown>,
): MisReservasSearch {
  const estado = misReservasSearchSchema.parse(search).estado
  // Default fuera de la URL para no obligar `search` en cada Link a /mis-reservas.
  return estado === 'Todas' ? {} : { estado }
}

export function filtroHistorial(
  search: MisReservasSearch,
): FiltroReservas {
  return search.estado ?? 'Todas'
}
