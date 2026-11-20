import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { listarReservasDeLector } from '@/features/biblioteca/services/reservas.read'
import type { PagedResponse, Reserva } from '@/features/biblioteca/types/api'
import { server } from '@/test/server'

const base = 'http://api.test'

describe('reservas.read', () => {
  it.each([
    ['Activa', 'Activa'],
    ['Cancelada', 'Cancelada'],
    ['Todas', null],
  ] as const)('filtra mis reservas %s con estado=%s', async (filtro, esperado) => {
    let estado: string | null | undefined
    let lector: string | readonly string[] | undefined
    server.use(
      http.get(`${base}/api/lectores/:id/reservas`, ({ request, params }) => {
        estado = new URL(request.url).searchParams.get('estado')
        lector = params.id
        const vacia: PagedResponse<Reserva> = {
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
        }
        return HttpResponse.json(vacia)
      }),
    )

    await listarReservasDeLector(2, filtro)

    expect(estado).toBe(esperado)
    expect(lector).toBe('2')
  })
})
