import { useRouterState } from '@tanstack/react-router'

export function useVistaAdmin(): 'panel' | 'biblioteca' {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  return pathname === '/admin' || pathname.startsWith('/admin/')
    ? 'panel'
    : 'biblioteca'
}
