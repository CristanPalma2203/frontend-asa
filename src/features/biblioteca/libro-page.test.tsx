import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

function problema(code: string) {
  return HttpResponse.json(
    { status: 409, title: code, code },
    { status: 409, headers: { 'content-type': 'application/problem+json' } },
  )
}

function entrarLector() {
  useAuthStore.getState().login({
    token: 'token-test',
    expiresAt: Date.now() + 60_000,
    rol: 'Lector',
    nombre: 'Ana',
    lectorId: 2,
    correo: 'ana@demo.local',
  })
}

describe('ficha', () => {
  it('Reservar sin sesión manda a login', async () => {
    const user = userEvent.setup()
    const { router } = await renderEn('/libros/1')
    await user.click(await screen.findByRole('link', { name: 'Reservar' }))
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toMatchObject({ redirect: '/libros/1' })
  })

  it('muestra reserva-duplicada', async () => {
    const user = userEvent.setup()
    entrarLector()
    server.use(
      http.post('http://api.test/api/reservas', () => problema('reserva-duplicada')),
      http.get('http://api.test/api/lectores/:id/reservas', () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 50, totalCount: 0, totalPages: 0 }),
      ),
    )
    await renderEn('/libros/1')
    await user.click(await screen.findByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText(mensajeDeError('reserva-duplicada', ''))).toBeInTheDocument()
  })

  it('muestra sin-stock', async () => {
    const user = userEvent.setup()
    entrarLector()
    server.use(
      http.post('http://api.test/api/reservas', () => problema('sin-stock')),
      http.get('http://api.test/api/lectores/:id/reservas', () =>
        HttpResponse.json({ items: [], page: 1, pageSize: 50, totalCount: 0, totalPages: 0 }),
      ),
    )
    await renderEn('/libros/1')
    await user.click(await screen.findByRole('button', { name: 'Reservar' }))
    await user.click(await screen.findByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByText(mensajeDeError('sin-stock', ''))).toBeInTheDocument()
  })
})
