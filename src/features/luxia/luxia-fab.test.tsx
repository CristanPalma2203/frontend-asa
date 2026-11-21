import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import gsap from 'gsap'
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
  it('auto-scroll al final de la lista con cada mensaje nuevo', async () => {
    server.use(...crearApiFake([{ titulo: 'Dune', copias: 3 }]).handlers)
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()
    const log = within(panel).getByRole('log')
    Object.defineProperty(log, 'scrollHeight', {
      configurable: true,
      get: () => 1000,
    })
    log.scrollTop = 0

    await user.type(
      within(panel).getByLabelText('Mensaje para LuxIA'),
      'Dune{Enter}',
    )
    expect(
      await within(log).findByText('Quedan 3 ejemplares de «Dune».'),
    ).toBeInTheDocument()
    await waitFor(() => expect(log.scrollTop).toBe(1000))
  })

  it('sin conversación: un solo chip, el inicial, bajo el saludo', async () => {
    await renderEn(CATALOGO)
    const { panel } = await abrir()
    const chips = within(panel).getAllByTestId('luxia-sugerencia')
    expect(chips).toHaveLength(1)
    expect(chips[0]).toHaveTextContent('¿Hay libros de Tolkien?')
  })

  it('con historial guardado: exactamente un chip, debajo de la última respuesta', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { role: 'user', text: 'Dune' },
        {
          role: 'assistant',
          text: 'Quedan 3 ejemplares de «Dune».',
          sugerencia: '¿Hay más libros de Frank Herbert?',
        },
      ]),
    )
    await renderEn(CATALOGO)
    const { panel } = await abrir()

    const chips = within(panel).getAllByTestId('luxia-sugerencia')
    expect(chips).toHaveLength(1)
    expect(chips[0]).toHaveTextContent('¿Hay más libros de Frank Herbert?')
    const ultima = within(panel).getByText('Quedan 3 ejemplares de «Dune».')
    expect(
      ultima.compareDocumentPosition(chips[0] as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('mientras LuxIA responde: sin chip y con «escribiendo» (3 puntos); luego, un chip contextual', async () => {
    let soltar: (() => void) | null = null
    const api = crearApiFake([{ titulo: 'Dune', copias: 3 }])
    server.use(
      http.get('*/api/libros', ({ request }) => {
        if (new URL(request.url).searchParams.get('search') !== 'Dune')
          return undefined
        return new Promise<undefined>((resolve) => {
          soltar = () => resolve(undefined)
        })
      }),
      ...api.handlers,
    )
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()

    await user.type(
      within(panel).getByLabelText('Mensaje para LuxIA'),
      'Dune{Enter}',
    )
    await waitFor(() => expect(soltar).not.toBeNull())
    expect(within(panel).queryByTestId('luxia-sugerencia')).toBeNull()
    const escribiendo = within(panel).getByLabelText('LuxIA está escribiendo')
    expect(escribiendo.querySelectorAll('span')).toHaveLength(3)

    await act(async () => soltar?.())
    expect(
      await within(panel).findByTestId('luxia-sugerencia'),
    ).toHaveTextContent('¿Hay más libros de Autor de prueba?')
    expect(within(panel).getAllByTestId('luxia-sugerencia')).toHaveLength(1)
  })

  it('los mensajes nuevos entran con fundido y 8 px (GSAP); el historial al abrir, no', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { role: 'user', text: 'Hola' },
        { role: 'assistant', text: 'Hola, ¿qué buscas?' },
      ]),
    )
    server.use(...crearApiFake([{ titulo: 'Dune', copias: 3 }]).handlers)
    const desde = vi.spyOn(gsap, 'fromTo')
    try {
      await renderEn(CATALOGO)
      const { user, panel } = await abrir()
      const entradas = () =>
        desde.mock.calls.filter(
          ([, de]) =>
            (de as { y?: number; opacity?: number }).y === 8 &&
            (de as { opacity?: number }).opacity === 0,
        )
      const historial = within(panel).getByText('Hola, ¿qué buscas?')
      expect(
        entradas().some(([objetivo]) =>
          (objetivo as Element[]).includes?.(historial),
        ),
      ).toBe(false)

      await user.type(
        within(panel).getByLabelText('Mensaje para LuxIA'),
        'Dune{Enter}',
      )
      const respuesta = await within(panel).findByText(
        'Quedan 3 ejemplares de «Dune».',
      )
      await waitFor(() =>
        expect(
          entradas().some(([objetivo]) =>
            Array.from(objetivo as ArrayLike<Element>).includes(respuesta),
          ),
        ).toBe(true),
      )
    } finally {
      desde.mockRestore()
    }
  })

  it('abrir y cerrar el chat (con vuelo real al header y vuelta) no deja errores en consola', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    const medidas = ['offsetWidth', 'offsetHeight', 'offsetParent'] as const
    const originales = medidas.map((prop) =>
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, prop),
    )
    for (const prop of medidas)
      Object.defineProperty(HTMLElement.prototype, prop, {
        configurable: true,
        get(this: HTMLElement) {
          return prop === 'offsetParent' ? this.parentElement : 48
        },
      })
    const aGsap = vi.spyOn(gsap, 'to')
    const errores: unknown[] = []
    const consola = vi
      .spyOn(console, 'error')
      .mockImplementation((...args) => errores.push(args))
    const alError = (e: ErrorEvent) => errores.push(e.error ?? e.message)
    window.addEventListener('error', alError)

    try {
      await renderEn(CATALOGO)
      const { user } = await abrir()
      await waitFor(() =>
        expect(screen.getByTestId('luxia-anchor')).toHaveAttribute(
          'data-dock',
          'header',
        ),
      )
      const dock = document.querySelector('.luxia-fab__dock')
      await waitFor(() =>
        expect(aGsap).toHaveBeenCalledWith(
          dock,
          expect.objectContaining({ keyframes: expect.any(Array) }),
        ),
      )
      await act(() => new Promise((r) => setTimeout(r, 900)))

      await user.keyboard('{Escape}')
      await waitFor(() =>
        expect(screen.queryByRole('dialog', { name: 'LuxIA' })).toBeNull(),
      )
      await waitFor(() =>
        expect(screen.getByTestId('luxia-anchor')).toHaveAttribute(
          'data-dock',
          'corner',
        ),
      )
      await act(() => new Promise((r) => setTimeout(r, 900)))

      expect(errores).toEqual([])
    } finally {
      window.removeEventListener('error', alError)
      consola.mockRestore()
      aGsap.mockRestore()
      medidas.forEach((prop, i) => {
        const original = originales[i]
        if (original)
          Object.defineProperty(HTMLElement.prototype, prop, original)
      })
    }
  })

  it.each([['¿qué libros de ciencia hay disponibles?'], ['Ciencia']])(
    '«%s» busca por la categoría Ciencia',
    async (pregunta) => {
      const api = crearApiFake([
        { titulo: 'Cosmos', autor: 'Carl Sagan', categoria: 'Ciencia' },
        {
          titulo: 'Breve historia del tiempo',
          autor: 'Stephen Hawking',
          categoria: 'Ciencia',
        },
        { titulo: 'Dune', autor: 'Frank Herbert', categoria: 'Novela' },
      ])
      server.use(...api.handlers)
      await renderEn(CATALOGO)
      const { user, panel } = await abrir()

      await user.type(
        within(panel).getByLabelText('Mensaje para LuxIA'),
        `${pregunta}{Enter}`,
      )

      expect(
        await within(panel).findByText(/Hay 2 libros de «Ciencia»/),
      ).toBeInTheDocument()
      expect(
        within(panel).getByRole('link', { name: /Cosmos/ }),
      ).toBeInTheDocument()
      expect(
        within(panel).getByRole('link', { name: /Breve historia del tiempo/ }),
      ).toBeInTheDocument()
      expect(within(panel).queryByRole('link', { name: /Dune/ })).toBeNull()
      const ultima = api.pedidos('/api/libros').at(-1)
      expect(ultima?.searchParams.get('categoria')).toBe('Ciencia')
      expect(ultima?.searchParams.get('search')).toBeNull()
      expect(
        within(panel)
          .getByRole('link', { name: 'Ver todos en el catálogo' })
          .getAttribute('href'),
      ).toContain('categoria=Ciencia')
    },
  )

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
    const portada = tarjeta.querySelector('img')
    expect(portada?.getAttribute('src')).toContain(
      'covers.openlibrary.org/b/isbn/9780000000001',
    )
    expect(within(tarjeta).getByText('El hobbit')).toBeInTheDocument()
    expect(within(tarjeta).getByText('J. R. R. Tolkien')).toBeInTheDocument()
    expect(within(tarjeta).getByText('3 disponibles')).toBeInTheDocument()
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

  it('una pregunta escrita y la respuesta de /api/libros aparece en el log con enlace a la ficha', async () => {
    const api = crearApiFake([{ titulo: 'Dune', copias: 3 }])
    server.use(...api.handlers)
    await renderEn(CATALOGO)
    const { user, panel } = await abrir()

    await user.type(
      within(panel).getByLabelText('Mensaje para LuxIA'),
      '¿Cuántos ejemplares quedan de Dune?{Enter}',
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

    await user.type(
      within(panel).getByLabelText('Mensaje para LuxIA'),
      '¿Cómo reservo El Principito?{Enter}',
    )

    expect(
      await within(panel).findByText(/no puedo reservar por ti/i),
    ).toBeInTheDocument()
    expect(
      within(panel).getByRole('link', { name: /El Principito/ }),
    ).toHaveAttribute('href', '/libros/1')
    expect(api.pedidos('/api/reservas')).toHaveLength(0)
  })

  it('con reduced-motion el muelle es instantáneo: sin vuelo ni fundido', async () => {
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
      tipo: 'quieto',
      destino: { x: -286, y: -388, scale: 0.667 },
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
    const medio = conVuelo.poses[12]
    expect(medio?.y).toBeLessThan(-388 * 0.5)
  })

  it('la mascota está en la Home (que lleva sidebar), pero no en el login ni el 404', async () => {
    const home = await renderEn('/')
    expect(await screen.findByTestId('luxia-fab')).toBeInTheDocument()
    home.unmount()
    for (const ruta of ['/login', '/no-existe']) {
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

  describe('sin repetirse', () => {
    const escribir = async (
      user: ReturnType<typeof userEvent.setup>,
      panel: HTMLElement,
      texto: string,
    ) => {
      const respuestas = within(panel).queryAllByTestId('luxia-chat-msg').length
      await user.type(
        within(panel).getByLabelText('Mensaje para LuxIA'),
        `${texto}{Enter}`,
      )
      await waitFor(() =>
        expect(
          within(panel).queryAllByTestId('luxia-chat-msg').length,
        ).toBeGreaterThanOrEqual(respuestas + 2),
      )
      await waitFor(() =>
        expect(
          within(panel).queryByLabelText('LuxIA está escribiendo'),
        ).toBeNull(),
      )
    }

    it('no repite la tarjeta de un libro que ya salió en la conversación', async () => {
      server.use(
        ...crearApiFake([
          { titulo: 'El hobbit', autor: 'J. R. R. Tolkien', copias: 3 },
        ]).handlers,
      )
      await renderEn(CATALOGO)
      const { user, panel } = await abrir()

      await escribir(user, panel, '¿Hay libros de Tolkien?')
      expect(
        within(panel).getAllByRole('link', { name: /El hobbit/ }),
      ).toHaveLength(1)

      await escribir(user, panel, '¿Cómo reservo El hobbit?')
      expect(
        await within(panel).findByText(
          /se reserva con el botón «Reservar».*Lo tienes arriba/,
        ),
      ).toBeInTheDocument()
      expect(
        within(panel).getAllByRole('link', { name: /El hobbit/ }),
      ).toHaveLength(1)

      await escribir(user, panel, 'El hobbit')
      expect(
        within(panel).getAllByRole('link', { name: /El hobbit/ }),
      ).toHaveLength(1)
    })

    it('una pregunta repetida responde con el dato actualizado y otras palabras', async () => {
      server.use(...crearApiFake([{ titulo: 'Dune', copias: 3 }]).handlers)
      await renderEn(CATALOGO)
      const { user, panel } = await abrir()

      await escribir(user, panel, 'Dune')
      await escribir(user, panel, '¿dune?')
      expect(
        await within(panel).findByText(
          /^(Sigue igual|Lo acabo de mirar|Sin cambios).*3 ejemplares de «Dune»/,
        ),
      ).toBeInTheDocument()
      expect(
        within(panel).getAllByText('Quedan 3 ejemplares de «Dune».'),
      ).toHaveLength(1)
    })

    it('el chip nunca sugiere una pregunta ya hecha ni sobre reservar, y desaparece sin opciones', async () => {
      server.use(
        ...crearApiFake([
          {
            titulo: 'Dune',
            autor: 'Frank Herbert',
            categoria: 'Ciencia ficción',
          },
        ]).handlers,
      )
      await renderEn(CATALOGO)
      const { user, panel } = await abrir()
      const hechas = new Set<string>()
      const chip = () => within(panel).queryByTestId('luxia-sugerencia')
      const norm = (t: string) =>
        t
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9ñ ]/g, '')
          .trim()

      await escribir(user, panel, 'Dune')
      hechas.add(norm('Dune'))
      for (let i = 0; i < 8 && chip(); i++) {
        const texto = chip()?.textContent ?? ''
        expect(texto).not.toMatch(/reserv/i)
        expect(hechas.has(norm(texto))).toBe(false)
        hechas.add(norm(texto))
        await user.click(chip() as HTMLElement)
        await waitFor(() =>
          expect(
            within(panel).queryByLabelText('LuxIA está escribiendo'),
          ).toBeNull(),
        )
        await within(panel).findAllByText(/./, { selector: '.is-assistant' })
      }
      expect(chip()).toBeNull()
    })
  })
})
