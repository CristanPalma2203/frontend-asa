import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store'
import { bloquearCancelacion, soltarCancelacion } from '@/test/handlers'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

describe('mis reservas', () => {
  it('tarjeta activa muestra el código del ejemplar y solo 3 stats', async () => {
    entrarComo('Lector')
    await renderEn('/mis-reservas')

    const activa = await screen.findByRole('region', {
      name: 'Reservas activas',
    })
    expect(within(activa).getByText('BIB-001')).toBeInTheDocument()
    expect(
      within(activa).getByRole('heading', { name: 'El Principito' }),
    ).toBeInTheDocument()
    expect(within(activa).getByText('Activa')).toBeInTheDocument()
    expect(within(activa).getByText(/Solicitud/)).toBeInTheDocument()

    const resumen = screen.getByRole('group', {
      name: 'Resumen de tus reservas',
    })
    expect(within(resumen).getByText('Activas')).toBeInTheDocument()
    expect(within(resumen).getByText('Total')).toBeInTheDocument()
    expect(within(resumen).getByText('Canceladas')).toBeInTheDocument()
    expect(
      within(resumen).queryByText(/Libros leídos/i),
    ).not.toBeInTheDocument()
    expect(
      within(resumen).queryByText(/En el historial/i),
    ).not.toBeInTheDocument()
  })

  it('muestra fechaSolicitud (UTC con Z) en hora de El Salvador', async () => {
    useAuthStore.getState().login({
      token: 'token-test',
      expiresAt: Date.now() + 60_000,
      rol: 'Lector',
      nombre: 'Ana',
      lectorId: 2,
      correo: 'ana@demo.local',
    })
    await renderEn('/mis-reservas')
    const activa = await screen.findByRole('region', {
      name: 'Reservas activas',
    })
    expect(
      within(activa).getByText(/Solicitud 20 nov 2026.*8:00/),
    ).toBeInTheDocument()
  })

  it('cancela con diálogo, update optimista y rollback si falla', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    bloquearCancelacion()
    await renderEn('/mis-reservas')
    const activa = await screen.findByRole('region', {
      name: 'Reservas activas',
    })
    expect(within(activa).getByText('Activa')).toBeInTheDocument()
    await user.click(
      within(activa).getByRole('button', { name: 'Cancelar reserva' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    await user.click(
      within(dialog).getByRole('button', { name: 'Cancelar reserva' }),
    )
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Reservas activas' }),
      ).not.toBeInTheDocument(),
    )
    soltarCancelacion(true)
    expect(
      await screen.findByText('Solo se puede cancelar una reserva activa.'),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('region', {
        name: 'Reservas activas',
        hidden: true,
      }),
    ).toBeInTheDocument()
  })

  it('filtros del historial viven en la URL', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    const reserva = (
      idReserva: number,
      titulo: string,
      estado: 'Activa' | 'Cancelada',
    ) => ({
      idReserva,
      idLibro: idReserva,
      titulo,
      codigoInventario: `BIB-00${idReserva}`,
      estado,
      fechaSolicitud: '2026-11-20T14:00:00Z',
      fechaCancelacion: estado === 'Cancelada' ? '2026-11-21T14:00:00Z' : null,
    })
    server.use(
      http.get('http://api.test/api/lectores/:id/reservas', ({ request }) => {
        const estado = new URL(request.url).searchParams.get('estado')
        const todas = [
          reserva(1, 'Dune', 'Activa'),
          reserva(2, 'Emma', 'Cancelada'),
        ]
        const items =
          !estado || estado === 'Todas'
            ? todas
            : todas.filter((r) => r.estado === estado)
        return HttpResponse.json({
          items,
          page: 1,
          pageSize: 20,
          totalCount: items.length,
          totalPages: 1,
        })
      }),
    )
    const { router } = await renderEn('/mis-reservas')

    async function historial() {
      return screen.findByRole('region', { name: 'Historial' })
    }

    expect(
      within(await historial()).getByRole('heading', { name: 'Dune' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Canceladas' }))
    expect(
      await within(await historial()).findByRole('heading', { name: 'Emma' }),
    ).toBeInTheDocument()
    expect(
      within(await historial()).queryByRole('heading', { name: 'Dune' }),
    ).not.toBeInTheDocument()
    expect(router.state.location.search).toEqual({ estado: 'Cancelada' })

    await user.click(screen.getByRole('tab', { name: 'Activas' }))
    expect(
      await within(await historial()).findByRole('heading', { name: 'Dune' }),
    ).toBeInTheDocument()
    expect(
      within(await historial()).queryByRole('heading', { name: 'Emma' }),
    ).not.toBeInTheDocument()
    expect(router.state.location.search).toEqual({ estado: 'Activa' })

    await user.click(screen.getByRole('tab', { name: 'Todas' }))
    expect(
      await within(await historial()).findByRole('heading', { name: 'Emma' }),
    ).toBeInTheDocument()
    expect(
      within(await historial()).getByRole('heading', { name: 'Dune' }),
    ).toBeInTheDocument()
    expect(router.state.location.search).toEqual({})
  })

  it('«Ver libro» de la tarjeta activa va a la ficha', async () => {
    entrarComo('Lector')
    await renderEn('/mis-reservas')
    const activa = await screen.findByRole('region', {
      name: 'Reservas activas',
    })
    const portada = await waitFor(() => {
      const img = activa.querySelector('img')
      expect(img).not.toBeNull()
      return img as HTMLImageElement
    })
    expect(portada.getAttribute('src')).toContain(
      'covers.openlibrary.org/b/isbn/',
    )
    expect(
      await within(activa).findByText('Antoine de Saint-Exupéry'),
    ).toBeInTheDocument()
    expect(
      within(activa).getByRole('link', { name: 'Ver libro: El Principito' }),
    ).toHaveAttribute('href', '/libros/1')
  })

  it('cancelada en historial: fila compacta sin ticket oscuro', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    server.use(
      http.get('http://api.test/api/lectores/:id/reservas', ({ request }) => {
        const estado = new URL(request.url).searchParams.get('estado')
        const cancelada = {
          idReserva: 2,
          idLibro: 2,
          titulo: 'Emma',
          codigoInventario: 'BIB-002',
          estado: 'Cancelada' as const,
          fechaSolicitud: '2026-11-20T14:00:00Z',
          fechaCancelacion: '2026-11-21T14:00:00Z',
        }
        const activa = {
          idReserva: 1,
          idLibro: 1,
          titulo: 'El Principito',
          codigoInventario: 'BIB-001',
          estado: 'Activa' as const,
          fechaSolicitud: '2026-11-20T14:00:00Z',
          fechaCancelacion: null,
        }
        const todas = [activa, cancelada]
        const items =
          !estado || estado === 'Todas'
            ? todas
            : todas.filter((r) => r.estado === estado)
        return HttpResponse.json({
          items,
          page: 1,
          pageSize: 20,
          totalCount: items.length,
          totalPages: 1,
        })
      }),
    )
    await renderEn('/mis-reservas')
    expect(
      await screen.findByRole('region', { name: 'Reservas activas' }),
    ).toBeInTheDocument()
    await user.click(await screen.findByRole('tab', { name: 'Canceladas' }))
    const historial = await screen.findByRole('region', { name: 'Historial' })
    const fila = (
      await within(historial).findByRole('heading', { name: 'Emma' })
    ).closest('article') as HTMLElement

    expect(within(fila).getByText('BIB-002')).toBeInTheDocument()
    expect(within(fila).getByText('Cancelada')).toBeInTheDocument()
    expect(within(fila).getByText(/Solicitud/)).toBeInTheDocument()
    expect(within(fila).getByText(/Cancelación/)).toBeInTheDocument()
    expect(within(fila).queryByText('Tu ejemplar')).not.toBeInTheDocument()
    expect(
      within(fila).getByRole('link', { name: 'Ver libro: Emma' }),
    ).toHaveAttribute('href', '/libros/2')
    const activa = screen.getByRole('region', { name: 'Reservas activas' })
    expect(within(activa).getByText('Tu ejemplar')).toBeInTheDocument()
  })

  it('sigue explorando muestra portadas con badge y va a la ficha', async () => {
    entrarComo('Lector')
    await renderEn('/mis-reservas')
    const lista = await screen.findByRole('list', {
      name: 'Libros recomendados',
    })
    const enlace = within(lista).getAllByRole('link')[0]
    expect(enlace).toBeDefined()
    expect(enlace?.getAttribute('href')).toMatch(/^\/libros\//)
    expect(enlace?.textContent).toMatch(/disponible|Agotado|stock/i)
  })

  it('sin reservas: estado vacío y «Explorar catálogo»', async () => {
    entrarComo('Lector')
    server.use(
      http.get('http://api.test/api/lectores/:id/reservas', () =>
        HttpResponse.json({
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
        }),
      ),
    )
    await renderEn('/mis-reservas')

    expect(
      await screen.findByRole('heading', {
        name: /Aún no tienes/,
      }),
    ).toBeInTheDocument()
    const enlace = screen.getAllByRole('link', {
      name: 'Explorar catálogo',
    })[0]
    expect(enlace).toBeDefined()
    expect(enlace?.getAttribute('href')).toContain('/catalogo')
    expect(
      screen.queryByRole('region', { name: 'Reservas activas' }),
    ).not.toBeInTheDocument()
  })
})
