import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mensajeDeError } from '@/features/biblioteca/errores'
import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

// staleTime de main.tsx: con él, un dato solo se vuelve a pedir si una mutación lo invalida.
const STALE_TIME_APP = 30_000

function problema(code: string) {
  return HttpResponse.json(
    { status: 409, title: code, code },
    { status: 409, headers: { 'content-type': 'application/problem+json' } },
  )
}

function badgesDeEjemplares() {
  // hidden: con el diálogo de reserva abierto, Radix marca el resto de la página con aria-hidden.
  const titulo = screen.getByRole('heading', { name: 'Ejemplares', hidden: true })
  return within(titulo.nextElementSibling as HTMLElement)
}

describe('ficha', () => {
  it('Reservar sin sesión manda a login', async () => {
    const user = userEvent.setup()
    const { router } = await renderEn('/libros/1')
    await user.click(await screen.findByRole('link', { name: 'Reservar' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toMatchObject({ redirect: '/libros/1' })
  })

  it('reservar muestra "Tu ejemplar: <código>" y la disponibilidad baja de 3 a 2 en ficha y catálogo', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    const api = crearApiFake([{ titulo: 'El Principito', copias: 3 }])
    server.use(...api.handlers)
    // El catálogo queda en caché con 3 disponibles antes de reservar.
    const { router } = await renderEn('/catalogo?page=1&pageSize=12', { staleTime: STALE_TIME_APP })
    expect(await screen.findByText('Disponible (3)')).toBeInTheDocument()

    await act(() => router.navigate({ to: '/libros/$idLibro', params: { idLibro: '1' } }))
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    expect(badgesDeEjemplares().getAllByText('Disponible')).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Tu ejemplar: BIB-001')).toBeInTheDocument()
    await waitFor(() => expect(badgesDeEjemplares().getAllByText('Disponible')).toHaveLength(2))
    expect(badgesDeEjemplares().getByText('Reservado')).toBeInTheDocument()
    expect(api.pedidos('/api/libros/1')).toHaveLength(2)

    // Volver al catálogo: la lista se invalidó, así que se vuelve a pedir pese al staleTime.
    await act(() => router.navigate({ to: '/catalogo', search: { page: 1, pageSize: 12 } }))
    expect(await screen.findByText('Disponible (2)')).toBeInTheDocument()
    expect(api.pedidos('/api/libros')).toHaveLength(2)
  })

  it('muestra reserva-duplicada', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    server.use(
      http.post('http://api.test/api/reservas', () => problema('reserva-duplicada')),
      http.get('http://api.test/api/lectores/:id/reservas', () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 50, totalCount: 0, totalPages: 0 }),
      ),
    )
    await renderEn('/libros/1')
    await user.click(await screen.findByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText(mensajeDeError('reserva-duplicada', ''))).toBeInTheDocument()
  })

  it('sin stock (409) muestra el mensaje y no cambia nada', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    const api = crearApiFake([{ titulo: 'El Principito', copias: 1 }])
    // La ficha dice 1 disponible, pero otra persona se la llevó: la API responde 409 sin-stock.
    // En un mismo server.use gana el primer handler que coincide: el override va antes que la API fake.
    server.use(http.post('http://api.test/api/reservas', () => problema('sin-stock')), ...api.handlers)
    await renderEn('/libros/1', { staleTime: STALE_TIME_APP })
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    expect(badgesDeEjemplares().getAllByText('Disponible')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('No hay ejemplares disponibles para este libro.')).toBeInTheDocument()
    expect(badgesDeEjemplares().getAllByText('Disponible')).toHaveLength(1)
    expect(badgesDeEjemplares().queryByText('Reservado')).not.toBeInTheDocument()
    expect(screen.queryByText(/Tu ejemplar:/)).not.toBeInTheDocument()
    expect(api.pedidos('/api/libros/1')).toHaveLength(1)
  })
})
