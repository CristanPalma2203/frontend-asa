import { z } from 'zod'

import { requerido } from '@/features/biblioteca/schemas/comunes'

export const lectorSchema = z.object({
  identificador: requerido('El identificador es obligatorio.').max(20, {
    error: 'El identificador no puede superar 20 caracteres.',
  }),
  nombre: requerido('El nombre es obligatorio.').max(150, {
    error: 'El nombre no puede superar 150 caracteres.',
  }),
  correo: requerido('El correo es obligatorio.')
    .max(150, { error: 'El correo no puede superar 150 caracteres.' })
    .pipe(z.email({ error: 'El correo no es válido.' })),
  password: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length >= 8, {
      error: 'La contraseña debe tener al menos 8 caracteres.',
    }),
  estado: z.enum(['Activo', 'Inactivo']).optional(),
})

export type LectorForm = z.infer<typeof lectorSchema>
