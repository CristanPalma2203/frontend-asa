import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

const LIBROS = [
  ...Array.from({ length: 7 }, (_, i) => ({
    titulo: `Novela ${i + 1}`,
    categoria: 'Novela',
  })),
  { titulo: 'La Odisea', categoria: 'Clásicos' },
  { titulo: 'La Eneida', categoria: 'Clásicos' },
  { titulo: 'Cosmos', categoria: 'Ciencia' },
]

const CATALOGO = '/catalogo?page=1&pageSize=12'

function montarApi() {
  const api = crearApiFake(LIBROS)
  server.use(...api.handlers)
  return api
}

function buscadorCatalogo() {
  return screen.getByRole('combobox', { name: 'Buscar' })
}

function sugerencias() {
  return screen.queryByRole('listbox', { name: 'Categorías sugeridas' })
}

describe('sugerencias de categorías en el buscador', () => {
  it('escribir «nov» sugiere Novela con su cantidad de libros', async () => {
    const api = montarApi()
    const user = userEvent.setup()
    await renderEn(CATALOGO)
    await screen.findByRole('heading', { name: 'Cosmos' })

    await user.type(buscadorCatalogo(), 'nov')

    const lista = await screen.findByRole('listbox', {
      name: 'Categorías sugeridas',
    })
    expect(
      within(lista).getByRole('option', { name: 'Novela · 7 libros' }),
    ).toBeInTheDocument()
    expect(within(lista).getAllByRole('option')).toHaveLength(1)
    expect(buscadorCatalogo()).toHaveAttribute('aria-expanded', 'true')
    expect(buscadorCatalogo()).toHaveAttribute('aria-controls', lista.id)
    expect(api.pedidos('/api/categorias')).toHaveLength(1)
  })

  it('elegir la sugerencia filtra por categoría, pone ?categoria=Novela y limpia el texto', async () => {
    const api = montarApi()
    const user = userEvent.setup()
    const { router } = await renderEn(CATALOGO)
    await screen.findByRole('heading', { name: 'Cosmos' })

    await user.type(buscadorCatalogo(), 'nov')
    await user.click(
      await screen.findByRole('option', { name: 'Novela · 7 libros' }),
    )

    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        page: 1,
        pageSize: 12,
        categoria: 'Novela',
      }),
    )
    expect(router.state.location.href).toContain('categoria=Novela')
    expect(buscadorCatalogo()).toHaveValue('')
    expect(sugerencias()).toBeNull()
    const chips = screen.getByRole('group', { name: 'Categorías' })
    expect(
      within(chips).getByRole('button', { name: /^Novela/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() =>
      expect(
        api.pedidos('/api/libros').at(-1)?.searchParams.get('categoria'),
      ).toBe('Novela'),
    )
  })

  it('con el teclado: flechas para moverse y Enter para elegir', async () => {
    montarApi()
    const user = userEvent.setup()
    const { router } = await renderEn(CATALOGO)
    await screen.findByRole('heading', { name: 'Cosmos' })

    await user.type(buscadorCatalogo(), 'c')
    const lista = await screen.findByRole('listbox', {
      name: 'Categorías sugeridas',
    })
    const opciones = within(lista).getAllByRole('option')
    expect(opciones.map((o) => o.getAttribute('aria-label'))).toEqual([
      'Clásicos · 2 libros',
      'Ciencia · 1 libro',
    ])

    await user.keyboard('{ArrowDown}')
    expect(buscadorCatalogo()).toHaveAttribute(
      'aria-activedescendant',
      opciones[0]?.id,
    )
    expect(opciones[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(buscadorCatalogo()).toHaveAttribute(
      'aria-activedescendant',
      opciones[1]?.id,
    )
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        categoria: 'Ciencia',
      }),
    )
    expect(router.state.location.search).not.toHaveProperty('buscar')
  })

  it('«clasicos» sin acento sugiere Clásicos', async () => {
    montarApi()
    const user = userEvent.setup()
    await renderEn(CATALOGO)
    await screen.findByRole('heading', { name: 'Cosmos' })

    await user.type(buscadorCatalogo(), 'CLASICOS')

    expect(
      await screen.findByRole('option', { name: 'Clásicos · 2 libros' }),
    ).toBeInTheDocument()
  })

  it('Escape cierra el desplegable sin borrar el texto, y también se cierra al perder el foco', async () => {
    montarApi()
    const user = userEvent.setup()
    await renderEn(CATALOGO)
    await screen.findByRole('heading', { name: 'Cosmos' })

    await user.type(buscadorCatalogo(), 'nov')
    await screen.findByRole('listbox', { name: 'Categorías sugeridas' })
    await user.keyboard('{Escape}')

    expect(sugerencias()).toBeNull()
    expect(buscadorCatalogo()).toHaveAttribute('aria-expanded', 'false')
    expect(buscadorCatalogo()).toHaveValue('nov')

    await user.type(buscadorCatalogo(), 'e')
    await screen.findByRole('listbox', { name: 'Categorías sugeridas' })
    await user.tab()
    expect(sugerencias()).toBeNull()
  })

  it('sin coincidencias no aparece el desplegable y la búsqueda sigue igual', async () => {
    const api = montarApi()
    const user = userEvent.setup()
    const { router } = await renderEn(CATALOGO)
    await screen.findByRole('heading', { name: 'Cosmos' })

    await user.type(buscadorCatalogo(), 'odisea')

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        buscar: 'odisea',
      }),
    )
    expect(sugerencias()).toBeNull()
    expect(buscadorCatalogo()).toHaveAttribute('aria-expanded', 'false')
    expect(
      await screen.findByRole('heading', { name: 'La Odisea' }),
    ).toBeInTheDocument()
    expect(api.pedidos('/api/libros').at(-1)?.searchParams.get('search')).toBe(
      'odisea',
    )
  })

  it('Enter con el nombre exacto mantiene la búsqueda de texto y selecciona el chip', async () => {
    montarApi()
    const user = userEvent.setup()
    const { router } = await renderEn(CATALOGO)
    await screen.findByRole('heading', { name: 'Cosmos' })

    await user.type(buscadorCatalogo(), 'novela{Enter}')

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({
        buscar: 'novela',
        categoria: 'Novela',
      }),
    )
    expect(buscadorCatalogo()).toHaveValue('novela')
    const chips = screen.getByRole('group', { name: 'Categorías' })
    expect(
      within(chips).getByRole('button', { name: /^Novela/ }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      await screen.findByRole('heading', { name: 'Novela 7' }),
    ).toBeInTheDocument()
  })

  it('en el Home, elegir una sugerencia abre el catálogo filtrado', async () => {
    montarApi()
    const user = userEvent.setup()
    const { router } = await renderEn('/')
    const buscador = screen.getByRole('search', {
      name: 'Buscar en el catálogo',
    })

    await user.type(
      within(buscador).getByRole('combobox', {
        name: 'Buscar por título, autor o categoría',
      }),
      'nov',
    )
    await user.click(
      await within(buscador).findByRole('option', {
        name: 'Novela · 7 libros',
      }),
    )

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/catalogo'),
    )
    expect(router.state.location.search).toMatchObject({
      categoria: 'Novela',
    })
    expect(router.state.location.search).not.toHaveProperty('buscar')
  })

  it('en la barra superior, elegir una sugerencia navega al catálogo filtrado', async () => {
    montarApi()
    const user = userEvent.setup()
    const { router } = await renderEn('/libros/8')
    const barra = await screen.findByRole('combobox', {
      name: 'Buscar en el catálogo',
    })

    await user.type(barra, 'clá')
    await user.click(
      await screen.findByRole('option', { name: 'Clásicos · 2 libros' }),
    )

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/catalogo'),
    )
    expect(router.state.location.search).toEqual({
      page: 1,
      pageSize: 12,
      categoria: 'Clásicos',
    })
    expect(router.state.location.href).toContain(
      `categoria=${encodeURIComponent('Clásicos')}`,
    )
  })
})
