import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderEn } from '@/test/render'
import { entrarComo } from '@/test/sesion'

describe('pill Panel / Biblioteca', () => {
  it('el lector no la ve', async () => {
    entrarComo('Lector')
    await renderEn('/catalogo?page=1&pageSize=12')
    await screen.findByRole('heading', { level: 1 })
    expect(
      screen.queryByRole('navigation', { name: 'Cambiar de vista' }),
    ).toBeNull()
  })

  it('el admin la ve y cambia de vista: Panel ↔ Biblioteca, con su sidebar', async () => {
    const user = userEvent.setup()
    entrarComo('Admin')
    const { router } = await renderEn('/admin')

    const pill = await screen.findByRole('navigation', {
      name: 'Cambiar de vista',
    })
    expect(within(pill).getByRole('link', { name: 'Panel' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getByText('Gestión')).toBeInTheDocument()

    await user.click(within(pill).getByRole('link', { name: 'Biblioteca' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))

    const pillBiblioteca = await screen.findByRole('navigation', {
      name: 'Cambiar de vista',
    })
    expect(
      within(pillBiblioteca).getByRole('link', { name: 'Biblioteca' }),
    ).toHaveAttribute('aria-current', 'page')
    const navBiblioteca = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(navBiblioteca).getByText('Biblioteca')).toBeInTheDocument()
    expect(
      within(navBiblioteca).getByText(
        'Estás viendo la biblioteca como un lector, sin reservas.',
      ),
    ).toBeInTheDocument()
    expect(
      within(navBiblioteca).queryByRole('link', { name: /Mis reservas/ }),
    ).toBeNull()

    await user.click(
      within(pillBiblioteca).getByRole('link', { name: 'Panel' }),
    )
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
  })

  it('recargar mantiene la vista (vive en la URL)', async () => {
    entrarComo('Admin')
    await renderEn('/catalogo?page=1&pageSize=12')
    const pill = await screen.findByRole('navigation', {
      name: 'Cambiar de vista',
    })
    expect(
      within(pill).getByRole('link', { name: 'Biblioteca' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('en la ficha, el admin ve «Gestionar ejemplares» en lugar de «Reservar»', async () => {
    entrarComo('Admin')
    await renderEn('/libros/1')
    await screen.findByRole('heading', { level: 1, name: 'El Principito' })

    expect(
      screen.getByRole('link', { name: /Gestionar ejemplares/ }),
    ).toHaveAttribute('href', expect.stringContaining('/admin/libros/1'))
    expect(screen.queryByRole('button', { name: 'Reservar' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Reservar' })).toBeNull()
  })

  it('el lector sigue sin poder entrar a /admin', async () => {
    entrarComo('Lector')
    const { router } = await renderEn('/admin')
    await waitFor(() =>
      expect(router.state.location.pathname).not.toBe('/admin'),
    )
  })
})
