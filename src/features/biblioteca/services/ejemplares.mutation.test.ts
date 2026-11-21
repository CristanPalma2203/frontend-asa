import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { cambiarEstadoEjemplar } from '@/features/biblioteca/services/ejemplares.mutation'
import { server } from '@/test/server'

const base = 'http://api.test'

describe('ejemplares.mutation', () => {
  it('envía el estado del ejemplar como texto', async () => {
    let cuerpo: unknown
    server.use(
      http.put(
        `${base}/api/libros/:idLibro/ejemplares/:idEjemplar/estado`,
        async ({ request }) => {
          cuerpo = await request.json()
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )

    await cambiarEstadoEjemplar(1, 7, 'Inactivo', 'AAAAAAAAB9E=')

    expect(cuerpo).toEqual({ estado: 'Inactivo', rowVersion: 'AAAAAAAAB9E=' })
  })
})
