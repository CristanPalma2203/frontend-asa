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
})

export type CatalogoSearch = {
  buscar?: string
  autor?: string
  categoria?: string
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
  }
}
