import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderEn } from '@/test/render'
import { entrarComo } from '@/test/sesion'

describe('menú móvil', () => {
  it('abre con un solo toque, también después de navegar desde él', async () => {
    entrarComo('Lector')
    const user = userEvent.setup()
    const { router } = await renderEn('/catalogo?page=1&pageSize=12')
    const hamburguesa = await screen.findByRole('button', {
      name: 'Abrir menú',
    })

    await user.click(hamburguesa)
    const menu = await screen.findByRole('dialog', { name: 'Menú' })
    await user.click(within(menu).getByRole('link', { name: /Mis reservas/ }))
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/mis-reservas'),
    )
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Menú' })).toBeNull(),
    )
    expect(document.body.style.pointerEvents).not.toBe('none')

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(
      await screen.findByRole('dialog', { name: 'Menú' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Menú' })).toBeNull(),
    )
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(
      await screen.findByRole('dialog', { name: 'Menú' }),
    ).toBeInTheDocument()
  })
})
