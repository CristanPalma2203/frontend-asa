import { z } from 'zod'

import { requerido } from '@/features/biblioteca/schemas/comunes'

export const loginSchema = z.object({
  correo: requerido('El correo es obligatorio.').pipe(
    z.email({ error: 'El correo no es válido.' }),
  ),
  password: requerido('La contraseña es obligatoria.'),
})

export type LoginForm = z.infer<typeof loginSchema>
