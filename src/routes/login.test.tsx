import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { mensajeDeError } from '@/features/biblioteca/errores'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

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

  describe('mientras entra', () => {
    const loginDemorado = () => {
      let responder: () => void = () => {}
      let pedidos = 0
      server.use(
        http.post('*/api/auth/login', async () => {
          pedidos++
          await new Promise<void>((resolve) => {
            responder = resolve
          })
          return undefined
        }),
      )
      return { responder: () => responder(), pedidos: () => pedidos }
    }

    it('muestra «Entrando…», bloquea el formulario y vuelve al responder', async () => {
      const login = loginDemorado()
      const user = userEvent.setup()
      await renderEn('/login')
      await user.type(screen.getByLabelText('Correo'), 'ana@demo.local')
      await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))

      const boton = await screen.findByRole('button', { name: 'Entrando…' })
      expect(boton).toBeDisabled()
      expect(boton).toHaveAttribute('aria-busy', 'true')
      expect(screen.getByLabelText('Correo')).toBeDisabled()
      expect(screen.getByLabelText('Contraseña')).toBeDisabled()

      await user.keyboard('{Enter}')
      boton.closest('form')?.requestSubmit()
      expect(login.pedidos()).toBe(1)

      await act(async () => login.responder())
      expect(await screen.findByRole('alert')).toHaveTextContent(
        mensajeDeError('credenciales-invalidas', ''),
      )
      const normal = screen.getByRole('button', { name: 'Entrar' })
      expect(normal).toBeEnabled()
      expect(normal).not.toHaveAttribute('aria-busy')
      expect(screen.getByLabelText('Correo')).toBeEnabled()
    })

    it('si tarda más de 4 s avisa de que el servidor está despertando', async () => {
      const login = loginDemorado()
      const user = userEvent.setup()
      await renderEn('/login')
      await user.type(screen.getByLabelText('Correo'), 'ana@demo.local')
      await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
      await user.click(screen.getByRole('button', { name: 'Entrar' }))
      await screen.findByRole('button', { name: 'Entrando…' })
      expect(screen.queryByText(/Despertando el servidor/)).toBeNull()

      expect(
        await screen.findByText(
          'Despertando el servidor, puede tardar unos segundos…',
          undefined,
          { timeout: 5000 },
        ),
      ).toBeInTheDocument()

      await act(async () => login.responder())
      await waitFor(() =>
        expect(screen.queryByText(/Despertando el servidor/)).toBeNull(),
      )
    })
  })
})
