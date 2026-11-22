import { z } from 'zod'

export const respuestaLuxiaSchema = z.object({
  texto: z.string().trim().min(1),
  idsLibros: z.array(z.number().int().positive()),
})

export type RespuestaLuxia = z.infer<typeof respuestaLuxiaSchema>

export type TurnoLuxia = {
  rol: 'usuario' | 'luxia'
  texto: string
}

export type PreguntaLuxia = {
  pregunta: string
  historial: TurnoLuxia[]
}
