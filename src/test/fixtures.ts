import type { Libro, LibroDetalle } from '@/features/biblioteca/types'

export const libroEjemplo: Libro = {
  idLibro: 1,
  isbn: '9788498381498',
  titulo: 'El Principito',
  autor: 'Antoine de Saint-Exupéry',
  categoria: 'Infantil',
  totalEjemplares: 2,
  disponibles: 2,
}

export const detalleEjemplo: LibroDetalle = {
  idLibro: libroEjemplo.idLibro,
  isbn: libroEjemplo.isbn,
  titulo: libroEjemplo.titulo,
  autor: libroEjemplo.autor,
  categoria: libroEjemplo.categoria,
  estado: 'Activo',
  disponibles: libroEjemplo.disponibles,
  ejemplares: [
    { id: 1, codigoInventario: 'BIB-001', estado: 'Disponible', rowVersion: 'AQID' },
  ],
}
