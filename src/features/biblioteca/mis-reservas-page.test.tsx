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
    // 14:00Z = 8:00 en America/El_Salvador (UTC-6)
    expect(
      await screen.findByText(/Solicitud 20 nov 2026.*8:00/),
    ).toBeInTheDocument()
  })

  it('cancela con update optimista y hace rollback si falla', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().login({
      token: 'token-test',
      expiresAt: Date.now() + 60_000,
      rol: 'Lector',
      nombre: 'Ana',
      lectorId: 2,
      correo: 'ana@demo.local',
    })
    bloquearCancelacion()
    await renderEn('/mis-reservas')
    expect(await screen.findByText('Activa')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar reserva' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Cancelar reserva' }),
    )
    await waitFor(() =>
      expect(screen.queryByText('Activa')).not.toBeInTheDocument(),
    )
    soltarCancelacion(true)
    expect(await screen.findByText('Activa')).toBeInTheDocument()
    // El backend responde 409 `reserva-no-activa` (antes 422): el mensaje sale del code.
    expect(
      await screen.findByText('Solo se puede cancelar una reserva activa.'),
    ).toBeInTheDocument()
  })

  it('muestra el contador de activas en la cabecera y en el sidebar', async () => {
    entrarComo('Lector')
    await renderEn('/mis-reservas')

    expect(await screen.findByText('1 reserva activa')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    const contador = within(nav).getByText(/reservas activas/).parentElement
    expect(contador).toHaveTextContent('1 reservas activas')
  })

  it('Historial muestra las canceladas y no las activas', async () => {
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
        const items = estado ? todas.filter((r) => r.estado === estado) : todas
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
      await screen.findByRole('link', { name: 'Dune' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Historial' }))

    expect(
      await screen.findByRole('link', { name: 'Emma' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Dune' })).not.toBeInTheDocument()
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })
})
