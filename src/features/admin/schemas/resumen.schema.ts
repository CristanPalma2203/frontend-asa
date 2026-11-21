import { z } from 'zod'

export const resumenKpisSchema = z.object({
  librosActivos: z.number().int(),
  ejemplaresActivos: z.number().int(),
  ejemplaresDisponibles: z.number().int(),
  ejemplaresReservados: z.number().int(),
  lectoresActivos: z.number().int(),
  reservasActivas: z.number().int(),
  ocupacion: z.number(),
})

export const resumenDiaSchema = z.object({
  fecha: z.string().min(1),
  reservas: z.number().int(),
  cancelaciones: z.number().int(),
})

export const resumenCategoriaSchema = z.object({
  categoria: z.string(),
  disponibles: z.number().int(),
  reservados: z.number().int(),
  inactivos: z.number().int(),
})

export const resumenLibroReservadoSchema = z.object({
  libroId: z.number().int(),
  isbn: z.string(),
  titulo: z.string(),
  autor: z.string(),
  portadaUrl: z.string().nullable().optional(),
  reservas: z.number().int(),
})

export const resumenLibroPorAgotarseSchema = z.object({
  libroId: z.number().int(),
  isbn: z.string(),
  titulo: z.string(),
  disponibles: z.number().int(),
  total: z.number().int(),
})

export const resumenActividadSchema = z.object({
  tipo: z.enum(['reserva', 'cancelacion']),
  lector: z.string(),
  libro: z.string(),
  codigoEjemplar: z.string(),
  fecha: z.string().min(1),
})

export const resumenSchema = z.object({
  kpis: resumenKpisSchema,
  serieDiaria: z.array(resumenDiaSchema),
  porCategoria: z.array(resumenCategoriaSchema),
  masReservados: z.array(resumenLibroReservadoSchema),
  porAgotarse: z.array(resumenLibroPorAgotarseSchema),
  actividad: z.array(resumenActividadSchema),
})

export type Resumen = z.infer<typeof resumenSchema>
export type ResumenKpis = z.infer<typeof resumenKpisSchema>
export type ResumenDia = z.infer<typeof resumenDiaSchema>
export type ResumenCategoria = z.infer<typeof resumenCategoriaSchema>
export type ResumenLibroReservado = z.infer<typeof resumenLibroReservadoSchema>
export type ResumenLibroPorAgotarse = z.infer<
  typeof resumenLibroPorAgotarseSchema
>
export type ResumenActividad = z.infer<typeof resumenActividadSchema>
export type DiasResumen = 14 | 30
