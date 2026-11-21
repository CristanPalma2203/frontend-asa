import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Toaster } from '@/components/ui/sonner'
import { sesionExpiradaAlCargar } from '@/features/auth/store'
import { olvidarLuxia } from '@/features/luxia/reset'
import { ApiError, setUnauthorizedHandler } from '@/lib/api/client'
import { routeTree } from '@/routeTree.gen'

import '@/lib/boneyard'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false
        }
        return failureCount < 1
      },
    },
  },
})

const router = createRouter({ routeTree })

// Token vencido al abrir la app: la sesión ya se cerró al rehidratar; su conversación también se olvida.
if (sesionExpiradaAlCargar) olvidarLuxia()

setUnauthorizedHandler(() => {
  if (router.state.location.pathname === '/login') return
  void router.navigate({
    to: '/login',
    search: { redirect: router.state.location.href },
  })
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById('root')

if (!root) {
  throw new Error('No se encontró #root')
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  </StrictMode>,
)
