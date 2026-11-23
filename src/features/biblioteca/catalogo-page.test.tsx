import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  columnasPara,
  tamanoPaginaPorFilas,
} from '@/features/biblioteca/hooks/use-columnas-catalogo'

import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

function pedidosCatalogo(api: ReturnType<typeof crearApiFake>) {
  return api
    .pedidos('/api/libros')
    .filter((url) => url.searchParams.get('pageSize') === '12')
}

describe('catálogo', () => {
  it('renderiza los libros', async () => {
    await renderEn('/catalogo?page=1&pageSize=12')
    expect(
      await screen.findByRole('heading', { name: 'El Principito' }),
    ).toBeInTheDocument()
  })

  it('buscar manda ?search= a GET /api/libros y muestra solo los resultados filtrados', async () => {
    const user = userEvent.setup()
    const api = crearApiFake([
      { titulo: 'El Principito' },
      { titulo: 'El Hobbit' },
      { titulo: 'Dune' },
    ])
    server.use(...api.handlers)
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')
    await screen.findByRole('heading', { name: 'El Principito' })

    await user.type(screen.getByLabelText('Buscar'), 'hobbit')

    expect(
      await screen.findByRole(
        'heading',
        { name: 'El Hobbit' },
        { timeout: 3000 },
      ),
    ).toBeInTheDocument()
    await waitFor(
      () =>
        expect(
          screen.queryByRole('heading', { name: 'El Principito' }),
        ).not.toBeInTheDocument(),
      { timeout: 3000 },
    )
    expect(
      screen.queryByRole('heading', { name: 'Dune' }),
    ).not.toBeInTheDocument()
    const ultimo = pedidosCatalogo(api).at(-1)
    expect(ultimo?.searchParams.get('search')).toBe('hobbit')
    expect(ultimo?.searchParams.has('buscar')).toBe(false)
    expect(ultimo?.searchParams.get('page')).toBe('1')
    expect(router.state.location.href).toContain('buscar=hobbit')
  })

  it('el filtro de autor de la URL manda ?autor= y muestra solo sus libros', async () => {
    const api = crearApiFake([
      { titulo: 'El Hobbit', autor: 'J. R. R. Tolkien' },
      { titulo: 'El Silmarillion', autor: 'J. R. R. Tolkien' },
      { titulo: 'Dune', autor: 'Frank Herbert' },
    ])
    server.use(...api.handlers)
    await renderEn('/catalogo?page=1&pageSize=12&autor=tolkien')

    expect(
      await screen.findByRole('heading', { name: 'El Hobbit' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'El Silmarillion' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Dune' }),
    ).not.toBeInTheDocument()
    const ultimo = pedidosCatalogo(api).at(-1)
    expect(ultimo?.searchParams.get('autor')).toBe('tolkien')
    expect(ultimo?.searchParams.get('page')).toBe('1')
  })

  it('Siguiente manda ?page=2 y muestra los libros de esa página', async () => {
    const user = userEvent.setup()
    const titulos = Array.from(
      { length: 15 },
      (_, i) => `Libro ${String(i + 1).padStart(2, '0')}`,
    )
    const api = crearApiFake(titulos.map((titulo) => ({ titulo })))
    server.use(...api.handlers)
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')
    expect(
      await screen.findByRole('heading', { name: 'Libro 12' }),
    ).toBeInTheDocument()
    expect(screen.getByText('15 libros · página 1 de 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(
      await screen.findByRole('heading', { name: 'Libro 13' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Libro 15' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Libro 01' }),
    ).not.toBeInTheDocument()
    expect(screen.getByText('15 libros · página 2 de 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(pedidosCatalogo(api).at(-1)?.searchParams.get('page')).toBe('2')
    expect(router.state.location.search).toMatchObject({ page: 2 })
  })

  it('pulsar una tarjeta lleva a la ficha y Atrás vuelve al catálogo con sus filtros', async () => {
    const user = userEvent.setup()
    const { router } = await renderEn(
      '/catalogo?page=1&pageSize=12&categoria=Infantil',
    )

    const enlace = await screen.findByRole('link', { name: 'El Principito' })
    expect(enlace).toHaveAttribute('href', '/libros/1')
    await user.click(enlace)

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/libros/1'),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(
      await screen.findByRole('button', { name: 'Reservar' }),
    ).toBeInTheDocument()

    await act(() => router.history.back())
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/catalogo'),
    )
    expect(router.state.location.search).toMatchObject({
      page: 1,
      pageSize: 12,
      categoria: 'Infantil',
    })
  })

  it('la tarjeta se puede abrir con el teclado (Enter sobre el enlace)', async () => {
    const user = userEvent.setup()
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')

    const enlace = await screen.findByRole('link', { name: 'El Principito' })
    enlace.focus()
    expect(enlace).toHaveFocus()
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/libros/1'),
    )
  })

  it('los chips de categoría muestran su conteo, escriben ?categoria= en la URL y lo mandan a la API', async () => {
    const user = userEvent.setup()
    const api = crearApiFake([
      { titulo: 'Dune', categoria: 'Ciencia ficción' },
      { titulo: 'Cien años de soledad', categoria: 'Novela' },
      { titulo: 'Rayuela', categoria: 'Novela' },
    ])
    server.use(...api.handlers)
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')
    await screen.findByRole('heading', { name: 'Dune' })

    const chips = await screen.findByRole('group', { name: 'Categorías' })
    expect(
      await within(chips).findByRole('button', { name: /^Todas\s*3$/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    await user.click(
      within(chips).getByRole('button', { name: /^Novela\s*2$/ }),
    )

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        categoria: 'Novela',
      }),
    )
    await waitFor(() =>
      expect(pedidosCatalogo(api).at(-1)?.searchParams.get('categoria')).toBe(
        'Novela',
      ),
    )
  })

  it('los chips rápidos y «Ordenar» van a la URL y se aplican sobre la página', async () => {
    const user = userEvent.setup()
    const api = crearApiFake([
      { titulo: 'Zeta', autor: 'Ana', copias: 1 },
      { titulo: 'Alfa', autor: 'Zoe', copias: 3 },
      { titulo: 'Media', autor: 'Luis', copias: 0 },
    ])
    server.use(...api.handlers)
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')
    await screen.findByRole('heading', { name: 'Zeta' })
    const titulos = () =>
      screen
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent)
        .filter((t) => ['Zeta', 'Alfa', 'Media'].includes(t ?? ''))

    await user.selectOptions(screen.getByLabelText('Ordenar'), 'titulo')
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ orden: 'titulo' }),
    )
    await waitFor(() => expect(titulos()).toEqual(['Alfa', 'Media', 'Zeta']))

    await user.selectOptions(screen.getByLabelText('Ordenar'), 'disponibles')
    await waitFor(() => expect(titulos()).toEqual(['Alfa', 'Zeta', 'Media']))

    await user.click(screen.getByRole('button', { name: /Agotados/ }))
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        disponibilidad: 'agotados',
        orden: 'disponibles',
        page: 1,
      }),
    )
    await waitFor(() => expect(titulos()).toEqual(['Media']))
    const ultimo = pedidosCatalogo(api).at(-1)
    expect(ultimo?.searchParams.has('disponibilidad')).toBe(false)
    expect(ultimo?.searchParams.has('orden')).toBe(false)
    expect(screen.getByText('3 libros')).toBeInTheDocument()
  })

  it('muestra el vacío', async () => {
    const user = userEvent.setup()
    await renderEn('/catalogo?page=1&pageSize=12')
    await screen.findByRole('heading', { name: 'El Principito' })
    await user.type(screen.getByLabelText('Buscar'), 'vacio')
    expect(
      await screen.findByRole('heading', { name: 'Sin resultados' }),
    ).toBeInTheDocument()
  })

  it('muestra el error', async () => {
    server.use(
      http.get(
        'http://api.test/api/libros',
        () => new HttpResponse(null, { status: 500 }),
      ),
    )
    await renderEn('/catalogo?page=1&pageSize=12')
    expect(
      await screen.findByRole('heading', {
        name: 'No se pudo cargar el catálogo',
      }),
    ).toBeInTheDocument()
  })

  describe('categorías en el buscador', () => {
    const LIBROS = [
      { titulo: 'Dune', autor: 'Frank Herbert', categoria: 'Ciencia ficción' },
      {
        titulo: 'Fundación',
        autor: 'Isaac Asimov',
        categoria: 'Ciencia ficción',
      },
      { titulo: 'Rayuela', autor: 'Julio Cortázar', categoria: 'Novela' },
      { titulo: 'Cosmos', autor: 'Carl Sagan', categoria: 'Divulgación' },
    ]
    const titulosVisibles = () =>
      screen
        .getAllByRole('heading', { level: 2 })
        .map((h) => h.textContent)
        .filter((t) => LIBROS.some((l) => l.titulo === t))

    it('los chips salen de GET /api/categorias, con «Todas» y su conteo', async () => {
      const api = crearApiFake(LIBROS)
      server.use(...api.handlers)
      await renderEn('/catalogo?page=1&pageSize=12')

      const chips = await screen.findByRole('group', { name: 'Categorías' })
      await within(chips).findByRole('button', { name: /^Novela\s*1$/ })
      expect(
        within(chips)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Todas4', 'Ciencia ficción2', 'Divulgación1', 'Novela1'])
      expect(api.pedidos('/api/categorias').length).toBeGreaterThan(0)
    })

    it('escribir el nombre de una categoría muestra sus libros', async () => {
      const user = userEvent.setup()
      const api = crearApiFake(LIBROS)
      server.use(...api.handlers)
      await renderEn('/catalogo?page=1&pageSize=12')
      await screen.findByRole('heading', { name: 'Dune' })

      expect(screen.getByLabelText('Buscar')).toHaveAttribute(
        'placeholder',
        'Busca por título, autor o categoría',
      )
      await user.type(screen.getByLabelText('Buscar'), 'novela')

      await waitFor(() => expect(titulosVisibles()).toEqual(['Rayuela']))
      expect(pedidosCatalogo(api).at(-1)?.searchParams.get('search')).toBe(
        'novela',
      )
    })

    it('elegir una categoría la combina con el texto y la deja en la URL con encodeURIComponent', async () => {
      const user = userEvent.setup()
      const api = crearApiFake(LIBROS)
      server.use(...api.handlers)
      const { router } = await renderEn('/catalogo?page=1&pageSize=12')
      await screen.findByRole('heading', { name: 'Dune' })

      await user.type(screen.getByLabelText('Buscar'), 'fun')
      await waitFor(() =>
        expect(router.state.location.search).toMatchObject({ buscar: 'fun' }),
      )
      const chips = screen.getByRole('group', { name: 'Categorías' })
      await user.click(
        await within(chips).findByRole('button', {
          name: /^Ciencia ficción\s*2$/,
        }),
      )

      await waitFor(() => expect(titulosVisibles()).toEqual(['Fundación']))
      const pedido = pedidosCatalogo(api).at(-1)
      expect(pedido?.searchParams.get('categoria')).toBe('Ciencia ficción')
      expect(pedido?.searchParams.get('search')).toBe('fun')
      expect(router.state.location.href).toContain(
        `categoria=${encodeURIComponent('Ciencia ficción')}`,
      )
      expect(
        within(chips).getByRole('button', { name: /^Ciencia ficción/ }),
      ).toHaveAttribute('aria-pressed', 'true')

      await user.click(within(chips).getByRole('button', { name: /^Todas/ }))
      await waitFor(() =>
        expect(router.state.location.search).not.toHaveProperty('categoria'),
      )
      expect(router.state.location.search).toMatchObject({ buscar: 'fun' })
      expect(
        within(chips).getByRole('button', { name: /^Todas/ }),
      ).toHaveAttribute('aria-pressed', 'true')
    })

    it('al abrir una URL compartida conserva la categoría y la marca', async () => {
      const api = crearApiFake(LIBROS)
      server.use(...api.handlers)
      await renderEn(
        `/catalogo?page=1&pageSize=12&categoria=${encodeURIComponent('Ciencia ficción')}`,
      )

      await screen.findByRole('heading', { name: 'Dune' })
      expect(titulosVisibles()).toEqual(['Dune', 'Fundación'])
      const chips = screen.getByRole('group', { name: 'Categorías' })
      expect(
        await within(chips).findByRole('button', { name: /^Ciencia ficción/ }),
      ).toHaveAttribute('aria-pressed', 'true')
    })

    it('sin resultados nombra el texto y la categoría y ofrece limpiar los filtros', async () => {
      const user = userEvent.setup()
      server.use(...crearApiFake(LIBROS).handlers)
      const { router } = await renderEn(
        `/catalogo?page=1&pageSize=12&buscar=zzz&categoria=Novela`,
      )

      expect(
        await screen.findByText(
          'No encontramos libros para «zzz» en la categoría «Novela».',
        ),
      ).toBeInTheDocument()
      await user.click(screen.getByRole('link', { name: 'Limpiar filtros' }))

      await screen.findByRole('heading', { name: 'Dune' })
      expect(router.state.location.search).toEqual({ page: 1, pageSize: 12 })
      expect(screen.getByLabelText('Buscar')).toHaveValue('')
    })
  })

  describe('cuadrícula de libros', () => {
    const CATALOGO_26 = [
      { titulo: 'Liderar con propósito', categoria: 'Liderazgo' },
      { titulo: 'Cosmos', categoria: 'Ciencia' },
      { titulo: 'Breve historia del tiempo', categoria: 'Ciencia' },
      { titulo: 'El gen egoísta', categoria: 'Ciencia' },
      ...Array.from({ length: 7 }, (_, i) => ({
        titulo: `Novela ${i + 1}`,
        categoria: 'Novela',
      })),
      ...Array.from({ length: 15 }, (_, i) => ({
        titulo: `Ensayo ${String(i + 1).padStart(2, '0')}`,
        categoria: 'Ensayo',
      })),
    ]

    function rejilla() {
      const lista = screen
        .getAllByRole('list')
        .find((ul) => ul.querySelector('article'))
      if (!lista) throw new Error('no hay cuadrícula de libros')
      return lista
    }

    function simularContenedor(ancho: number, tarjeta: number, hueco: number) {
      const leer = CSSStyleDeclaration.prototype.getPropertyValue
      vi.spyOn(
        CSSStyleDeclaration.prototype,
        'getPropertyValue',
      ).mockImplementation(function (
        this: CSSStyleDeclaration,
        propiedad: string,
      ) {
        if (propiedad === '--ancho-tarjeta') return `${tarjeta}px`
        if (propiedad === '--hueco') return `${hueco}px`
        return leer.call(this, propiedad)
      })
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(
        function (this: HTMLElement) {
          return this.className.includes('--ancho-tarjeta') ? ancho : 0
        },
      )
    }

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it.each([
      ['Todas', '', 12, 'Breve historia del tiempo'],
      ['Liderazgo', '&categoria=Liderazgo', 1, 'Liderar con propósito'],
      ['Ciencia', '&categoria=Ciencia', 3, 'El gen egoísta'],
      ['Novela', '&categoria=Novela', 7, 'Novela 7'],
    ])(
      'con %s las tarjetas tienen ancho fijo y se centran con flex-wrap',
      async (_nombre, filtro, cantidad, visible) => {
        server.use(...crearApiFake(CATALOGO_26).handlers)
        await renderEn(`/catalogo?page=1&pageSize=12${filtro}`)
        await screen.findByRole('heading', { name: visible })

        const lista = rejilla()
        expect(lista).toHaveClass(
          'flex',
          'flex-wrap',
          'justify-center',
          'gap-(--hueco)',
        )
        expect(lista.className).not.toMatch(/grid|auto-fi/)
        expect(lista.parentElement).toHaveClass(
          '[--ancho-tarjeta:160px]',
          'sm:[--ancho-tarjeta:200px]',
          '[--hueco:16px]',
          'lg:[--hueco:20px]',
        )
        const celdas = within(lista).getAllByRole('listitem')
        expect(celdas).toHaveLength(cantidad)
        for (const celda of celdas)
          expect(celda).toHaveClass(
            'w-(--ancho-tarjeta)',
            'max-w-(--ancho-tarjeta)',
            'min-w-0',
            'flex-[0_0_var(--ancho-tarjeta)]',
          )
      },
    )

    it('los huecos de carga usan la misma distribución y el mismo ancho de tarjeta', async () => {
      let soltar: () => void = () => {}
      server.use(
        http.get('*/api/libros', async () => {
          await new Promise<void>((resolve) => {
            soltar = resolve
          })
          return undefined
        }),
        ...crearApiFake(CATALOGO_26).handlers,
      )
      await renderEn('/catalogo?page=1&pageSize=12')

      const cargando = await screen.findByRole('list', {
        name: 'Cargando libros',
      })
      const claseCarga = cargando.className
      const celdaCarga = within(cargando).getAllByRole('listitem')[0]?.className
      expect(
        within(cargando).getAllByTestId('libro-card-fantasma'),
      ).toHaveLength(12)
      soltar()

      await screen.findByRole('heading', { name: 'Cosmos' })
      const lista = rejilla()
      expect(lista.className).toBe(claseCarga)
      expect(within(lista).getAllByRole('listitem')[0]?.className).toBe(
        celdaCarga,
      )
    })

    it.each([
      [375, 343, 160, 16, 2, 12],
      [768, 720, 200, 16, 3, 12],
      [1024, 712, 200, 20, 3, 12],
      [1280, 952, 200, 20, 4, 12],
      [1440, 1112, 200, 20, 5, 15],
      [1920, 1592, 200, 20, 7, 14],
    ])(
      'a %i px (contenedor de %i px) caben las columnas reales y la página llena filas completas',
      (_viewport, ancho, tarjeta, hueco, columnas, pagina) => {
        expect(columnasPara(ancho, tarjeta, hueco)).toBe(columnas)
        expect(tamanoPaginaPorFilas(12, columnas)).toBe(pagina)
        expect(pagina % columnas).toBe(0)
      },
    )

    it('respeta el máximo de 50 del backend', () => {
      expect(tamanoPaginaPorFilas(48, 7)).toBe(49)
      expect(tamanoPaginaPorFilas(50, 7)).toBe(49)
      expect(tamanoPaginaPorFilas(12, null)).toBe(12)
    })

    it('pide a la API un múltiplo de las columnas medidas en el contenedor', async () => {
      simularContenedor(1592, 200, 20)
      const api = crearApiFake(CATALOGO_26)
      server.use(...api.handlers)
      await renderEn('/catalogo?page=1&pageSize=12')

      await screen.findByRole('heading', { name: 'Cosmos' })
      const tamanos = api
        .pedidos('/api/libros')
        .filter((url) => !url.searchParams.has('categoria'))
        .map((url) => url.searchParams.get('pageSize'))
      expect(tamanos).toContain('14')
      expect(tamanos).not.toContain('12')
      expect(within(rejilla()).getAllByRole('listitem')).toHaveLength(14)
      expect(screen.getByText(/página 1 de 2/)).toBeInTheDocument()
    })

    it('una portada horizontal y un autor largo no ensanchan su tarjeta', async () => {
      server.use(
        ...crearApiFake([
          {
            titulo: 'Design Patterns',
            autor: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
            categoria: 'Tecnología',
          },
          {
            titulo: 'Clean Code',
            autor: 'Robert C. Martin',
            categoria: 'Tecnología',
          },
          {
            titulo: 'Refactoring',
            autor: 'Martin Fowler',
            categoria: 'Tecnología',
          },
        ]).handlers,
      )
      await renderEn('/catalogo?page=1&pageSize=12')

      const tarjeta = (titulo: string) => {
        const articulo = screen
          .getByRole('heading', { name: titulo })
          .closest('article')
        if (!articulo) throw new Error(`sin tarjeta para ${titulo}`)
        return articulo
      }
      await screen.findByRole('heading', { name: 'Design Patterns' })
      const disenio = tarjeta('Design Patterns')
      const portada = disenio.querySelector('img')
      if (!portada) throw new Error('sin portada')
      Object.defineProperties(portada, {
        complete: { value: true },
        naturalWidth: { value: 640 },
        naturalHeight: { value: 320 },
      })
      fireEvent.load(portada)

      expect(portada).toHaveClass(
        'object-contain',
        'max-w-full',
        'max-h-full',
        'opacity-100',
      )
      expect(disenio).toHaveClass('w-full', 'min-w-0', 'overflow-hidden')
      const autor = within(disenio).getByText(/^Erich Gamma/)
      expect(autor).toHaveClass('line-clamp-2', 'min-w-0', 'break-words')
      expect(autor).not.toHaveClass('truncate')

      for (const otro of ['Clean Code', 'Refactoring']) {
        expect(disenio.parentElement?.className).toBe(
          tarjeta(otro).parentElement?.className,
        )
        expect(disenio.className).toBe(tarjeta(otro).className)
        expect(portada.closest('.aspect-\\[2\\/3\\]')?.className).toBe(
          tarjeta(otro).querySelector('.aspect-\\[2\\/3\\]')?.className,
        )
      }
      expect(disenio.parentElement).toHaveClass(
        'w-(--ancho-tarjeta)',
        'max-w-(--ancho-tarjeta)',
      )
    })

    it('una búsqueda sin resultados no deja una cuadrícula vacía', async () => {
      server.use(...crearApiFake(CATALOGO_26).handlers)
      await renderEn('/catalogo?page=1&pageSize=12&buscar=zzz')

      expect(await screen.findByText('Sin resultados')).toBeInTheDocument()
      expect(document.querySelector('ul article')).toBeNull()
    })
  })
})
