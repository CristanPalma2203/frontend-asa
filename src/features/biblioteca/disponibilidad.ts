/** Texto de disponibilidad para el lector: «3 disponibles», «1 disponible» o «Sin stock». */
export function textoDisponibles(disponibles: number) {
  if (disponibles <= 0) return 'Sin stock'
  return disponibles === 1 ? '1 disponible' : `${disponibles} disponibles`
}

/**
 * Ejemplares que cuentan para el total: los inactivos no (igual que `totalEjemplares` del
 * backend). El detalle del libro trae la lista completa, así que se filtra aquí.
 */
export function totalActivos(ejemplares: { estado: string }[]) {
  return ejemplares.filter((ejemplar) => ejemplar.estado !== 'Inactivo').length
}
