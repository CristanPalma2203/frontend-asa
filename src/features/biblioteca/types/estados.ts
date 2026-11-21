export type EstadoLibro = 'Activo' | 'Inactivo'
export type EstadoEjemplar =
  'Disponible' | 'Reservado' | 'Prestado' | 'Inactivo'
export type EstadoReserva = 'Activa' | 'Cancelada' | 'Completada'
export type EstadoLector = 'Activo' | 'Inactivo'

export type EstadoEjemplarEditable = Extract<
  EstadoEjemplar,
  'Disponible' | 'Inactivo'
>

export type FiltroReservas =
  Extract<EstadoReserva, 'Activa' | 'Cancelada'> | 'Todas'
