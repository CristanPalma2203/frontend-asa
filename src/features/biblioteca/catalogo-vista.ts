import type {
  Disponibilidad,
  Orden,
} from '@/features/biblioteca/schemas/catalogo-search.schema'
import type { Libro } from '@/features/biblioteca/types/api'

export function aplicarVistaCatalogo(
  libros: Libro[],
  { disponibilidad, orden }: { disponibilidad?: Disponibilidad; orden?: Orden },
) {
  const filtrados = disponibilidad
    ? libros.filter((libro) =>
        disponibilidad === 'disponibles'
          ? libro.disponibles > 0
          : libro.disponibles === 0,
      )
    : libros
  if (!orden) return filtrados
  const porTexto = (a: string, b: string) => a.localeCompare(b, 'es')
  return [...filtrados].sort((a, b) =>
    orden === 'titulo'
      ? porTexto(a.titulo, b.titulo)
      : orden === 'autor'
        ? porTexto(a.autor, b.autor) || porTexto(a.titulo, b.titulo)
        : b.disponibles - a.disponibles || porTexto(a.titulo, b.titulo),
  )
}
