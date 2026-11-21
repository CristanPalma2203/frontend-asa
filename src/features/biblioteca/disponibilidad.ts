export function textoDisponibles(disponibles: number) {
  if (disponibles <= 0) return 'Sin stock'
  return disponibles === 1 ? '1 disponible' : `${disponibles} disponibles`
}

export function totalActivos(ejemplares: { estado: string }[]) {
  return ejemplares.filter((ejemplar) => ejemplar.estado !== 'Inactivo').length
}

export type EstadoFicha = 'disponible' | 'sinstock' | 'reservado'

export function estadoFicha(
  estado: EstadoFicha,
  disponibles: number,
  total: number,
) {
  const tuyos = estado === 'reservado' ? 1 : 0
  const segmentos =
    total > 0 && total <= 12
      ? Array.from({ length: total }, (_, i) =>
          i < tuyos ? 'tuyo' : i < tuyos + disponibles ? 'libre' : 'ocupado',
        )
      : []
  const queda =
    disponibles === 1
      ? 'queda 1 disponible'
      : `quedan ${disponibles} disponibles`
  return {
    etiqueta: {
      disponible: textoDisponibles(disponibles),
      sinstock: 'Sin ejemplares disponibles',
      reservado: 'Reservado por ti',
    }[estado],
    detalle: {
      disponible: `${disponibles} de ${total} ejemplares activos`,
      sinstock:
        total === 1
          ? 'El único ejemplar activo está reservado'
          : `Los ${total} ejemplares activos están reservados`,
      reservado: `Tienes 1 de ${total} · ${queda}`,
    }[estado],
    ayuda: {
      disponible:
        'Un solo clic. El sistema te asigna un ejemplar y lo verás en Mis reservas.',
      sinstock:
        'Cuando alguien cancele su reserva, el ejemplar volverá a estar disponible aquí.',
      reservado:
        'Puedes cancelar la reserva cuando quieras desde Mis reservas.',
    }[estado],
    segmentos: segmentos as ('tuyo' | 'libre' | 'ocupado')[],
  }
}
