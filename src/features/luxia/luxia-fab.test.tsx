import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MOOD_INPUTS } from '@/features/luxia/hooks/use-luxia-controller'
import { HISTORY_LIMIT, STORAGE_KEY } from '@/features/luxia/services/historial'
import { dockAnim, ESQUINA } from '@/features/luxia/services/vuelo'
import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

const CATALOGO = '/catalogo?page=1&pageSize=12'

async function abrir() {
  const user = userEvent.setup()
  await user.click(
    await screen.findByRole('button', { name: 'Abrir chat con LuxIA' }),
  )
  const panel = await screen.findByRole('dialog', { name: 'LuxIA' })
  return { user, panel }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LuxIA', () => {
  it('la respuesta de Tolkien muestra una tarjeta con portada, título y disponibles; al pulsarla va a la ficha y cierra', async () => {
    server.use(
      ...crearApiFake([
        { titulo: 'El hobbit', autor: 'J. R. R. Tolkien', copias: 3 },
      ]).handlers,
    )
    const { router } = await renderEn(CATALOGO)
    const { user, panel } = await abrir()

    await user.type(
      within(panel).getByLabelText('Mensaje para LuxIA'),
      'Tolkien{Enter}',
    )

    const tarjeta = await within(panel).findByRole('link', {
      name: /El hobbit/,
    })
    expect(tarjeta).toHaveAttribute('href', '/libros/1')
    // Portada por ISBN, la misma fuente que el catálogo.
    const portada = tarjeta.querySelector('img')
    expect(portada?.getAttribute('src')).toContain(
      'covers.openlibrary.org/b/isbn/9780000000001',
    )
    expect(within(tarjeta).getByText('El hobbit')).toBeInTheDocument()
    expect(within(tarjeta).getByText('J. R. R. Tolkien')).toBeInTheDocument()
    expect(within(tarjeta).getByText('3 disponibles')).toBeInTheDocument()
    // Un solo resultado: sin «Ver todos».
    expect(
      within(panel).queryByRole('link', { name: 'Ver todos en el catálogo' }),
    ).toBeNull()

    await user.click(tarjeta)

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/libros/1'),
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'LuxIA' })).toBeNull(),
    )
  })

  it('con varios resultados apila 3 tarjetas y enlaza «Ver todos en el catálogo» con la búsqueda', async () => {
    server.use(
      ...crearApiFake(
        ['Uno', 'Dos', 'Tres', 'Cuatro'].map((t) => ({
          titulo: `Saga ${t}`,
          autor: 'Autora Saga',
        })),
      ).handlers,
    )
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()

    await user.type(
      within(panel).getByLabelText('Mensaje para LuxIA'),
      'Saga{Enter}',
    )

    expect(
      await within(panel).findAllByRole('link', { name: /^Saga/ }),
    ).toHaveLength(3)
    const verTodos = within(panel).getByRole('link', {
      name: 'Ver todos en el catálogo',
    })
    expect(verTodos.getAttribute('href')).toContain('buscar=Saga')
  })

  it('abre el panel, enfoca el mensaje y Escape lo cierra devolviendo el foco al botón', async () => {
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()

    expect(panel).toHaveAttribute('aria-modal', 'false')
    expect(within(panel).getByLabelText('Mensaje para LuxIA')).toHaveFocus()
    expect(
      screen.getByRole('button', {
        name: 'Cerrar chat',
        expanded: true,
        hidden: false,
      }),
    ).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'LuxIA' })).toBeNull(),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Abrir chat con LuxIA' }),
      ).toHaveFocus(),
    )
  })

  it('un chip envía su texto y la respuesta de /api/libros aparece en el log con enlace a la ficha', async () => {
    const api = crearApiFake([{ titulo: 'Dune', copias: 3 }])
    server.use(...api.handlers)
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()

    await user.click(
      within(panel).getByRole('button', {
        name: '¿Cuántos ejemplares quedan de Dune?',
      }),
    )

    const log = within(panel).getByRole('log')
    expect(
      await within(log).findByText('Quedan 3 ejemplares de «Dune».'),
    ).toBeInTheDocument()
    expect(
      await within(log).findByText(
        (_, el) =>
          el?.textContent === '¿Cuántos ejemplares quedan de Dune?' &&
          el.children.length === 0,
      ),
    ).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: /Dune/ })).toHaveAttribute(
      'href',
      '/libros/1',
    )
    expect(api.pedidos('/api/libros').at(-1)?.searchParams.get('search')).toBe(
      'Dune',
    )
  })

  it('Enter envía y Shift+Enter hace salto de línea', async () => {
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()
    const input = within(panel).getByLabelText('Mensaje para LuxIA')

    await user.type(input, 'Dune{Shift>}{Enter}{/Shift}')
    expect(input).toHaveValue('Dune\n')
    await user.type(input, '{Enter}')
    expect(input).toHaveValue('')
  })

  it('si la API falla muestra el error con Reintentar y reintenta sin duplicar el mensaje', async () => {
    let falla = true
    const api = crearApiFake([{ titulo: 'Dune', copias: 2 }])
    server.use(
      http.get('http://api.test/api/libros', ({ request }) => {
        const url = new URL(request.url)
        if (falla && url.searchParams.get('search'))
          return new HttpResponse(null, { status: 500 })
        return undefined
      }),
      ...api.handlers,
    )
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()

    await user.type(
      within(panel).getByLabelText('Mensaje para LuxIA'),
      'Dune{Enter}',
    )

    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'No pude responder ahora. Inténtalo de nuevo en un rato.',
    )
    expect(within(panel).getByTestId('luxia-status')).toHaveTextContent(
      'Sin conexión',
    )

    falla = false
    await user.click(within(panel).getByRole('button', { name: 'Reintentar' }))

    expect(
      await within(panel).findByText('Quedan 2 ejemplares de «Dune».'),
    ).toBeInTheDocument()
    expect(
      within(panel).getAllByText('Dune', { selector: '.luxia-chat__msg' }),
    ).toHaveLength(1)
    expect(within(panel).queryByRole('alert')).toBeNull()
  })

  it('guarda el historial en localStorage y lo limita', async () => {
    const viejos = Array.from({ length: 30 }, (_, i) => ({
      role: 'user',
      text: `m${i}`,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(viejos))
    await renderEn(CATALOGO)
    const { panel } = await abrir()

    // Al cargar solo quedan los últimos HISTORY_LIMIT.
    expect(within(panel).queryByText('m19')).toBeNull()
    expect(within(panel).getByText('m29')).toBeInTheDocument()
    const guardado = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    ) as unknown[]
    expect(guardado).toHaveLength(HISTORY_LIMIT)
  })

  it('pedir una reserva no llama a ningún endpoint de reservas y remite a la ficha', async () => {
    const api = crearApiFake([{ titulo: 'El Principito', copias: 2 }])
    server.use(...api.handlers)
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()

    await user.click(
      within(panel).getByRole('button', {
        name: '¿Cómo reservo El Principito?',
      }),
    )

    expect(
      await within(panel).findByText(/no puedo reservar por ti/),
    ).toBeInTheDocument()
    expect(
      within(panel).getByRole('link', { name: /El Principito/ }),
    ).toHaveAttribute('href', '/libros/1')
    expect(api.pedidos('/api/reservas')).toHaveLength(0)
  })

  it('el botón «Pregúntale a LuxIA» del sidebar abre el mismo panel (uno solo)', async () => {
    const user = userEvent.setup()
    await renderEn(CATALOGO)
    const [boton] = screen.getAllByRole('button', {
      name: 'Pregúntale a LuxIA',
    })
    if (!boton) throw new Error('Falta el botón del sidebar')

    await user.click(boton)

    expect(
      await screen.findAllByRole('dialog', { name: 'LuxIA' }),
    ).toHaveLength(1)
    expect(boton).toHaveAttribute('aria-expanded', 'true')
  })

  it('con reduced-motion no hay vuelo: solo fundido de 0,3 s', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    )
    await renderEn(CATALOGO)
    expect(screen.getByTestId('luxia-fab')).toHaveClass('is-reduced')
    await abrir()

    const sinVuelo = dockAnim({ x: -286, y: -388, s: 0.667 }, ESQUINA, true)
    expect(sinVuelo).toEqual({
      tipo: 'fundido',
      destino: { x: -286, y: -388, scale: 0.667 },
      duration: 0.3,
    })
    const conVuelo = dockAnim({ x: -286, y: -388, s: 0.667 }, ESQUINA, false)
    if (conVuelo.tipo !== 'arco') throw new Error('se esperaba un arco')
    expect(conVuelo.duration).toBe(0.75)
    expect(conVuelo.poses).toHaveLength(25)
    expect(conVuelo.poses[0]).toMatchObject({
      x: expect.closeTo(0, 6),
      y: expect.closeTo(0, 6),
      scale: expect.closeTo(1, 6),
      opacity: 1,
    })
    expect(conVuelo.poses.at(-1)).toMatchObject({ x: -286, y: -388 })
    // Arco: a mitad de vuelo pasa por encima de la recta entre origen y destino (flota).
    const medio = conVuelo.poses[12]
    expect(medio?.y).toBeLessThan(-388 * 0.5)
  })

  it('no aparece en la Home, el login ni el 404', async () => {
    for (const ruta of ['/', '/login', '/no-existe']) {
      const { unmount } = await renderEn(ruta)
      await act(async () => {})
      expect(screen.queryByTestId('luxia-fab')).toBeNull()
      unmount()
    }
  })

  it('mapeo de inputs Rive sin cambios', () => {
    expect(MOOD_INPUTS.greet).toEqual({ estado: 0, gesto: 4, mano: 16 })
    expect(MOOD_INPUTS.thinking).toEqual({ estado: 1, gesto: 0, mano: 2 })
    expect(MOOD_INPUTS.talking).toEqual({ estado: 2, gesto: 0, mano: 1 })
    expect(MOOD_INPUTS.error).toEqual({ estado: 4, gesto: 0, mano: 14 })
  })
})
