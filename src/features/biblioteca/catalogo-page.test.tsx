import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

describe('catálogo', () => {
  it('renderiza los libros', async () => {
    await renderEn('/catalogo?page=1&pageSize=12')
    expect(await screen.findByRole('heading', { name: 'El Principito' })).toBeInTheDocument()
  })

  it('buscar manda ?search= a GET /api/libros y muestra solo los resultados filtrados', async () => {
    const user = userEvent.setup()
    const api = crearApiFake([{ titulo: 'El Principito' }, { titulo: 'El Hobbit' }, { titulo: 'Dune' }])
    server.use(...api.handlers)
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')
    await screen.findByRole('heading', { name: 'El Principito' })

    await user.type(screen.getByLabelText('Buscar'), 'hobbit')

    expect(await screen.findByRole('heading', { name: 'El Hobbit' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'El Principito' })).not.toBeInTheDocument(),
    )
    expect(screen.queryByRole('heading', { name: 'Dune' })).not.toBeInTheDocument()
    const ultimo = api.pedidos('/api/libros').at(-1)
    expect(ultimo?.searchParams.get('search')).toBe('hobbit')
    expect(ultimo?.searchParams.has('buscar')).toBe(false)
    expect(ultimo?.searchParams.get('page')).toBe('1')
    // La URL de la app conserva su propio nombre de parámetro.
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

    expect(await screen.findByRole('heading', { name: 'El Hobbit' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'El Silmarillion' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Dune' })).not.toBeInTheDocument()
    const ultimo = api.pedidos('/api/libros').at(-1)
    expect(ultimo?.searchParams.get('autor')).toBe('tolkien')
    expect(ultimo?.searchParams.get('page')).toBe('1')
  })

  it('Siguiente manda ?page=2 y muestra los libros de esa página', async () => {
    const user = userEvent.setup()
    const titulos = Array.from({ length: 15 }, (_, i) => `Libro ${String(i + 1).padStart(2, '0')}`)
    const api = crearApiFake(titulos.map((titulo) => ({ titulo })))
    server.use(...api.handlers)
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')
    expect(await screen.findByRole('heading', { name: 'Libro 12' })).toBeInTheDocument()
    expect(screen.getByText('15 libros · página 1 de 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByRole('heading', { name: 'Libro 13' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Libro 15' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Libro 01' })).not.toBeInTheDocument()
    expect(screen.getByText('15 libros · página 2 de 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(api.pedidos('/api/libros').at(-1)?.searchParams.get('page')).toBe('2')
    expect(router.state.location.search).toMatchObject({ page: 2 })
  })

  it('muestra el vacío', async () => {
    const user = userEvent.setup()
    await renderEn('/catalogo?page=1&pageSize=12')
    await screen.findByRole('heading', { name: 'El Principito' })
    await user.type(screen.getByLabelText('Buscar'), 'vacio')
    expect(await screen.findByRole('heading', { name: 'Sin resultados' })).toBeInTheDocument()
  })

  it('muestra el error', async () => {
    server.use(http.get('http://api.test/api/libros', () => new HttpResponse(null, { status: 500 })))
    await renderEn('/catalogo?page=1&pageSize=12')
    expect(await screen.findByRole('heading', { name: 'No se pudo cargar el catálogo' })).toBeInTheDocument()
  })
})
