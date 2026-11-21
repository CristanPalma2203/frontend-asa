import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { Menu, Search, X } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'

import { Brand } from '@/components/layout/brand'
import { Sidebar } from '@/components/layout/sidebar'
import { useSesion } from '@/components/layout/use-sesion'
import { VistaPill } from '@/components/layout/vista-pill'
import { LuxiaFab } from '@/features/luxia/components/luxia-fab'
import { useMotion } from '@/hooks/use-motion'
import { reveal, titleLines } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const esNoEncontrada = useRouterState({
    select: (state) =>
      state.matches.every((match) => match.routeId === '__root__') ||
      state.matches.some((match) => match.status === 'notFound'),
  })

  if (pathname === '/login' || esNoEncontrada) return <>{children}</>

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

  useMotion(
    rutaRef,
    (root) => {
      window.scrollTo({ top: 0 })
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
          {enAdmin ? (
            <AdminTopbar pathname={pathname} />
          ) : (
            <Topbar enInicio={pathname === '/'} />
          )}
        </div>
        <div
          ref={rutaRef}
          data-ruta
          className={cn(
            'flex-1 overflow-clip',
            conLuxia && 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]',
          )}
        >
          {children}
        </div>
        <SiteFooter />
      </div>
      {conLuxia ? <LuxiaFab /> : null}
    </div>
  )
}

function Topbar({ enInicio }: { enInicio: boolean }) {
  const sesion = useSesion()
  if (enInicio && !sesion.isAdmin) return null
  return (
    <header className="relative flex h-[92px] items-center justify-between gap-6 px-14">
      {enInicio ? <span /> : <BuscadorGlobal />}
      <VistaPill className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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
    <header className="relative flex h-[84px] items-center justify-between gap-6 px-14">
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
      <VistaPill className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
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
        name="buscar"
        aria-label="Buscar en el catálogo"
        placeholder="Busca por título, autor o ISBN"
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        className="border-linea bg-papel text-tinta focus-visible:border-pino-800 focus-visible:shadow-foco h-[46px] w-full rounded-full border pr-[18px] pl-[46px] text-sm transition-[border-color,box-shadow] outline-none"
      />
    </form>
  )
}

function MobileNav() {
  const [abierto, setAbierto] = useState(false)

  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={setAbierto}>
      <nav className="flex h-[72px] items-center justify-between px-5 lg:hidden">
        <Brand tono="claro" />
        <DialogPrimitive.Trigger
          aria-label="Abrir menú"
          className="border-linea-fuerte bg-papel text-tinta grid size-11 cursor-pointer touch-manipulation place-items-center rounded-full border"
        >
          <Menu className="size-[18px]" strokeWidth={2.2} />
        </DialogPrimitive.Trigger>
      </nav>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-pino-950/45 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 lg:hidden" />
        <DialogPrimitive.Content
          data-slot="sheet-content"
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=open]:slide-in-from-left fixed inset-y-0 left-0 z-50 w-[min(300px,85vw)] lg:hidden"
        >
          <DialogPrimitive.Title className="sr-only">
            Menú
          </DialogPrimitive.Title>
          <Sidebar onNavegar={() => setAbierto(false)} conVistaPill />
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
      Desarrollado por Alex Palma
    </footer>
  )
}
