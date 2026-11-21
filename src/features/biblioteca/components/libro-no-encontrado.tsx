import { PaginaNoEncontrada } from '@/components/layout/pantallas-estado'

/**
 * Ficha de un libro que no existe (/libros/99999): la misma 404 de pantalla completa. Se pinta
 * dentro del layout, así que cubre la ventana entera (sidebar y LuxIA quedan debajo).
 */
export function LibroNoEncontrado() {
  return <PaginaNoEncontrada encima />
}
