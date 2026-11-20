import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderEn } from '@/test/render'
import { server } from '@/test/server'

describe('catálogo', () => {
  it('renderiza los libros', async () => {
    await renderEn('/catalogo?page=1&pageSize=12')
    expect(await screen.findByRole('heading', { name: 'El Principito' })).toBeInTheDocument()
  })

  it('la búsqueda debounced actualiza la URL', async () => {
    const user = userEvent.setup()
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')
    await screen.findByRole('heading', { name: 'El Principito' })
    await user.type(screen.getByLabelText('Buscar'), 'hobbit')
    await waitFor(
      () => {
        expect(router.state.location.href).toContain('buscar=hobbit')
      },
      { timeout: 4000 },
    )
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
