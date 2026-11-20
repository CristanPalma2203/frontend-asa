import { z } from 'zod'

const requerido = (mensaje: string) => z.string().trim().min(1, { error: mensaje })

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

export const ejemplarSchema = z.object({
  codigoInventario: requerido('El código de inventario es obligatorio.').max(30, {
    error: 'El código de inventario no puede superar 30 caracteres.',
  }),
})

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

export const loginSchema = z.object({
  correo: requerido('El correo es obligatorio.').pipe(
    z.email({ error: 'El correo no es válido.' }),
  ),
  password: requerido('La contraseña es obligatoria.'),
})

export const catalogoSearchSchema = z.object({
  buscar: z
    .string()
    .trim()
    .max(200)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined)),
  categoria: z
    .string()
    .trim()
    .max(100)
    .optional()
    .catch(undefined)
    .transform((value) => (value ? value : undefined)),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
})

export type CatalogoSearch = {
  buscar?: string
  categoria?: string
  page: number
  pageSize: number
}

export function parseCatalogoSearch(search: Record<string, unknown>): CatalogoSearch {
  const parsed = catalogoSearchSchema.parse(search)
  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    ...(parsed.buscar ? { buscar: parsed.buscar } : {}),
    ...(parsed.categoria ? { categoria: parsed.categoria } : {}),
  }
}
export type LibroForm = z.infer<typeof libroSchema>
export type EjemplarForm = z.infer<typeof ejemplarSchema>
export type LectorForm = z.infer<typeof lectorSchema>
export type LoginForm = z.infer<typeof loginSchema>
