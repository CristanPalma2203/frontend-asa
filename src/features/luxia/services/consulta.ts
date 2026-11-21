import type {
  Libro,
  ListarLibrosParams,
  PagedResponse,
} from '@/features/biblioteca/types/api'
import { categoriaDe, interpretar } from '@/features/luxia/interpretar'
import type { ChatMsg } from '@/features/luxia/types/chat'

/** Cuántas tarjetas de libro muestra LuxIA en una respuesta. */
export const RESULTADOS = 3

export type BuscarLibros = (
  params: ListarLibrosParams,
) => Promise<PagedResponse<Libro>>

/**
 * Consulta por reglas (sin LLM): interpreta la pregunta y busca con GET /api/libros. Si la
 * pregunta, sin palabras vacías, es una categoría existente («¿qué libros de ciencia hay?»),
 * busca por `categoria`; si no, por texto.
 * LuxIA nunca reserva: si lo piden, remite al botón «Reservar» de la ficha y la enlaza.
 * Lanza si la API falla (el panel muestra el error con Reintentar).
 */
export async function consultarLuxia(
  pregunta: string,
  buscar: BuscarLibros,
  categorias: () => Promise<string[]> = async () => [],
): Promise<ChatMsg> {
  const intencion = interpretar(pregunta)

  if (intencion.tipo === 'vacia') {
    return {
      role: 'assistant',
      text: 'Dime un título, autor o ISBN y te digo cuántos ejemplares quedan.',
    }
  }
  if (intencion.tipo === 'reservar' && !intencion.consulta) {
    return { role: 'assistant', text: textoReservar(0) }
  }

  const categoria = categoriaDe(pregunta, await categorias().catch(() => []))
  const pagina = await buscar({
    page: 1,
    pageSize: RESULTADOS,
    ...(categoria ? { categoria } : { buscar: intencion.consulta }),
  })
  const libros = pagina.items.map(
    ({ idLibro, isbn, titulo, autor, disponibles }) => ({
      idLibro,
      isbn,
      titulo,
      autor,
      disponibles,
    }),
  )

  return {
    role: 'assistant',
    text:
      intencion.tipo === 'reservar'
        ? textoReservar(libros.length)
        : categoria
          ? textoCategoria(categoria, pagina.items, pagina.totalCount)
          : textoBusqueda(intencion.consulta, pagina.items, pagina.totalCount),
    ...(libros.length > 0 ? { libros } : {}),
    ...(pagina.totalCount > 1
      ? {
          ...(categoria ? { categoria } : { consulta: intencion.consulta }),
          total: pagina.totalCount,
        }
      : {}),
  }
}

function textoReservar(encontrados: number) {
  const base =
    'Yo solo consulto el catálogo: no puedo reservar por ti. Se reserva con el botón «Reservar» de la ficha del libro.'
  if (encontrados === 0) return `${base} Dime el título y te paso el enlace.`
  return encontrados === 1
    ? `${base} Aquí tienes la ficha:`
    : `${base} Estas son las fichas que encontré:`
}

function textoBusqueda(consulta: string, libros: Libro[], total: number) {
  if (libros.length === 0)
    return `No encontré libros para «${consulta}». Prueba con otro título o autor.`
  if (libros.length === 1) {
    const [libro] = libros
    if (!libro) return ''
    return libro.disponibles > 0
      ? `Quedan ${libro.disponibles} ${libro.disponibles === 1 ? 'ejemplar' : 'ejemplares'} de «${libro.titulo}».`
      : `«${libro.titulo}» no tiene ejemplares disponibles ahora mismo.`
  }
  return total > libros.length
    ? `Encontré ${total} libros para «${consulta}». Estos son los primeros ${libros.length}:`
    : `Encontré ${total} libros para «${consulta}»:`
}

function textoCategoria(categoria: string, libros: Libro[], total: number) {
  if (libros.length === 0)
    return `No encontré libros de la categoría «${categoria}».`
  const disponibles = libros.filter((libro) => libro.disponibles > 0).length
  const cabecera =
    total === 1
      ? `Hay 1 libro de «${categoria}»`
      : `Hay ${total} libros de «${categoria}»`
  const detalle =
    total > libros.length ? `. Estos son los primeros ${libros.length}` : ''
  return `${cabecera}${detalle} (${disponibles} con ejemplares disponibles):`
}
