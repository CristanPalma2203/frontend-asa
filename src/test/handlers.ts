import { http, HttpResponse } from 'msw'

import type {
  PagedResponse,
  Reserva,
  ReservaCreada,
} from '@/features/biblioteca/types/api'

import { detalleEjemplo, libroEjemplo } from './fixtures'

const base = 'http://api.test'

let esperaCancelar: Promise<void> | null = null
let soltarCancelar: (() => void) | null = null
let cancelarFalla = false

export function bloquearCancelacion() {
  cancelarFalla = false
  esperaCancelar = new Promise((resolve) => {
    soltarCancelar = resolve
  })
}

export function soltarCancelacion(falla: boolean) {
  cancelarFalla = falla
  soltarCancelar?.()
  soltarCancelar = null
}

function pagina<T>(items: T[]): PagedResponse<T> {
  return {
    items,
    page: 1,
    pageSize: 12,
    totalCount: items.length,
    totalPages: items.length === 0 ? 0 : 1,
  }
}

function problema(status: number, code: string) {
  return HttpResponse.json(
    { status, title: code, code },
    { status, headers: { 'content-type': 'application/problem+json' } },
  )
}

export const handlers = [
  http.get(`${base}/api/libros`, ({ request }) => {
    const buscar = new URL(request.url).searchParams.get('search') ?? ''
    if (buscar === 'vacio') return HttpResponse.json(pagina([]))
    const items = [libroEjemplo].filter((libro) =>
      libro.titulo.toLowerCase().includes(buscar.toLowerCase()),
    )
    return HttpResponse.json(pagina(items))
  }),
  http.get(`${base}/api/libros/:id`, () => HttpResponse.json(detalleEjemplo)),
  http.post(`${base}/api/reservas`, () =>
    HttpResponse.json(
      {
        idReserva: 9,
        idEjemplar: 1,
        codigoInventario: 'BIB-001',
        estado: 'Activa',
        fechaSolicitud: '2026-11-20T14:00:00Z',
      } satisfies ReservaCreada,
      { status: 201 },
    ),
  ),
  // Lista de lectores vacía por defecto (Resumen y contador del sidebar de admin).
  http.get(`${base}/api/lectores`, () => HttpResponse.json(pagina([]))),
  http.get(`${base}/api/lectores/:id/reservas`, () =>
    HttpResponse.json(
      pagina<Reserva>([
        {
          idReserva: 4,
          idLibro: 1,
          titulo: 'El Principito',
          codigoInventario: 'BIB-001',
          estado: 'Activa',
          fechaSolicitud: '2026-11-20T14:00:00Z',
          fechaCancelacion: null,
        },
      ]),
    ),
  ),
  http.post(`${base}/api/reservas/:id/cancelar`, async () => {
    if (esperaCancelar) await esperaCancelar
    esperaCancelar = null
    if (cancelarFalla) return problema(409, 'reserva-no-activa')
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${base}/api/auth/login`, () =>
    problema(401, 'credenciales-invalidas'),
  ),
]
