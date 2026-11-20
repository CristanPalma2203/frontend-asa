import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

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
  const [menuAbierto, setMenuAbierto] = useState(false)

  function salir() {
    logout()
    queryClient.clear()
    setMenuAbierto(false)
    void navigate({ to: '/' })
  }

  return (
    <header className="relative border-b-2 border-tinta bg-verde text-crema">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="font-display text-xl text-crema sm:text-2xl" onClick={() => setMenuAbierto(false)}>
          ASA Biblioteca
        </Link>
        <button
          type="button"
          className="rounded-lg bg-lima px-3 py-2 text-sm font-semibold text-verde md:hidden"
          aria-expanded={menuAbierto}
          aria-controls="nav-principal"
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          Menú
        </button>
        <div
          id="nav-principal"
          className={
            menuAbierto
              ? 'absolute top-16 right-4 left-4 z-40 flex flex-col gap-3 rounded-2xl border-2 border-tinta bg-verde p-4 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0'
              : 'hidden md:flex md:items-center md:gap-2'
          }
        >
          <nav className="flex flex-col gap-2 md:flex-row md:items-center" aria-label="Principal">
            {links.map((link) => {
              if (link.show === 'lector' && !isLector) return null
              if (link.show === 'admin' && !isAdmin) return null
              const active = pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuAbierto(false)}
                  aria-current={active ? 'page' : undefined}
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
              <span className="text-sm text-crema">{nombre}</span>
              <Button type="button" variant="secondary" size="sm" onClick={salir}>
                Salir
              </Button>
            </div>
          ) : (
            <Button asChild variant="secondary" size="sm">
              <Link to="/login" onClick={() => setMenuAbierto(false)}>
                Entrar
              </Link>
            </Button>
          )}
        </div>
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
