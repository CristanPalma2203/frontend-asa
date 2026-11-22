import { ZodError } from 'zod'

import type {
  Libro,
  ListarLibrosParams,
  PagedResponse,
} from '@/features/biblioteca/types/api'
import {
  categoriaDe,
  interpretar,
  normalizar,
  normalizarPregunta,
  sinPalabrasVacias,
} from '@/features/luxia/interpretar'
import {
  candidatasTras,
  preguntasHechas,
  primeraNueva,
  type ContextoSugerencia,
} from '@/features/luxia/services/sugerencia'
import {
  type PreguntaLuxia,
  type RespuestaLuxia,
} from '@/features/luxia/schemas/respuesta.schema'
import { preguntarLuxia } from '@/features/luxia/services/luxia.mutation'
import {
  fichasDeLibros,
  type ObtenerLibro,
} from '@/features/luxia/services/luxia.read'
import type { ChatLibro, ChatMsg } from '@/features/luxia/types/chat'
import { ApiError } from '@/lib/api/client'

export const RESULTADOS = 3

export type BuscarLibros = (
  params: ListarLibrosParams,
) => Promise<PagedResponse<Libro>>

const ARRIBA = 'Lo tienes arriba.'

function variar(plantillas: string[], semilla: number) {
  return plantillas[semilla % plantillas.length] ?? plantillas[0] ?? ''
}

const ejemplares = (n: number) => (n === 1 ? 'ejemplar' : 'ejemplares')

export const TURNOS_PARA_IA = 6

export type FuentesLuxia = {
  buscar: BuscarLibros
  categorias?: () => Promise<string[]>
  obtenerLibro: ObtenerLibro
  preguntar?: (cuerpo: PreguntaLuxia) => Promise<RespuestaLuxia>
}

export async function consultarLuxia(
  pregunta: string,
  {
    buscar,
    categorias,
    obtenerLibro,
    preguntar = preguntarLuxia,
  }: FuentesLuxia,
  historial: ChatMsg[] = [],
): Promise<ChatMsg> {
  const respuesta = await preguntar({
    pregunta,
    historial: historial.slice(-TURNOS_PARA_IA).map((m) => ({
      rol: m.role === 'user' ? 'usuario' : 'luxia',
      texto: m.text,
    })),
  }).catch((error: unknown) => {
    if (usarRespaldo(error)) return null
    throw error
  })
  if (!respuesta) {
    return consultarConReglas(pregunta, buscar, categorias, historial)
  }

  const mostrados = librosMostrados(historial)
  const libros = await fichasDeLibros(respuesta.idsLibros, obtenerLibro)
  const nuevos = libros.filter((l) => !mostrados.has(l.idLibro))
  const primero = libros[0]
  const sugerencia = primeraNueva(
    candidatasTras(
      primero
        ? {
            tipo: 'libro',
            autor: primero.autor,
            categoria: primero.categoria,
          }
        : { tipo: 'nada' },
    ),
    preguntasHechas(historial, [pregunta]),
  )

  return {
    role: 'assistant',
    text:
      libros.length > 0 && nuevos.length === 0
        ? `${respuesta.texto} ${ARRIBA}`
        : respuesta.texto,
    ...(nuevos.length > 0 ? { libros: nuevos.slice(0, RESULTADOS) } : {}),
    ...(sugerencia ? { sugerencia } : {}),
  }
}

const ESTADOS_RESPALDO = new Set([429, 502, 503, 504])

function usarRespaldo(error: unknown) {
  if (error instanceof ApiError) return ESTADOS_RESPALDO.has(error.status)
  if (error instanceof ZodError || error instanceof TypeError) return true
  return (
    error instanceof DOMException &&
    (error.name === 'TimeoutError' || error.name === 'AbortError')
  )
}

function librosMostrados(historial: ChatMsg[]) {
  return new Set(
    historial.flatMap((m) => m.libros?.map((l) => l.idLibro) ?? []),
  )
}

export async function consultarConReglas(
  pregunta: string,
  buscar: BuscarLibros,
  categorias: () => Promise<string[]> = async () => [],
  historial: ChatMsg[] = [],
): Promise<ChatMsg> {
  const intencion = interpretar(pregunta)
  const semilla = historial.filter((m) => m.libros?.length).length
  const previas = preguntasHechas(historial)
  const repetida = previas.has(normalizarPregunta(pregunta))
  const hechas = preguntasHechas(historial, [pregunta])
  const mostrados = librosMostrados(historial)
  const yaExplicoReserva = historial.some(
    (m) => m.role === 'user' && interpretar(m.text).tipo === 'reservar',
  )
  const conSugerencia = (ctx: ContextoSugerencia) => {
    const sugerencia = primeraNueva(candidatasTras(ctx), hechas)
    return sugerencia ? { sugerencia } : {}
  }

  if (intencion.tipo === 'vacia') {
    return {
      role: 'assistant',
      text: variar(
        [
          'Dime un título, autor o ISBN y te digo cuántos ejemplares quedan.',
          '¿Qué libro buscas? Dime su título, autor o ISBN.',
        ],
        semilla,
      ),
    }
  }
  if (intencion.tipo === 'reservar' && !intencion.consulta) {
    return { role: 'assistant', text: textoReservar(yaExplicoReserva, '') }
  }
  if (normalizar(intencion.consulta) === 'isbn') {
    return {
      role: 'assistant',
      text: 'Escríbeme el ISBN (por ejemplo, 9788498387087) y te digo cuántos ejemplares quedan.',
      ...conSugerencia({ tipo: 'nada' }),
    }
  }

  const resto = sinPalabrasVacias(pregunta)
  const similares = /^(similares?|parecid[oa]s)$/.test(resto)
  const general = !resto && intencion.tipo === 'buscar'
  const categoria = similares
    ? ultimaCategoria(historial)
    : general
      ? null
      : categoriaDe(pregunta, await categorias().catch(() => []))
  const filtro: Partial<ListarLibrosParams> = categoria
    ? { categoria }
    : general || similares
      ? {}
      : { buscar: intencion.consulta }

  const pagina = await buscar({ page: 1, pageSize: RESULTADOS, ...filtro })
  const libros: ChatLibro[] = pagina.items.map(
    ({ idLibro, isbn, titulo, autor, disponibles, categoria: cat }) => ({
      idLibro,
      isbn,
      titulo,
      autor,
      disponibles,
      categoria: cat,
    }),
  )
  const nuevos = libros.filter((l) => !mostrados.has(l.idLibro))
  const primero = libros[0]

  let text: string
  if (intencion.tipo === 'reservar') {
    text = textoReservar(
      yaExplicoReserva,
      libros.length === 0 ? '' : nuevos.length > 0 ? 'ficha' : 'arriba',
    )
  } else if (repetida && primero) {
    text = textoRepetida(primero, semilla)
  } else {
    text = categoria
      ? textoCategoria(categoria, pagina.items, pagina.totalCount, semilla)
      : general || similares
        ? variar(
            [
              'Estos son algunos libros del catálogo:',
              'Te dejo algunos libros del catálogo:',
            ],
            semilla,
          )
        : textoBusqueda(
            intencion.consulta,
            pagina.items,
            pagina.totalCount,
            semilla,
          )
    if (libros.length > 0 && nuevos.length === 0) text = `${text} ${ARRIBA}`
  }

  let ctx: ContextoSugerencia = { tipo: 'nada' }
  if (primero) {
    ctx = { tipo: 'libro', autor: primero.autor, categoria: primero.categoria }
    if (!categoria && esAutor(intencion.consulta, libros)) {
      ctx = { tipo: 'autor', otroAutor: await otroAutor(primero, buscar) }
    }
  }

  return {
    role: 'assistant',
    text,
    ...(nuevos.length > 0 ? { libros: nuevos } : {}),
    ...conSugerencia(ctx),
    ...(pagina.totalCount > 1 && !general && !similares
      ? {
          ...(categoria ? { categoria } : { consulta: intencion.consulta }),
          total: pagina.totalCount,
        }
      : {}),
  }
}

function ultimaCategoria(historial: ChatMsg[]) {
  for (let i = historial.length - 1; i >= 0; i--) {
    const cat = historial[i]?.libros?.find((l) => l.categoria)?.categoria
    if (cat) return cat
  }
  return null
}

function esAutor(consulta: string, libros: ChatLibro[]) {
  const q = normalizar(consulta).trim()
  return (
    q.length >= 3 &&
    libros.length > 0 &&
    libros.every((l) => normalizar(l.autor).includes(q)) &&
    !libros.some((l) => normalizar(l.titulo).includes(q))
  )
}

async function otroAutor(libro: ChatLibro, buscar: BuscarLibros) {
  if (!libro.categoria) return undefined
  try {
    const pagina = await buscar({
      page: 1,
      pageSize: 12,
      categoria: libro.categoria,
    })
    return pagina.items.find(
      (l) => l.autor && normalizar(l.autor) !== normalizar(libro.autor),
    )?.autor
  } catch {
    return undefined
  }
}

function textoReservar(yaExplico: boolean, cola: '' | 'ficha' | 'arriba') {
  const base = yaExplico
    ? 'Se reserva con el botón «Reservar» de la ficha del libro.'
    : 'No puedo reservar por ti: se reserva con el botón «Reservar» de la ficha del libro.'
  if (cola === 'ficha') return `${base} Aquí tienes la ficha:`
  if (cola === 'arriba') return `${base} ${ARRIBA}`
  return base
}

function textoRepetida(libro: ChatLibro, semilla: number) {
  const n = libro.disponibles
  if (n === 0)
    return variar(
      [
        `Sigue igual: «${libro.titulo}» no tiene ejemplares disponibles ahora mismo.`,
        `Lo acabo de mirar: «${libro.titulo}» sigue sin ejemplares libres.`,
      ],
      semilla,
    )
  return variar(
    [
      `Sigue igual: quedan ${n} ${ejemplares(n)} de «${libro.titulo}».`,
      `Lo acabo de mirar: siguen quedando ${n} ${ejemplares(n)} de «${libro.titulo}».`,
      `Sin cambios: ${n} ${ejemplares(n)} de «${libro.titulo}» disponibles.`,
    ],
    semilla,
  )
}

function textoBusqueda(
  consulta: string,
  libros: Libro[],
  total: number,
  semilla: number,
) {
  if (libros.length === 0)
    return variar(
      [
        `No encontré libros para «${consulta}». Prueba con otro título o autor.`,
        `No hay nada para «${consulta}» en el catálogo. ¿Probamos con otro título o autor?`,
        `«${consulta}» no aparece en el catálogo. Prueba con el ISBN u otro título.`,
      ],
      semilla,
    )
  if (libros.length === 1) {
    const [libro] = libros
    if (!libro) return ''
    const n = libro.disponibles
    return n > 0
      ? variar(
          [
            `Quedan ${n} ${ejemplares(n)} de «${libro.titulo}».`,
            `De «${libro.titulo}» hay ${n} ${ejemplares(n)} disponibles.`,
            `«${libro.titulo}»: ${n} ${ejemplares(n)} libres ahora mismo.`,
          ],
          semilla,
        )
      : variar(
          [
            `«${libro.titulo}» no tiene ejemplares disponibles ahora mismo.`,
            `Ahora mismo no queda ningún ejemplar de «${libro.titulo}».`,
          ],
          semilla,
        )
  }
  if (total > libros.length)
    return variar(
      [
        `Encontré ${total} libros para «${consulta}». Estos son los primeros ${libros.length}:`,
        `Hay ${total} libros para «${consulta}»; te enseño los primeros ${libros.length}:`,
      ],
      semilla,
    )
  return variar(
    [
      `Encontré ${total} libros para «${consulta}»:`,
      `Para «${consulta}» tengo ${total} libros:`,
    ],
    semilla,
  )
}

function textoCategoria(
  categoria: string,
  libros: Libro[],
  total: number,
  semilla: number,
) {
  if (libros.length === 0)
    return variar(
      [
        `No encontré libros de la categoría «${categoria}».`,
        `Ahora mismo no hay libros de «${categoria}» en el catálogo.`,
      ],
      semilla,
    )
  const disponibles = libros.filter((libro) => libro.disponibles > 0).length
  const cabecera =
    total === 1
      ? `Hay 1 libro de «${categoria}»`
      : `Hay ${total} libros de «${categoria}»`
  const detalle =
    total > libros.length ? `. Estos son los primeros ${libros.length}` : ''
  return `${cabecera}${detalle} (${disponibles} con ejemplares disponibles):`
}
