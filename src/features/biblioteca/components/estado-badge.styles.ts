import type { ComponentProps } from 'react'

import type { Badge } from '@/components/ui/badge'
import type {
  EstadoEjemplar,
  EstadoLector,
  EstadoLibro,
  EstadoReserva,
} from '@/features/biblioteca/types/estados'

export type EstiloBadge = {
  etiqueta: string
  variant: ComponentProps<typeof Badge>['variant']
  className?: string
}

const apagado = {
  variant: 'secondary',
  className: 'border border-linea',
} as const

export const badgeEjemplar: Record<EstadoEjemplar, EstiloBadge> = {
  Disponible: { etiqueta: 'Disponible', variant: 'disponible' },
  Reservado: { etiqueta: 'Reservado', variant: 'reservado' },
  Prestado: { etiqueta: 'Prestado', variant: 'outline' },
  Inactivo: { etiqueta: 'Inactivo', ...apagado },
}

export const badgeReserva: Record<EstadoReserva, EstiloBadge> = {
  Activa: { etiqueta: 'Activa', variant: 'activa' },
  Cancelada: { etiqueta: 'Cancelada', variant: 'destructive' },
  Completada: { etiqueta: 'Completada', variant: 'outline' },
}

export const badgeLibro: Record<EstadoLibro, EstiloBadge> = {
  Activo: { etiqueta: 'Activo', variant: 'disponible' },
  Inactivo: { etiqueta: 'Inactivo', ...apagado },
}

export const badgeLector: Record<EstadoLector, EstiloBadge> = {
  Activo: { etiqueta: 'Activo', variant: 'disponible' },
  Inactivo: { etiqueta: 'Inactivo', ...apagado },
}
