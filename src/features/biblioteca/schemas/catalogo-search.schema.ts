import { z } from 'zod'

/** Search params de las listas paginadas (catálogo y listados de admin). */
export const catalogoSearchSchema = z.object({
  buscar: z
    .string()
    .trim()
    .max(200)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined)),
  autor: z
    .string()
    .trim()
    .max(150)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined)),
  categoria: z
    .string()
    .trim()
    .max(100)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined)),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
  /** Chip rápido. La API no lo filtra: se aplica en el cliente sobre la página actual. */
  disponibilidad: z
    .enum(['disponibles', 'agotados'])
    .optional()
    .catch(undefined),
  /** Orden. La API no ordena: se aplica en el cliente sobre la página actual. */
  orden: z.enum(['titulo', 'autor', 'disponibles']).optional().catch(undefined),
})

export const ORDENES = {
  titulo: 'Título A-Z',
  autor: 'Autor',
  disponibles: 'Más disponibles',
} as const

export type Orden = keyof typeof ORDENES
export type Disponibilidad = 'disponibles' | 'agotados'

export type CatalogoSearch = {
  buscar?: string
  autor?: string
  categoria?: string
  disponibilidad?: Disponibilidad
  orden?: Orden
  page: number
  pageSize: number
}

export function parseCatalogoSearch(
  search: Record<string, unknown>,
): CatalogoSearch {
  const parsed = catalogoSearchSchema.parse(search)
  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    ...(parsed.buscar ? { buscar: parsed.buscar } : {}),
    ...(parsed.autor ? { autor: parsed.autor } : {}),
    ...(parsed.categoria ? { categoria: parsed.categoria } : {}),
    ...(parsed.disponibilidad ? { disponibilidad: parsed.disponibilidad } : {}),
    ...(parsed.orden ? { orden: parsed.orden } : {}),
  }
}
