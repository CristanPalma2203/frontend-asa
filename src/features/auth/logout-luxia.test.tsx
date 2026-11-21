import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store'
import { STORAGE_KEY } from '@/features/luxia/services/historial'
import { useLuxiaStore } from '@/features/luxia/store'
import { api } from '@/lib/api/client'
import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const HISTORIAL = JSON.stringify([{ role: 'user', text: '¿Hay Dune?' }])

function conLuxiaUsada() {
  localStorage.setItem(STORAGE_KEY, HISTORIAL)
  useLuxiaStore.getState().abrir(document.body)
}

function expectLuxiaOlvidada() {
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  expect(useLuxiaStore.getState()).toMatchObject({
    abierto: false,
    opener: null,
  })
}

describe('cerrar sesión borra LuxIA', () => {
  it('el botón «Cerrar sesión» del sidebar borra el historial y reinicia LuxIA', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    server.use(...crearApiFake([{ titulo: 'Dune', copias: 1 }]).handlers)
    await renderEn('/catalogo?page=1&pageSize=12')
    conLuxiaUsada()

    await user.click(
      await screen.findByRole('button', { name: 'Cerrar sesión' }),
    )

    expect(useAuthStore.getState().token).toBeNull()
    expectLuxiaOlvidada()
  })

  it('un 401 de la API cierra la sesión y borra LuxIA', async () => {
    entrarComo('Lector')
    conLuxiaUsada()
    server.use(
      http.get('*/api/reservas', () => new HttpResponse(null, { status: 401 })),
    )

    await expect(api('/api/reservas')).rejects.toMatchObject({ status: 401 })

    expect(useAuthStore.getState().token).toBeNull()
    expectLuxiaOlvidada()
  })

  it('con el token vencido la siguiente petición cierra la sesión y borra LuxIA', async () => {
    entrarComo('Lector')
    useAuthStore.setState({ expiresAt: Date.now() - 1000 })
    conLuxiaUsada()
    server.use(http.get('*/api/libros', () => HttpResponse.json([])))

    await api('/api/libros')

    expect(useAuthStore.getState().token).toBeNull()
    expectLuxiaOlvidada()
  })

  it('auth no depende de LuxIA: logout() solo cierra la sesión', () => {
    entrarComo('Lector')
    conLuxiaUsada()

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().token).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(HISTORIAL)
  })
})
