import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { resumirHome } from '@/features/biblioteca/hooks/use-libros'
import type { Libro } from '@/features/biblioteca/types/api'
import { crearApiFake } from '@/test/api-fake'
import { libroEjemplo } from '@/test/fixtures'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const CATALOGO = [
  { titulo: 'Agotado 1', categoria: 'Novela', copias: 0 },
  { titulo: 'Cien años de soledad', categoria: 'Novela', copias: 3 },
  { titulo: 'Rayuela', categoria: 'Novela', copias: 1 },
  { titulo: 'Cosmos', categoria: 'Ciencia', copias: 2 },
  { titulo: 'El Principito', categoria: 'Infantil', copias: 1 },
]

describe('home', () => {
  it('mientras carga muestra los huecos de recomendados y categorías', async () => {
    server.use(
      http.get('*/api/libros', () => new Promise<never>(() => {})),
      http.get('*/api/categorias', () => new Promise<never>(() => {})),
    )
    await renderEn('/')

    expect(
      await screen.findByRole('list', { name: 'Cargando recomendados' }),
    ).toHaveAttribute('aria-busy', 'true')
    expect(
      screen.getByRole('list', { name: 'Cargando categorías' }),
    ).toHaveAttribute('aria-busy', 'true')
  })

  it('saluda al lector y muestra los recomendados primero con stock, con enlace a su ficha', async () => {
    entrarComo('Lector')
    server.use(...crearApiFake(CATALOGO).handlers)
    await renderEn('/')

    expect(screen.getByText('Hola, Ana')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Descubre tu próxima lectura',
      }),
    ).toBeInTheDocument()

    const recomendados = await screen.findByRole('list', {
      name: 'Recomendados',
    })
    const enlaces = within(recomendados).getAllByRole('link')
    expect(enlaces.length).toBeGreaterThanOrEqual(4)
    expect(enlaces.length).toBeLessThanOrEqual(6)
    expect(enlaces.at(-1)).toHaveAccessibleName('Agotado 1, agotado')
    expect(
      within(recomendados).getByRole('link', {
        name: 'Cien años de soledad, 3 disponibles',
      }),
    ).toHaveAttribute('href', '/libros/2')
    expect(
      screen.getByRole('link', { name: /Ver todos/ }).getAttribute('href'),
    ).toContain('/catalogo')
  })

  it('«Explora por categoría» muestra cada categoría con su conteo y abre el catálogo filtrado', async () => {
    const user = userEvent.setup()
    server.use(...crearApiFake(CATALOGO).handlers)
    const { router } = await renderEn('/')

    const categorias = await screen.findByRole('list', { name: 'Categorías' })
    const novela = within(categorias).getByRole('link', {
      name: 'Ver libros de Novela',
    })
    expect(novela).toHaveTextContent('3 libros')
    expect(
      within(categorias).getByRole('link', { name: 'Ver libros de Ciencia' }),
    ).toHaveTextContent('1 libro')

    await user.click(novela)
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/catalogo'),
    )
    expect(router.state.location.search).toMatchObject({ categoria: 'Novela' })
  })

  it('el buscador lleva al catálogo con texto y categoría en la URL', async () => {
    const user = userEvent.setup()
    server.use(...crearApiFake(CATALOGO).handlers)
    const { router } = await renderEn('/')
    await screen.findByRole('list', { name: 'Recomendados' })

    const buscador = screen.getByRole('search', {
      name: 'Buscar en el catálogo',
    })
    await user.selectOptions(
      within(buscador).getByLabelText('Categoría'),
      'Novela',
    )
    await user.type(
      within(buscador).getByLabelText('Buscar por título, autor o categoría'),
      'rayuela',
    )
    await user.click(within(buscador).getByRole('button', { name: 'Buscar' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/catalogo'),
    )
    expect(router.state.location.search).toMatchObject({
      page: 1,
      buscar: 'rayuela',
      categoria: 'Novela',
    })
  })

  it('saluda con el nombre si hay sesión', async () => {
    entrarComo('Lector')
    server.use(...crearApiFake(CATALOGO).handlers)
    await renderEn('/')
    expect(screen.getByText('Hola, Ana')).toBeInTheDocument()
  })

  it('a la visita anónima no la saluda (ni con un «Hola» suelto)', async () => {
    server.use(...crearApiFake(CATALOGO).handlers)
    await renderEn('/')
    await screen.findByRole('heading', {
      level: 1,
      name: 'Descubre tu próxima lectura',
    })
    expect(screen.queryByText(/^Hola/)).toBeNull()
  })

  it('con reserva activa: tarjeta con sus datos y la grilla de categorías en 2 columnas', async () => {
    entrarComo('Lector')
    await renderEn('/')
    const tarjeta = await screen.findByRole('region', {
      name: 'Tu reserva activa',
    })
    expect(within(tarjeta).getByText('El Principito')).toBeInTheDocument()
    expect(within(tarjeta).getByText('BIB-001')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Activa')).toBeInTheDocument()
    expect(
      await within(tarjeta).findByText('Antoine de Saint-Exupéry'),
    ).toBeInTheDocument()
    expect(within(tarjeta).getByText(/^Reservado el /)).toBeInTheDocument()
    expect(
      within(tarjeta).getByRole('link', { name: /Ver mis reservas/ }),
    ).toHaveAttribute('href', '/mis-reservas')

    const categorias = await screen.findByRole('list', { name: 'Categorías' })
    expect(categorias).toHaveAttribute('data-columnas', '2')
  })

  it('con varias reservas activas muestra la más reciente y «+N más»', async () => {
    entrarComo('Lector')
    const reserva = (idReserva: number, titulo: string, fecha: string) => ({
      idReserva,
      idLibro: 1,
      titulo,
      codigoInventario: `BIB-00${idReserva}`,
      estado: 'Activa',
      fechaSolicitud: fecha,
      fechaCancelacion: null,
    })
    server.use(
      http.get('*/api/lectores/:id/reservas', () =>
        HttpResponse.json({
          items: [
            reserva(1, 'Antigua', '2026-11-01T10:00:00Z'),
            reserva(2, 'Reciente', '2026-11-20T10:00:00Z'),
            reserva(3, 'Media', '2026-11-10T10:00:00Z'),
          ],
          page: 1,
          pageSize: 20,
          totalCount: 3,
          totalPages: 1,
        }),
      ),
    )
    await renderEn('/')
    const tarjeta = await screen.findByRole('region', {
      name: 'Tu reserva activa',
    })
    expect(within(tarjeta).getByText('Reciente')).toBeInTheDocument()
    expect(
      within(tarjeta).getByText('+2 reservas activas más'),
    ).toBeInTheDocument()
  })

  it('sin reserva activa no hay tarjeta y las categorías van a ancho completo', async () => {
    entrarComo('Lector')
    server.use(
      ...crearApiFake(CATALOGO).handlers,
      http.get('*/api/lectores/:id/reservas', () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
        }),
      ),
    )
    await renderEn('/')
    const categorias = await screen.findByRole('list', { name: 'Categorías' })
    await waitFor(() =>
      expect(categorias).toHaveAttribute('data-columnas', 'auto'),
    )
    expect(
      screen.queryByRole('region', { name: 'Tu reserva activa' }),
    ).toBeNull()
    expect(screen.queryByLabelText('Cargando tu reserva')).toBeNull()
  })

  it('el admin (vista Biblioteca) nunca ve la tarjeta de reserva', async () => {
    entrarComo('Admin')
    server.use(...crearApiFake(CATALOGO).handlers)
    await renderEn('/')
    const categorias = await screen.findByRole('list', { name: 'Categorías' })
    expect(categorias).toHaveAttribute('data-columnas', 'auto')
    expect(
      screen.queryByRole('region', { name: 'Tu reserva activa' }),
    ).toBeNull()
  })
})

describe('home: explora por categoría', () => {
  it('usa GET /api/categorias: no muestra categorías que la API no devuelve', async () => {
    server.use(
      http.get('*/api/categorias', () =>
        HttpResponse.json([
          { id: 'Ciencia', nombre: 'Ciencia', cantidadLibros: 1 },
          { id: 'Novela', nombre: 'Novela', cantidadLibros: 3 },
        ]),
      ),
      ...crearApiFake(CATALOGO).handlers,
    )
    await renderEn('/')

    const categorias = await screen.findByRole('list', { name: 'Categorías' })
    expect(
      within(categorias)
        .getAllByRole('link')
        .map((enlace) => enlace.getAttribute('aria-label')),
    ).toEqual(['Ver libros de Novela', 'Ver libros de Ciencia'])
    expect(
      within(categorias).queryByRole('link', {
        name: 'Ver libros de Infantil',
      }),
    ).toBeNull()
  })

  it('la cuadrícula no deja celdas vacías: filas que se reparten el ancho, también en carga', async () => {
    let soltar: () => void = () => {}
    server.use(
      http.get('*/api/categorias', async () => {
        await new Promise<void>((resolve) => {
          soltar = resolve
        })
        return HttpResponse.json([
          { id: 'Ciencia', nombre: 'Ciencia', cantidadLibros: 1 },
          { id: 'Infantil', nombre: 'Infantil', cantidadLibros: 1 },
          { id: 'Novela', nombre: 'Novela', cantidadLibros: 3 },
        ])
      }),
      ...crearApiFake(CATALOGO).handlers,
    )
    await renderEn('/')

    const cargando = await screen.findByRole('list', {
      name: 'Cargando categorías',
    })
    const celdasCargando = within(cargando).getAllByRole('listitem')
    soltar()
    const categorias = await screen.findByRole('list', { name: 'Categorías' })
    const celdas = within(categorias).getAllByRole('listitem')

    expect(celdas).toHaveLength(3)
    for (const lista of [cargando, categorias]) {
      expect(lista).toHaveClass('flex', 'flex-wrap')
      expect(lista.className).not.toMatch(/grid-cols|auto-fill/)
    }
    for (const celda of [...celdasCargando, ...celdas]) {
      expect(celda).toHaveClass('flex-[1_1_10rem]', 'sm:flex-[1_1_13.75rem]')
    }
  })

  it('al tocar una categoría abre el buscador filtrado, con el nombre codificado en la URL', async () => {
    const user = userEvent.setup()
    server.use(
      ...crearApiFake([
        { titulo: 'Dune', categoria: 'Ciencia ficción' },
        { titulo: 'Rayuela', categoria: 'Novela' },
      ]).handlers,
    )
    const { router } = await renderEn('/')

    const categorias = await screen.findByRole('list', { name: 'Categorías' })
    const enlace = within(categorias).getByRole('link', {
      name: 'Ver libros de Ciencia ficción',
    })
    expect(enlace.getAttribute('href')).toContain(
      `categoria=${encodeURIComponent('Ciencia ficción')}`,
    )
    await user.click(enlace)

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/catalogo'),
    )
    expect(router.state.location.search).toMatchObject({
      categoria: 'Ciencia ficción',
    })
    expect(
      await screen.findByRole('heading', { name: 'Dune' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Rayuela' })).toBeNull()
  })
})

describe('resumirHome', () => {
  const libro = (
    id: number,
    categoria: string,
    disponibles: number,
  ): Libro => ({
    ...libroEjemplo,
    idLibro: id,
    categoria,
    disponibles,
  })

  it('pone primero los libros con stock y elige por categoría una portada con stock', () => {
    const items = [
      libro(1, 'Poesía', 0),
      libro(2, 'Novela', 0),
      libro(3, 'Novela', 2),
    ]
    const resumen = resumirHome({ items })

    expect(resumen.destacados.map((l) => l.idLibro)).toEqual([3, 1, 2])
    expect(
      resumen.portadasCategorias.map((c) => [c.categoria, c.portada.idLibro]),
    ).toEqual([
      ['Poesía', 1],
      ['Novela', 3],
    ])
  })
})
