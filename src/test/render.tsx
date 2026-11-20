import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'

import { Toaster } from '@/components/ui/sonner'
import { routeTree } from '@/routeTree.gen'

/**
 * Renderiza la app completa (router + Query + Toaster, como main.tsx) en `path`.
 * `staleTime`: por defecto 0; pásale 30_000 (el de main.tsx) en los tests de invalidación, así un
 * dato solo se recarga si se invalida y no por estar viejo.
 */
export async function renderEn(path: string, opciones: { staleTime?: number } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: opciones.staleTime ?? 0 },
      mutations: { retry: false },
    },
  })
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  await router.load()

  return {
    router,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>,
    ),
  }
}
