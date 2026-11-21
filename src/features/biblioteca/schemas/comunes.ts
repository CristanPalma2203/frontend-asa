import { z } from 'zod'

export const requerido = (mensaje: string) =>
  z.string().trim().min(1, { error: mensaje })
