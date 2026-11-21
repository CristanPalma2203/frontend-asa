import type { AnyRouter } from '@tanstack/react-router'
import { waitFor } from '@testing-library/react'

const routersMontados = new Set<AnyRouter>()

export function registrarRouter(router: AnyRouter) {
  routersMontados.add(router)
}

export async function esperarNavegacionesPendientes() {
  const routers = [...routersMontados]
  routersMontados.clear()
  for (const router of routers) {
    await waitFor(() => {
      if (router.state.status !== 'idle' || router.state.isLoading) {
        throw new Error('El router sigue navegando')
      }
    })
  }
}
