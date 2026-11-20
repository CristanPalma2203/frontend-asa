import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store'
import { bloquearCancelacion, soltarCancelacion } from '@/test/handlers'
import { renderEn } from '@/test/render'

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
    expect(await screen.findByText(/Solicitud 20 nov 2026.*8:00/)).toBeInTheDocument()
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
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar reserva' }))
    await waitFor(() => expect(screen.queryByText('Activa')).not.toBeInTheDocument())
    soltarCancelacion(true)
    expect(await screen.findByText('Activa')).toBeInTheDocument()
  })
})
