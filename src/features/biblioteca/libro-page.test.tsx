import { act, screen, waitFor } from '@testing-library/react'
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
    expect(await screen.findByText('3 disponibles')).toBeInTheDocument()

    await act(() => router.navigate({ to: '/libros/$idLibro', params: { idLibro: '1' } }))
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    expect(screen.getByText('3 disponibles')).toBeInTheDocument()
    expect(screen.getByText('3 de 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Tu ejemplar: BIB-001')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('2 de 3')).toBeInTheDocument())
    expect(api.pedidos('/api/libros/1')).toHaveLength(2)

    // Volver al catálogo: la lista se invalidó, así que se vuelve a pedir pese al staleTime.
    await act(() => router.navigate({ to: '/catalogo', search: { page: 1, pageSize: 12 } }))
    expect(await screen.findByText('2 disponibles')).toBeInTheDocument()
    const listados = api.pedidos('/api/libros').filter((url) => url.searchParams.get('pageSize') === '12')
    expect(listados).toHaveLength(2)
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
    // Mientras carga, «Reservar» ya se ve pero deshabilitado: se espera al libro.
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    await user.click(screen.getByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText(mensajeDeError('reserva-duplicada', ''))).toBeInTheDocument()
  })

  it('sin stock (409) cierra el diálogo, deja visible el mensaje y no cambia nada', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    const api = crearApiFake([{ titulo: 'El Principito', copias: 1 }])
    // La ficha dice 1 disponible, pero otra persona se la llevó: la API responde 409 sin-stock.
    // En un mismo server.use gana el primer handler que coincide: el override va antes que la API fake.
    server.use(http.post('http://api.test/api/reservas', () => problema('sin-stock')), ...api.handlers)
    await renderEn('/libros/1', { staleTime: STALE_TIME_APP })
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    expect(screen.getByText('1 disponible')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))

    const mensaje = await screen.findByText('No hay ejemplares disponibles para este libro.')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    // Con el diálogo cerrado la página ya no queda aria-hidden: el mensaje es visible y accesible.
    expect(mensaje).toBeVisible()
    expect(mensaje.closest('[aria-hidden="true"]')).toBeNull()
    expect(screen.getByText('1 disponible')).toBeInTheDocument()
    expect(screen.getByText('1 de 1')).toBeInTheDocument()
    expect(screen.queryByText(/Tu ejemplar:/)).not.toBeInTheDocument()
    expect(api.pedidos('/api/libros/1')).toHaveLength(1)
  })

  it('sin stock deshabilita Reservar y lo dice', async () => {
    entrarComo('Lector')
    const api = crearApiFake([{ titulo: 'El Principito', copias: 0 }])
    server.use(...api.handlers)
    await renderEn('/libros/1')
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })

    const boton = screen.getByRole('button', { name: 'Reservar' })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAccessibleDescription('Sin ejemplares disponibles')
  })

  it('el lector no ve la lista de ejemplares ni sus códigos', async () => {
    entrarComo('Lector')
    await renderEn('/libros/1')
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })

    expect(screen.queryByText('BIB-001')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ejemplares' })).not.toBeInTheDocument()
  })
})
