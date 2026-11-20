import type {
  EstadoEjemplar,
  EstadoLector,
  EstadoLibro,
  EstadoReserva,
} from '@/features/biblioteca/types/estados'

export type Libro = {
  idLibro: number
  isbn: string
  titulo: string
  autor: string
  categoria: string
  totalEjemplares: number
  disponibles: number
}

export type Ejemplar = {
  idEjemplar: number
  codigoInventario: string
  estado: EstadoEjemplar
  rowVersion: string
}

export type LibroDetalle = {
  idLibro: number
  isbn: string
  titulo: string
  autor: string
  categoria: string
  estado: EstadoLibro
  disponibles: number
  ejemplares: Ejemplar[]
}

export type Reserva = {
  idReserva: number
  idLibro: number
  titulo: string
  codigoInventario: string
  estado: EstadoReserva
  fechaSolicitud: string
  fechaCancelacion: string | null
}

export type ReservaCreada = {
  idReserva: number
  idEjemplar: number
  codigoInventario: string
  estado: EstadoReserva
  fechaSolicitud: string
}

export type EjemplarLista = {
  idEjemplar: number
  codigoInventario: string
  estado: EstadoEjemplar
  rowVersion: string
}

export type LectorLista = {
  idLector: number
  identificador: string
  nombre: string
  correo: string
  estado: EstadoLector
  tieneUsuario: boolean
}

export type Lector = LectorLista & {
  reservasActivas: number
}

export type PagedResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  code?: string
  errors?: Record<string, string[]>
}

// ---- Parámetros de consulta y cuerpos de request ----

export type ListarLibrosParams = {
  page: number
  pageSize: number
  buscar?: string
  categoria?: string
}

export type ListarLectoresParams = {
  page: number
  pageSize: number
  buscar?: string
}

export type ReservarBody = {
  lectorId: number
  libroId: number
}

export type CrearLectorBody = {
  identificador: string
  nombre: string
  correo: string
  password?: string
}

export type EditarLectorBody = {
  identificador: string
  nombre: string
  correo: string
}
