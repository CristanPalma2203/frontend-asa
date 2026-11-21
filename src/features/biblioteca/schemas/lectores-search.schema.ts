import { z } from 'zod'

export const MAX_BUSQUEDA_LECTORES = 150

const lectoresSearchSchema = z.object({
  buscar: z
    .string()
    .trim()
    .max(MAX_BUSQUEDA_LECTORES)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined)),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
})

export type LectoresSearch = {
  buscar?: string
  page: number
  pageSize: number
}

export function parseLectoresSearch(
  search: Record<string, unknown>,
): LectoresSearch {
  const parsed = lectoresSearchSchema.parse(search)
  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    ...(parsed.buscar ? { buscar: parsed.buscar } : {}),
  }
}
