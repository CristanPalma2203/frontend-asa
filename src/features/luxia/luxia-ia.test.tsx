import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import type { PreguntaLuxia } from '@/features/luxia/schemas/respuesta.schema'
import { consultarLuxia } from '@/features/luxia/services/consulta'
import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

const CATALOGO = '/catalogo?page=1&pageSize=12'

function catalogo() {
  const api = crearApiFake([
    { titulo: 'Dune', autor: 'Frank Herbert', copias: 3 },
    { titulo: 'Cosmos', autor: 'Carl Sagan', copias: 1 },
  ])
  server.use(...api.handlers)
  return api
}

async function preguntar(texto: string) {
  const user = userEvent.setup()
  await renderEn(CATALOGO)
  await user.click(
    await screen.findByRole('button', { name: 'Abrir chat con LuxIA' }),
  )
  const panel = await screen.findByRole('dialog', { name: 'LuxIA' })
  await user.type(
    within(panel).getByLabelText('Mensaje para LuxIA'),
    `${texto}{Enter}`,
  )
  return { user, panel }
}

describe('LuxIA con IA del backend', () => {
  it('muestra el texto de la IA y arma las tarjetas con el stock real del catálogo', async () => {
    const api = catalogo()
    const cuerpos: PreguntaLuxia[] = []
    server.use(
      http.post('*/api/luxia/preguntar', async ({ request }) => {
        cuerpos.push((await request.json()) as PreguntaLuxia)
        return HttpResponse.json({
          texto: 'Para ciencia ficción te recomiendo Dune.',
          idsLibros: [1],
        })
      }),
    )

    const { user, panel } = await preguntar('¿Algo de ciencia ficción?')

    expect(
      await within(panel).findByText(
        'Para ciencia ficción te recomiendo Dune.',
      ),
    ).toBeInTheDocument()
    const tarjeta = within(panel).getByRole('link', { name: /Dune/ })
    expect(tarjeta).toHaveAttribute('href', '/libros/1')
    expect(tarjeta).toHaveTextContent('3 disponibles')
    expect(api.pedidos('/api/libros/1').length).toBeGreaterThan(0)
    expect(api.pedidos('/api/reservas')).toHaveLength(0)
    expect(cuerpos).toEqual([
      { pregunta: '¿Algo de ciencia ficción?', historial: [] },
    ])
    expect(within(panel).getByTestId('luxia-sugerencia')).toHaveTextContent(
      '¿Hay más libros de Frank Herbert?',
    )

    await user.type(
      within(panel).getByLabelText('Mensaje para LuxIA'),
      '¿Y de Herbert?{Enter}',
    )
    await waitFor(() => expect(cuerpos).toHaveLength(2))
    expect(cuerpos[1]).toEqual({
      pregunta: '¿Y de Herbert?',
      historial: [
        { rol: 'usuario', texto: '¿Algo de ciencia ficción?' },
        { rol: 'luxia', texto: 'Para ciencia ficción te recomiendo Dune.' },
      ],
    })
  })

  it('ante un 503 «luxia-no-disponible» responde con las reglas, sin avisar', async () => {
    catalogo()
    server.use(
      http.post('*/api/luxia/preguntar', () =>
        HttpResponse.json(
          {
            status: 503,
            title: 'luxia-no-disponible',
            code: 'luxia-no-disponible',
          },
          {
            status: 503,
            headers: { 'content-type': 'application/problem+json' },
          },
        ),
      ),
    )

    const { panel } = await preguntar('Dune')

    expect(
      await within(panel).findByText('Quedan 3 ejemplares de «Dune».'),
    ).toBeInTheDocument()
    expect(within(panel).queryByRole('alert')).toBeNull()
    expect(within(panel).getByRole('link', { name: /Dune/ })).toHaveAttribute(
      'href',
      '/libros/1',
    )
  })

  it('ante un 502 del proxy responde con las reglas, sin avisar', async () => {
    catalogo()
    server.use(
      http.post(
        '*/api/luxia/preguntar',
        () => new HttpResponse('Bad Gateway', { status: 502 }),
      ),
    )

    const { panel } = await preguntar('Dune')

    expect(
      await within(panel).findByText('Quedan 3 ejemplares de «Dune».'),
    ).toBeInTheDocument()
    expect(within(panel).queryByRole('alert')).toBeNull()
  })

  it('sin sesión responde con las reglas, sin avisar', async () => {
    catalogo()
    server.use(
      http.post(
        '*/api/luxia/preguntar',
        () => new HttpResponse(null, { status: 401 }),
      ),
    )

    const { panel } = await preguntar('Dune')

    expect(
      await within(panel).findByText('Quedan 3 ejemplares de «Dune».'),
    ).toBeInTheDocument()
    expect(within(panel).queryByRole('alert')).toBeNull()
  })

  it('ante un error de red responde con las reglas, sin avisar', async () => {
    catalogo()
    server.use(http.post('*/api/luxia/preguntar', () => HttpResponse.error()))

    const { panel } = await preguntar('Dune')

    expect(
      await within(panel).findByText('Quedan 3 ejemplares de «Dune».'),
    ).toBeInTheDocument()
    expect(within(panel).queryByRole('alert')).toBeNull()
  })

  it('mientras espera muestra «escribiendo» y no deja enviar dos veces', async () => {
    catalogo()
    let soltar: () => void = () => {}
    let pedidos = 0
    server.use(
      http.post('*/api/luxia/preguntar', async () => {
        pedidos++
        await new Promise<void>((resolve) => {
          soltar = resolve
        })
        return HttpResponse.json({ texto: 'Tengo Cosmos.', idsLibros: [2] })
      }),
    )

    const { user, panel } = await preguntar('Algo de divulgación')
    await waitFor(() => expect(pedidos).toBe(1))
    expect(
      within(panel).getByLabelText('LuxIA está escribiendo'),
    ).toBeInTheDocument()
    const entrada = within(panel).getByLabelText('Mensaje para LuxIA')
    await user.type(entrada, 'Otra{Enter}')
    await user.keyboard('{Enter}')
    expect(pedidos).toBe(1)

    await act(async () => soltar())
    expect(await within(panel).findByText('Tengo Cosmos.')).toBeInTheDocument()
    expect(
      within(panel).getByRole('link', { name: /Cosmos/ }),
    ).toHaveTextContent('1 disponible')
    expect(within(panel).queryByLabelText('LuxIA está escribiendo')).toBeNull()
  })

  it('si la IA tarda demasiado, usa las reglas como respaldo', async () => {
    const buscar = vi.fn().mockResolvedValue({
      items: [
        {
          idLibro: 1,
          isbn: '9780000000001',
          titulo: 'Dune',
          autor: 'Frank Herbert',
          categoria: 'Novela',
          totalEjemplares: 3,
          disponibles: 3,
        },
      ],
      page: 1,
      pageSize: 3,
      totalCount: 1,
      totalPages: 1,
    })
    const respuesta = await consultarLuxia('Dune', {
      buscar,
      obtenerLibro: vi.fn(),
      preguntar: () =>
        Promise.reject(new DOMException('tardó demasiado', 'TimeoutError')),
    })

    expect(respuesta.text).toBe('Quedan 3 ejemplares de «Dune».')
    expect(buscar).toHaveBeenCalledWith(
      expect.objectContaining({ buscar: 'Dune' }),
    )
  })
})
