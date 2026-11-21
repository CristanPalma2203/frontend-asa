import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { ArrowUpRight, Menu, Search, X } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'

import { Brand } from '@/components/layout/brand'
import { Sidebar } from '@/components/layout/sidebar'
import { LuxiaBoton } from '@/features/luxia/components/luxia-boton'
import { LuxiaFab } from '@/features/luxia/components/luxia-fab'
import { useMotion } from '@/hooks/use-motion'
import { reveal, titleLines } from '@/lib/motion'

/** Rutas con cabecera propia (hero o pantalla partida), sin sidebar. */
const rutasSinSidebar = new Set(['/', '/login'])

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  // 404 global (notFoundComponent de la raíz): se pinta dentro del shell, pero sin LuxIA.
  const esNoEncontrada = useRouterState({
    select: (state) =>
      // Sin ruta hija que coincida solo queda la raíz: es el 404 global.
      state.matches.every((match) => match.routeId === '__root__') ||
      state.matches.some((match) => match.status === 'notFound'),
  })

  // La Home lleva su propia navegación dentro del hero y el login es una pantalla partida.
  if (pathname === '/login') return <>{children}</>
  if (rutasSinSidebar.has(pathname)) {
    return (
      <div className="bg-background flex min-h-svh flex-col">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <LayoutConSidebar pathname={pathname} conLuxia={!esNoEncontrada}>
      {children}
    </LayoutConSidebar>
  )
}

function LayoutConSidebar({
  pathname,
  conLuxia,
  children,
}: {
  pathname: string
  conLuxia: boolean
  children: ReactNode
}) {
  const enAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const asideRef = useRef<HTMLElement>(null)
  const barraRef = useRef<HTMLDivElement>(null)
  const rutaRef = useRef<HTMLDivElement>(null)

  // Arranque del shell, solo la primera vez.
  useMotion(asideRef, (root) =>
    reveal(root.querySelectorAll('nav [data-item-nav]'), {
      x: -12,
      y: 0,
      stagger: 0.04,
      delay: 0.15,
    }),
  )
  useMotion(barraRef, (root) =>
    reveal(root.querySelectorAll('header > *'), {
      y: -12,
      stagger: 0.05,
      delay: 0.05,
    }),
  )

  // Transición de ruta: arriba del todo, contenedor con reveal (y 12), h1 por palabras y bloques de
  // cabecera con y 14 (stagger 0.07, t 0.12). Sin salida.
  useMotion(
    rutaRef,
    (root) => {
      if (typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0 })
        } catch {
          /* jsdom */
        }
      }
      reveal(root, { y: 12 })
      titleLines(root.querySelector('h1'))
      const bloques = Array.from(root.querySelectorAll('header > *')).filter(
        (el) => el.tagName !== 'H1' && !el.querySelector('h1'),
      )
      reveal(bloques, { y: 14, stagger: 0.07, delay: 0.12 })
    },
    [pathname],
  )

  return (
    <div className="bg-background min-h-svh lg:flex">
      <aside
        ref={asideRef}
        className="sticky top-0 hidden h-svh w-66 flex-none lg:block"
      >
        <Sidebar />
      </aside>
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <MobileNav />
        <div ref={barraRef} className="hidden lg:block">
          {enAdmin ? <AdminTopbar pathname={pathname} /> : <Topbar />}
        </div>
        {/* No es <main>: cada pantalla ya trae el suyo. */}
        <div ref={rutaRef} data-ruta className="flex-1 overflow-clip">
          {children}
        </div>
        <SiteFooter />
      </div>
      {/* LuxIA solo vive en las pantallas con sidebar: nunca en la Home, el login ni el 404. */}
      {conLuxia ? <LuxiaFab /> : null}
    </div>
  )
}

/** Barra superior del área de lector: buscador que lleva al catálogo. */
function Topbar() {
  return (
    <header className="flex h-[92px] items-center justify-between gap-6 px-14">
      <BuscadorGlobal />
      <LuxiaBoton variante="barra" />
    </header>
  )
}

function AdminTopbar({ pathname }: { pathname: string }) {
  const seccion = pathname.startsWith('/admin/lectores')
    ? 'Lectores'
    : pathname.startsWith('/admin/libros')
      ? 'Libros'
      : 'Resumen'
  return (
    <header className="flex h-[84px] items-center justify-between gap-6 px-14">
      <nav
        aria-label="Ruta"
        className="text-texto-3 flex items-center gap-2 text-[13px] font-medium"
      >
        Panel de administración
        <span aria-hidden className="text-separador">
          /
        </span>
        <span className="text-tinta">{seccion}</span>
      </nav>
      <Link
        to="/catalogo"
        search={{ page: 1, pageSize: 12 }}
        className="border-linea-fuerte bg-papel text-tinta hover:border-tinta flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors"
      >
        Ver catálogo público
        <ArrowUpRight className="size-3.5" strokeWidth={2.2} />
      </Link>
    </header>
  )
}

function BuscadorGlobal({ className = 'w-[440px]' }: { className?: string }) {
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')

  return (
    <form
      role="search"
      className={`relative ${className}`}
      onSubmit={(event) => {
        event.preventDefault()
        const buscar = texto.trim()
        void navigate({
          to: '/catalogo',
          search: { page: 1, pageSize: 12, ...(buscar ? { buscar } : {}) },
        })
      }}
    >
      <Search
        aria-hidden
        className="text-niebla-fg pointer-events-none absolute top-1/2 left-[18px] size-[18px] -translate-y-1/2"
        strokeWidth={2}
      />
      <input
        type="search"
        aria-label="Buscar en el catálogo"
        placeholder="Busca por título, autor o ISBN"
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        className="border-linea bg-papel text-tinta focus-visible:border-pino-800 focus-visible:shadow-foco h-[46px] w-full rounded-full border pr-[18px] pl-[46px] text-sm transition-[border-color,box-shadow] outline-none"
      />
    </form>
  )
}

/** Barra móvil (< lg) con el sidebar como panel lateral. */
function MobileNav() {
  const [abierto, setAbierto] = useState(false)

  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={setAbierto}>
      <nav className="flex h-[72px] items-center justify-between px-5 lg:hidden">
        <Brand tono="claro" />
        <DialogPrimitive.Trigger
          aria-label="Abrir menú"
          className="border-linea-fuerte bg-papel text-tinta grid size-11 cursor-pointer place-items-center rounded-full border"
        >
          <Menu className="size-[18px]" strokeWidth={2.2} />
        </DialogPrimitive.Trigger>
      </nav>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-pino-950/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 lg:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=open]:slide-in-from-left fixed inset-y-0 left-0 z-50 w-[min(300px,85vw)] lg:hidden"
        >
          <DialogPrimitive.Title className="sr-only">
            Menú
          </DialogPrimitive.Title>
          <Sidebar onNavegar={() => setAbierto(false)} />
          <DialogPrimitive.Close
            aria-label="Cerrar menú"
            className="absolute top-6 right-4 grid size-9 cursor-pointer place-items-center rounded-full text-white/70 hover:bg-white/8 hover:text-white"
          >
            <X className="size-[18px]" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function SiteFooter() {
  return (
    <footer className="text-texto-3 px-5 py-6 text-center text-xs lg:px-14">
      Desarrollado por Alex Palma · Luxware
    </footer>
  )
}
