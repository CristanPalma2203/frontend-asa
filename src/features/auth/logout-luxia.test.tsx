import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { useAuthStore } from '@/features/auth/store'
import { STORAGE_KEY } from '@/features/luxia/services/historial'
import { useLuxiaStore } from '@/features/luxia/store'
import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const HISTORIAL = JSON.stringify([{ role: 'user', text: '¿Hay Dune?' }])

describe('cerrar sesión borra LuxIA', () => {
  it('logout() borra el historial guardado y reinicia el store de LuxIA', () => {
    entrarComo('Lector')
    localStorage.setItem(STORAGE_KEY, HISTORIAL)
    useLuxiaStore.getState().abrir(document.body)

    useAuthStore.getState().logout()

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(useLuxiaStore.getState()).toMatchObject({
      abierto: false,
      opener: null,
    })
  })

  it('el botón «Cerrar sesión» del sidebar deja LuxIA sin historial', async () => {
    const user = userEvent.setup()
    entrarComo('Lector')
    server.use(...crearApiFake([{ titulo: 'Dune', copias: 1 }]).handlers)
    localStorage.setItem(STORAGE_KEY, HISTORIAL)
    await renderEn('/catalogo?page=1&pageSize=12')

    await user.click(
      await screen.findByRole('button', { name: 'Cerrar sesión' }),
    )

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(useLuxiaStore.getState().abierto).toBe(false)
  })
})
