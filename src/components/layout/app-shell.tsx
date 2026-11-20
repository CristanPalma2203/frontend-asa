import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  selectIsAdmin,
  selectIsLector,
  useAuthStore,
} from '@/features/auth/store'

const links = [
  { to: '/catalogo', label: 'Catálogo', show: 'always' },
  { to: '/mis-reservas', label: 'Mis reservas', show: 'lector' },
  { to: '/admin', label: 'Administración', show: 'admin' },
] as const

export function SiteHeader() {
  const isAdmin = useAuthStore(selectIsAdmin)
  const isLector = useAuthStore(selectIsLector)
  const nombre = useAuthStore((state) => {
    if (!isSessionVisible(state)) return null
    return state.nombre || state.correo
  })
  const logout = useAuthStore((state) => state.logout)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <header className="border-b-2 border-tinta bg-verde text-crema">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="font-display text-xl text-crema sm:text-2xl">
          ASA Biblioteca
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            if (link.show === 'lector' && !isLector) return null
            if (link.show === 'admin' && !isAdmin) return null
            const active = pathname === link.to
            return (
              <Link
                key={link.to}
                to={link.to}
                className={
                  active
                    ? 'rounded-lg bg-lima px-3 py-2 text-sm font-semibold text-verde'
                    : 'rounded-lg px-3 py-2 text-sm text-crema hover:bg-crema/10'
                }
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        {nombre ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{nombre}</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                logout()
                queryClient.clear()
                void navigate({ to: '/' })
              }}
            >
              Salir
            </Button>
          </div>
        ) : (
          <Button asChild variant="secondary" size="sm">
            <Link to="/login">Entrar</Link>
          </Button>
        )}
      </div>
    </header>
  )
}

function isSessionVisible(state: {
  token: string | null
  expiresAt: number | null
  nombre: string | null
  correo: string | null
}) {
  return Boolean(
    state.token &&
      (state.nombre || state.correo) &&
      state.expiresAt &&
      state.expiresAt > Date.now(),
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-tinta px-4 py-4 text-center text-sm">
      Desarrollado por Alex Palma · Luxware
    </footer>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-crema">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  )
}
