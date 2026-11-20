import { z } from 'zod'

import { requerido } from '@/features/biblioteca/schemas/comunes'

export const libroSchema = z.object({
  isbn: requerido('El ISBN es obligatorio.').max(20, {
    error: 'El ISBN debe ser ISBN-10 o ISBN-13.',
  }),
  titulo: requerido('El título es obligatorio.').max(200, {
    error: 'El título no puede superar 200 caracteres.',
  }),
  autor: requerido('El autor es obligatorio.').max(150, {
    error: 'El autor no puede superar 150 caracteres.',
  }),
  categoria: requerido('La categoría es obligatoria.').max(80, {
    error: 'La categoría no puede superar 80 caracteres.',
  }),
})

export type LibroForm = z.infer<typeof libroSchema>
