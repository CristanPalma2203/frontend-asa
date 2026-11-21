import { z } from 'zod'

import { requerido } from '@/features/biblioteca/schemas/comunes'

export const ejemplarSchema = z.object({
  codigoInventario: requerido('El código de inventario es obligatorio.').max(
    30,
    {
      error: 'El código de inventario no puede superar 30 caracteres.',
    },
  ),
})

export type EjemplarForm = z.infer<typeof ejemplarSchema>

export const editarEjemplarSchema = ejemplarSchema

export type EjemplarEdicion = EjemplarForm & { rowVersion: string }
