import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { mensajeDeError } from '@/features/biblioteca/errores'
import { renderEn } from '@/test/render'

describe('login', () => {
  it('muestra credenciales-invalidas en el formulario', async () => {
    const user = userEvent.setup()
    await renderEn('/login')
    await user.type(screen.getByLabelText('Correo'), 'ana@demo.local')
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      mensajeDeError('credenciales-invalidas', ''),
    )
  })

  it('el botón del ojo muestra y oculta la contraseña', async () => {
    const user = userEvent.setup()
    await renderEn('/login')
    const password = screen.getByLabelText('Contraseña')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(password).toHaveAttribute('type', 'password')
  })
})
