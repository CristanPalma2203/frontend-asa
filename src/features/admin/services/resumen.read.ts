import {
  resumenSchema,
  type DiasResumen,
  type Resumen,
} from '@/features/admin/schemas/resumen.schema'
import { api } from '@/lib/api/client'

export function obtenerResumen(dias: DiasResumen = 14): Promise<Resumen> {
  return api<unknown>(`/api/resumen?dias=${dias}`).then((raw) =>
    resumenSchema.parse(raw),
  )
}
