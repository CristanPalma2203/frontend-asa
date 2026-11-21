import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { ErrorGeneral, PaginaNoEncontrada } from '@/components/layout/pantallas-estado'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: PaginaNoEncontrada,
  errorComponent: ErrorGeneral,
})

function RootLayout() {
  return (
    <AppShell>
      <Titulo />
      <Outlet />
    </AppShell>
  )
}

function Titulo() {
  const matches = useRouterState({ select: (state) => state.matches })
  const title = [...matches].reverse().find((match) => match.staticData.title)?.staticData.title

  useEffect(() => {
    document.title = title ?? 'ASA Biblioteca'
  }, [title])

  return null
}
