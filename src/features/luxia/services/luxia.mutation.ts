import {
  respuestaLuxiaSchema,
  type PreguntaLuxia,
} from '@/features/luxia/schemas/respuesta.schema'
import { api } from '@/lib/api/client'

export const ESPERA_MAXIMA_MS = 12_000

export async function preguntarLuxia(
  cuerpo: PreguntaLuxia,
  espera = ESPERA_MAXIMA_MS,
) {
  const respuesta = await api<unknown>('/api/luxia/preguntar', {
    method: 'POST',
    body: cuerpo,
    signal: AbortSignal.timeout(espera),
  })
  return respuestaLuxiaSchema.parse(respuesta)
}
