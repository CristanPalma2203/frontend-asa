export type EstadoLibro = 'Activo' | 'Inactivo'
export type EstadoEjemplar =
  'Disponible' | 'Reservado' | 'Prestado' | 'Inactivo'
export type EstadoReserva = 'Activa' | 'Cancelada' | 'Completada'
export type EstadoLector = 'Activo' | 'Inactivo'

/** Estados a los que el admin puede pasar un ejemplar desde la API. */
export type EstadoEjemplarEditable = Extract<
  EstadoEjemplar,
  'Disponible' | 'Inactivo'
>

/** Filtro de "Mis reservas": un estado concreto o todas. */
export type FiltroReservas =
  Extract<EstadoReserva, 'Activa' | 'Cancelada'> | 'Todas'
