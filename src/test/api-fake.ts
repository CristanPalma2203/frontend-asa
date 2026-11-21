import { http, HttpResponse } from 'msw'

import type {
  EjemplarLista,
  Libro,
  LibroDetalle,
  PagedResponse,
  Reserva,
  ReservaCreada,
} from '@/features/biblioteca/types/api'
import type { EstadoEjemplar } from '@/features/biblioteca/types/estados'

const base = 'http://api.test'

type EjemplarFake = {
  idEjemplar: number
  codigoInventario: string
  estado: EstadoEjemplar
  rowVersion: string
}
type LibroFake = Omit<Libro, 'totalEjemplares' | 'disponibles'> & {
  ejemplares: EjemplarFake[]
}

export type LibroSemilla = {
  titulo: string
  autor?: string
  categoria?: string
  copias?: number
}

export function crearApiFake(semillas: LibroSemilla[]) {
  let siguienteEjemplar = 1
  const libros: LibroFake[] = semillas.map((semilla, i) => ({
    idLibro: i + 1,
    isbn: `97800000000${String(i + 1).padStart(2, '0')}`,
    titulo: semilla.titulo,
    autor: semilla.autor ?? 'Autor de prueba',
    categoria: semilla.categoria ?? 'Novela',
    ejemplares: Array.from({ length: semilla.copias ?? 3 }, () => {
      const id = siguienteEjemplar++
      return {
        idEjemplar: id,
        codigoInventario: `BIB-${String(id).padStart(3, '0')}`,
        estado: 'Disponible' as const,
        rowVersion: `rv-${id}-0`,
      }
    }),
  }))
  const requests: URL[] = []
  let siguienteReserva = 1

  const disponibles = (libro: LibroFake) =>
    libro.ejemplares.filter((e) => e.estado === 'Disponible').length
  const resumen = (libro: LibroFake): Libro => ({
    idLibro: libro.idLibro,
    isbn: libro.isbn,
    titulo: libro.titulo,
    autor: libro.autor,
    categoria: libro.categoria,
    totalEjemplares: libro.ejemplares.filter((e) => e.estado !== 'Inactivo')
      .length,
    disponibles: disponibles(libro),
  })
  const detalle = (libro: LibroFake): LibroDetalle => ({
    idLibro: libro.idLibro,
    isbn: libro.isbn,
    titulo: libro.titulo,
    autor: libro.autor,
    categoria: libro.categoria,
    estado: 'Activo',
    disponibles: disponibles(libro),
    ejemplares: libro.ejemplares.map((e) => ({ ...e })),
  })
  const buscarLibro = (id: unknown) =>
    libros.find((l) => l.idLibro === Number(id))
  const buscarEjemplar = (id: unknown) =>
    libros.flatMap((l) => l.ejemplares).find((e) => e.idEjemplar === Number(id))
  const problema = (status: number, code: string) =>
    HttpResponse.json(
      { status, title: code, code },
      { status, headers: { 'content-type': 'application/problem+json' } },
    )
  const registrar = (request: Request) => requests.push(new URL(request.url))

  const handlers = [
    http.get(`${base}/api/libros`, ({ request }) => {
      registrar(request)
      const params = new URL(request.url).searchParams
      const buscar = (
        params.get('buscar') ||
        params.get('search') ||
        ''
      ).toLowerCase()
      const autor = (params.get('autor') ?? '').toLowerCase()
      const categoria = params.get('categoria')
      const page = Number(params.get('page') ?? 1)
      const pageSize = Number(params.get('pageSize') ?? 10)
      const filtrados = libros.filter(
        (l) =>
          [l.titulo, l.autor, l.isbn].some((campo) =>
            campo.toLowerCase().includes(buscar),
          ) &&
          l.autor.toLowerCase().includes(autor) &&
          (!categoria || l.categoria === categoria),
      )
      const respuesta: PagedResponse<Libro> = {
        items: filtrados
          .slice((page - 1) * pageSize, page * pageSize)
          .map(resumen),
        page,
        pageSize,
        totalCount: filtrados.length,
        totalPages: Math.ceil(filtrados.length / pageSize),
      }
      return HttpResponse.json(respuesta)
    }),
    http.get(`${base}/api/libros/:id`, ({ request, params }) => {
      registrar(request)
      const libro = buscarLibro(params.id)
      return libro
        ? HttpResponse.json(detalle(libro))
        : problema(404, 'libro-no-encontrado')
    }),
    http.get(`${base}/api/libros/:id/ejemplares`, ({ request, params }) => {
      registrar(request)
      const libro = buscarLibro(params.id)
      if (!libro) return problema(404, 'libro-no-encontrado')
      const items: EjemplarLista[] = libro.ejemplares.map((e) => ({ ...e }))
      return HttpResponse.json(items)
    }),
    http.put(
      `${base}/api/libros/:id/ejemplares/:idEjemplar/estado`,
      async ({ request, params }) => {
        registrar(request)
        const ejemplar = buscarLibro(params.id)?.ejemplares.find(
          (e) => e.idEjemplar === Number(params.idEjemplar),
        )
        if (!ejemplar) return problema(404, 'ejemplar-no-encontrado')
        const cuerpo = (await request.json()) as {
          estado: EstadoEjemplar
          rowVersion: string
        }
        if (cuerpo.rowVersion !== ejemplar.rowVersion)
          return problema(409, 'conflicto-concurrencia')
        ejemplar.estado = cuerpo.estado
        ejemplar.rowVersion = `${ejemplar.rowVersion}+`
        return new HttpResponse(null, { status: 204 })
      },
    ),
    http.put(
      `${base}/api/ejemplares/:idEjemplar`,
      async ({ request, params }) => {
        registrar(request)
        const ejemplar = buscarEjemplar(params.idEjemplar)
        if (!ejemplar) return problema(404, 'ejemplar-no-encontrado')
        const cuerpo = (await request.json()) as {
          codigoInventario: string
          rowVersion: string
        }
        if (cuerpo.rowVersion !== ejemplar.rowVersion)
          return problema(409, 'conflicto-concurrencia')
        const duplicado = libros.some((l) =>
          l.ejemplares.some(
            (e) =>
              e !== ejemplar && e.codigoInventario === cuerpo.codigoInventario,
          ),
        )
        if (duplicado) return problema(409, 'codigo-inventario-duplicado')
        ejemplar.codigoInventario = cuerpo.codigoInventario
        ejemplar.rowVersion = `${ejemplar.rowVersion}+`
        return new HttpResponse(null, { status: 204 })
      },
    ),
    http.delete(`${base}/api/ejemplares/:idEjemplar`, ({ request, params }) => {
      registrar(request)
      const ejemplar = buscarEjemplar(params.idEjemplar)
      if (!ejemplar) return problema(404, 'ejemplar-no-encontrado')
      if (ejemplar.estado === 'Reservado')
        return problema(409, 'ejemplar-reservado')
      ejemplar.estado = 'Inactivo'
      ejemplar.rowVersion = `${ejemplar.rowVersion}+`
      return new HttpResponse(null, { status: 204 })
    }),
    http.post(`${base}/api/reservas`, async ({ request }) => {
      registrar(request)
      const { libroId } = (await request.json()) as {
        lectorId: number
        libroId: number
      }
      const libro = buscarLibro(libroId)
      if (!libro) return problema(404, 'libro-no-encontrado')
      const copia = libro.ejemplares.find((e) => e.estado === 'Disponible')
      if (!copia) return problema(409, 'sin-stock')
      copia.estado = 'Reservado'
      const creada: ReservaCreada = {
        idReserva: siguienteReserva++,
        idEjemplar: copia.idEjemplar,
        codigoInventario: copia.codigoInventario,
        estado: 'Activa',
        fechaSolicitud: '2026-11-20T14:00:00Z',
      }
      return HttpResponse.json(creada, { status: 201 })
    }),
    http.get(`${base}/api/lectores/:id/reservas`, ({ request }) => {
      registrar(request)
      const vacia: PagedResponse<Reserva> = {
        items: [],
        page: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0,
      }
      return HttpResponse.json(vacia)
    }),
  ]

  return {
    handlers,
    libros,
    pedidos: (pathname: string) =>
      requests.filter((url) => url.pathname === pathname),
  }
}
