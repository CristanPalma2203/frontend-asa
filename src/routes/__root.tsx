import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { Card } from '@/components/ui/card'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
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

function NotFoundPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Card className="p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl">Página no encontrada</h1>
        <p className="mt-2 text-sm text-tinta">Esa ruta no existe.</p>
      </Card>
    </main>
  )
}
