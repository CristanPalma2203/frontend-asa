import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'

import { Toaster } from '@/components/ui/sonner'
import { routeTree } from '@/routeTree.gen'

import { registrarRouter } from './navegaciones'

export async function renderEn(
  path: string,
  opciones: { staleTime?: number } = {},
) {
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
  registrarRouter(router)
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
