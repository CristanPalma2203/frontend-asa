/** Texto de disponibilidad para el lector: «3 disponibles», «1 disponible» o «Sin stock». */
export function textoDisponibles(disponibles: number) {
  if (disponibles <= 0) return 'Sin stock'
  return disponibles === 1 ? '1 disponible' : `${disponibles} disponibles`
}
