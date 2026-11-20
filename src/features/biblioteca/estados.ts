export const estadoLibroPorNumero = {
  0: 'Activo',
  1: 'Inactivo',
} as const

export const estadoEjemplarPorNumero = {
  0: 'Disponible',
  1: 'Reservado',
  2: 'Prestado',
  3: 'Inactivo',
} as const

export const estadoReservaPorNumero = {
  0: 'Activa',
  1: 'Cancelada',
  2: 'Completada',
} as const

export const estadoLectorPorNumero = {
  0: 'Activo',
  1: 'Inactivo',
} as const

export type EstadoLibro = (typeof estadoLibroPorNumero)[keyof typeof estadoLibroPorNumero]
export type EstadoEjemplar = (typeof estadoEjemplarPorNumero)[keyof typeof estadoEjemplarPorNumero]
export type EstadoReserva = (typeof estadoReservaPorNumero)[keyof typeof estadoReservaPorNumero]
export type EstadoLector = (typeof estadoLectorPorNumero)[keyof typeof estadoLectorPorNumero]

export function mapEstadoLibro(value: unknown): EstadoLibro {
  return mapEnum(value, estadoLibroPorNumero, 'Inactivo')
}

export function mapEstadoEjemplar(value: unknown): EstadoEjemplar {
  return mapEnum(value, estadoEjemplarPorNumero, 'Inactivo')
}

export function mapEstadoReserva(value: unknown): EstadoReserva {
  return mapEnum(value, estadoReservaPorNumero, 'Cancelada')
}

export function mapEstadoLector(value: unknown): EstadoLector {
  return mapEnum(value, estadoLectorPorNumero, 'Inactivo')
}

function mapEnum<T extends string>(
  value: unknown,
  table: Record<number, T>,
  fallback: T,
): T {
  if (typeof value === 'number') {
    return table[value] ?? fallback
  }

  if (typeof value === 'string') {
    const asNumber = Number(value)
    if (Number.isInteger(asNumber) && table[asNumber]) return table[asNumber]
    if (Object.values(table).includes(value as T)) return value as T
  }

  return fallback
}
