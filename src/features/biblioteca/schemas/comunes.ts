import { z } from 'zod'

/** Texto obligatorio: recorta espacios y exige al menos un carácter. */
export const requerido = (mensaje: string) => z.string().trim().min(1, { error: mensaje })
