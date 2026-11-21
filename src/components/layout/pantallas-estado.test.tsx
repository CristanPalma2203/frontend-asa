import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderEn } from '@/test/render'

describe('404', () => {
  it('una ruta inexistente muestra la página no encontrada con botón para volver', async () => {
    await renderEn('/no-existe')
    expect(
      await screen.findByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver al inicio' }),
    ).toHaveAttribute('href', '/')
  })
})
