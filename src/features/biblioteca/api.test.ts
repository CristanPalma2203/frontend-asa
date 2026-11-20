import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store'
import { cambiarEstadoEjemplar, misReservas } from '@/features/biblioteca/api'
import type { PagedResponse, Reserva } from '@/features/biblioteca/types'
import { server } from '@/test/server'

const base = 'http://api.test'

describe('api de biblioteca', () => {
  it('envía el estado del ejemplar como texto', async () => {
    let cuerpo: unknown
    server.use(
      http.put(`${base}/api/libros/:idLibro/ejemplares/:idEjemplar/estado`, async ({ request }) => {
        cuerpo = await request.json()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await cambiarEstadoEjemplar(1, 7, 'Inactivo', 'AAAAAAAAB9E=')

    expect(cuerpo).toEqual({ estado: 'Inactivo', rowVersion: 'AAAAAAAAB9E=' })
  })

  it.each([
    ['Activa', 'Activa'],
    ['Cancelada', 'Cancelada'],
    ['Todas', null],
  ] as const)('filtra mis reservas %s con estado=%s', async (filtro, esperado) => {
    useAuthStore.getState().login({
      token: 'token-test',
      expiresAt: Date.now() + 60_000,
      rol: 'Lector',
      nombre: 'Ana',
      lectorId: 2,
      correo: 'ana@demo.local',
    })
    let estado: string | null | undefined
    server.use(
      http.get(`${base}/api/lectores/:id/reservas`, ({ request }) => {
        estado = new URL(request.url).searchParams.get('estado')
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

    await misReservas(filtro)

    expect(estado).toBe(esperado)
  })
})
