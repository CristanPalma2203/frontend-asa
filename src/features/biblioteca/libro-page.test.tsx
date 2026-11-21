import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mensajeDeError } from '@/features/biblioteca/errores'
import { crearApiFake } from '@/test/api-fake'
import { detalleEjemplo } from '@/test/fixtures'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const STALE_TIME_APP = 30_000

function problema(code: string) {
  return HttpResponse.json(
    { status: 409, title: code, code },
    { status: 409, headers: { 'content-type': 'application/problem+json' } },
  )
}

describe('ficha', () => {
  it('el total de ejemplares solo cuenta los activos', async () => {
    const api = crearApiFake([{ titulo: 'El Principito', copias: 3 }])
    const inactivo = api.libros[0]?.ejemplares[2]
    if (inactivo) inactivo.estado = 'Inactivo'
    server.use(...api.handlers)
    await renderEn('/libros/1')

    await screen.findByRole('heading', { level: 1, name: 'El Principito' })
    expect(
      await screen.findByText('2 de 2 ejemplares activos'),
    ).toBeInTheDocument()
    expect(screen.getByText('2 activos')).toBeInTheDocument()
  })

  it('Reservar sin sesión manda a login', async () => {
    const user = userEvent.setup()
    const { router } = await renderEn('/libros/1')
    await user.click(await screen.findByRole('link', { name: 'Reservar' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toMatchObject({
      redirect: '/libros/1',
    })
  })

  it('reservar muestra "Tu ejemplar: <código>" y la disponibilidad baja de 3 a 2 en ficha y catálogo', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    const api = crearApiFake([{ titulo: 'El Principito', copias: 3 }])
    server.use(...api.handlers)
    const { router } = await renderEn('/catalogo?page=1&pageSize=12', {
      staleTime: STALE_TIME_APP,
    })
    expect(await screen.findByText('3 disponibles')).toBeInTheDocument()

    await act(() =>
      router.navigate({ to: '/libros/$idLibro', params: { idLibro: '1' } }),
    )
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    expect(screen.getByTestId('estado-disponibilidad')).toHaveTextContent(
      '3 disponibles',
    )
    expect(screen.getByText('3 de 3 ejemplares activos')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByTestId('tu-ejemplar')).toHaveTextContent(
      'Tu ejemplar: BIB-001',
    )
    expect(screen.getByTestId('estado-disponibilidad')).toHaveTextContent(
      'Reservado por ti',
    )
    await waitFor(() =>
      expect(
        screen.getByText('Tienes 1 de 3 · quedan 2 disponibles'),
      ).toBeInTheDocument(),
    )
    expect(api.pedidos('/api/libros/1')).toHaveLength(2)

    await act(() =>
      router.navigate({ to: '/catalogo', search: { page: 1, pageSize: 12 } }),
    )
    expect(await screen.findByText('2 disponibles')).toBeInTheDocument()
    const listados = api
      .pedidos('/api/libros')
      .filter((url) => url.searchParams.get('pageSize') === '12')
    expect(listados).toHaveLength(2)
  })

  it('muestra reserva-duplicada', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    server.use(
      http.post('http://api.test/api/reservas', () =>
        problema('reserva-duplicada'),
      ),
      http.get('http://api.test/api/lectores/:id/reservas', () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 50,
          totalCount: 0,
          totalPages: 0,
        }),
      ),
    )
    await renderEn('/libros/1')
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    await user.click(screen.getByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))
    expect(
      await screen.findByText(mensajeDeError('reserva-duplicada', '')),
    ).toBeInTheDocument()
  })

  it('sin stock (409) cierra el diálogo, deja visible el mensaje y no cambia nada', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    const api = crearApiFake([{ titulo: 'El Principito', copias: 1 }])
    server.use(
      http.post('http://api.test/api/reservas', () => problema('sin-stock')),
      ...api.handlers,
    )
    await renderEn('/libros/1', { staleTime: STALE_TIME_APP })
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    expect(screen.getByTestId('estado-disponibilidad')).toHaveTextContent(
      '1 disponible',
    )

    await user.click(screen.getByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))

    const mensaje = await screen.findByText(
      'No hay ejemplares disponibles para este libro.',
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(mensaje).toBeVisible()
    expect(mensaje.closest('[aria-hidden="true"]')).toBeNull()
    expect(screen.getByTestId('estado-disponibilidad')).toHaveTextContent(
      '1 disponible',
    )
    expect(screen.getByText('1 de 1 ejemplares activos')).toBeInTheDocument()
    expect(screen.queryByTestId('tu-ejemplar')).not.toBeInTheDocument()
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
    server.use(
      ...crearApiFake([{ titulo: 'El Principito', copias: 3 }]).handlers,
    )
    await renderEn('/libros/1')
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })

    expect(screen.queryByText('BIB-001')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Ejemplares' }),
    ).not.toBeInTheDocument()
  })

  it('cargando: la tarjeta ya se ve con «Reservar» deshabilitado y huecos en los datos', async () => {
    server.use(
      http.get('http://api.test/api/libros/:id', () => new Promise(() => {})),
    )
    await renderEn('/libros/1')

    expect(
      await screen.findByRole('button', { name: 'Reservar' }),
    ).toBeDisabled()
    expect(screen.getByLabelText('Cargando libro')).toHaveAttribute(
      'aria-busy',
      'true',
    )
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('ya reservado: «Tu ejemplar» con su código y enlace a Mis reservas, sin «Reservar»', async () => {
    entrarComo('Lector')
    await renderEn('/libros/1')
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })

    expect(await screen.findByTestId('tu-ejemplar')).toHaveTextContent(
      'Tu ejemplar: BIB-001',
    )
    expect(
      screen.getByRole('link', { name: 'Ver en Mis reservas' }),
    ).toHaveAttribute('href', '/mis-reservas')
    expect(screen.getByTestId('estado-disponibilidad')).toHaveTextContent(
      'Reservado por ti',
    )
    expect(screen.queryByRole('button', { name: 'Reservar' })).toBeNull()
  })

  it('oculta sinopsis, páginas, año y editorial si no vienen, y los muestra si llegan', async () => {
    const { unmount } = await renderEn('/libros/1')
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    expect(screen.queryByRole('heading', { name: 'Sinopsis' })).toBeNull()
    expect(screen.queryByText('Editorial')).toBeNull()
    unmount()

    server.use(
      http.get('http://api.test/api/libros/:id', () =>
        HttpResponse.json({
          ...detalleEjemplo,
          sinopsis:
            'Un aviador cae en el desierto y conoce a un pequeño príncipe.',
          paginas: 96,
          anioPublicacion: 1943,
          editorial: 'Salamandra',
        }),
      ),
    )
    await renderEn('/libros/1')
    expect(
      await screen.findByRole('heading', { name: 'Sinopsis' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/conoce a un pequeño príncipe/)).toBeInTheDocument()
    expect(screen.getByText('96')).toBeInTheDocument()
    expect(screen.getByText('1943')).toBeInTheDocument()
    expect(screen.getByText('Salamandra')).toBeInTheDocument()
  })

  it('«Más de esta categoría» muestra hasta 6 de la misma categoría, sin el actual, con enlace a su ficha', async () => {
    const user = userEvent.setup()
    const api = crearApiFake([
      { titulo: 'Cien años de soledad', categoria: 'Novela' },
      ...Array.from({ length: 7 }, (_, i) => ({
        titulo: `Novela ${i + 1}`,
        categoria: 'Novela',
      })),
      { titulo: 'Cosmos', categoria: 'Ciencia' },
    ])
    server.use(...api.handlers)
    const { router } = await renderEn('/libros/1')
    await screen.findByRole('heading', {
      name: 'Cien años de soledad',
      level: 1,
    })

    const lista = await screen.findByRole('list', {
      name: 'Más libros de Novela',
    })
    const enlaces = await within(lista).findAllByRole('link')
    expect(enlaces).toHaveLength(6)
    expect(within(lista).queryByText('Cien años de soledad')).toBeNull()
    expect(within(lista).queryByText('Cosmos')).toBeNull()
    expect(
      api
        .pedidos('/api/libros')
        .some((url) => url.searchParams.get('categoria') === 'Novela'),
    ).toBe(true)

    await user.click(
      within(lista).getByRole('link', { name: 'Novela 1, 3 disponibles' }),
    )
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/libros/2'),
    )
  })

  it('sin otros libros de la categoría, la sección no aparece', async () => {
    server.use(...crearApiFake([{ titulo: 'El Principito' }]).handlers)
    await renderEn('/libros/1')
    await screen.findByRole('heading', { name: 'El Principito', level: 1 })
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Más de esta categoría' }),
      ).toBeNull(),
    )
  })
})
