export type EstadoLibro = 'Activo' | 'Inactivo'
export type EstadoEjemplar = 'Disponible' | 'Reservado' | 'Prestado' | 'Inactivo'
export type EstadoReserva = 'Activa' | 'Cancelada' | 'Completada'
export type EstadoLector = 'Activo' | 'Inactivo'

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
