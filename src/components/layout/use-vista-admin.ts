import { useRouterState } from '@tanstack/react-router'

/** Vista del admin según la URL: /admin… es el Panel; el resto, la Biblioteca (vista de lector). */
export function useVistaAdmin(): 'panel' | 'biblioteca' {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  return pathname === '/admin' || pathname.startsWith('/admin/')
    ? 'panel'
    : 'biblioteca'
}
