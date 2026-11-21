import { Link, useRouterState } from '@tanstack/react-router'
import {
  Bookmark,
  BookOpen,
  House,
  LayoutDashboard,
  LogIn,
  LogOut,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useRef, type ReactNode } from 'react'

import { Brand } from '@/components/layout/brand'
import { CountUp } from '@/components/ui/count-up'
import { Hueso } from '@/components/ui/hueso'
import { useSesion } from '@/components/layout/use-sesion'
import { VistaPill } from '@/components/layout/vista-pill'
import { useReservasActivasCount } from '@/features/biblioteca/hooks/use-reservas'
import {
  useTotalLectores,
  useTotalLibros,
} from '@/features/biblioteca/hooks/use-totales'
import { useMotion } from '@/hooks/use-motion'
import { reveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

const listaAdmin = { page: 1, pageSize: 12 } as const

export function Sidebar({
  onNavegar,
  conVistaPill = false,
}: {
  onNavegar?: () => void
  conVistaPill?: boolean
}) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const sesion = useSesion()
  const enAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const navRef = useRef<HTMLElement>(null)
  useMotion(
    navRef,
    (root) =>
      reveal(root.querySelectorAll('[data-item-nav], [data-nota-vista]'), {
        x: -12,
        y: 0,
        stagger: 0.04,
      }),
    [enAdmin],
  )

  return (
    <div className="bg-sidebar text-sidebar-foreground relative flex h-full flex-col gap-10 overflow-hidden px-5 pt-7 pb-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-36 -left-30 size-105 bg-[radial-gradient(closest-side,rgb(152_214_84/0.22),rgb(152_214_84/0))]"
      />

      {conVistaPill && sesion.isAdmin ? (
        <VistaPill tono="oscuro" className="relative mr-12" />
      ) : null}
      <div className="relative flex items-center px-2">
        <Brand onClick={onNavegar} />
      </div>

      <nav
        ref={navRef}
        aria-label="Principal"
        className="relative flex flex-col gap-1"
      >
        <p className="px-3 pb-2.5 text-[11px] font-semibold tracking-[0.12em] text-white/45 uppercase">
          {enAdmin ? 'Gestión' : sesion.isAdmin ? 'Biblioteca' : 'Menú'}
        </p>
        {enAdmin ? (
          <>
            <ItemNav
              activo={pathname === '/admin' || pathname === '/admin/'}
              icono={LayoutDashboard}
              onClick={onNavegar}
            >
              <Link to="/admin">Resumen</Link>
            </ItemNav>
            <ItemNav
              activo={pathname.startsWith('/admin/libros')}
              icono={BookOpen}
              onClick={onNavegar}
            >
              <Link to="/admin/libros" search={listaAdmin}>
                Libros
              </Link>
              <ContadorLibros />
            </ItemNav>
            <ItemNav
              activo={pathname.startsWith('/admin/lectores')}
              icono={Users}
              onClick={onNavegar}
            >
              <Link to="/admin/lectores" search={listaAdmin}>
                Lectores
              </Link>
              <ContadorLectores />
            </ItemNav>
          </>
        ) : (
          <>
            <ItemNav
              activo={pathname === '/'}
              icono={House}
              onClick={onNavegar}
            >
              <Link to="/">Inicio</Link>
            </ItemNav>
            <ItemNav
              activo={
                pathname.startsWith('/catalogo') ||
                pathname.startsWith('/libros/')
              }
              icono={BookOpen}
              onClick={onNavegar}
            >
              <Link to="/catalogo" search={{ page: 1, pageSize: 12 }}>
                Catálogo
              </Link>
            </ItemNav>
            {sesion.isLector ? (
              <ItemNav
                activo={pathname.startsWith('/mis-reservas')}
                icono={Bookmark}
                onClick={onNavegar}
              >
                <Link to="/mis-reservas">Mis reservas</Link>
                <ContadorReservas />
              </ItemNav>
            ) : null}
            {sesion.isAdmin ? (
              <p
                data-nota-vista
                className="mt-4 rounded-xl bg-white/4 px-3.5 py-3 text-xs leading-relaxed text-white/60"
              >
                Estás viendo la biblioteca como un lector, sin reservas.
              </p>
            ) : null}
          </>
        )}
      </nav>

      <div className="relative mt-auto flex flex-col gap-3">
        {sesion.visible ? (
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5">
            <span
              aria-hidden
              className={cn(
                'text-pino-800 grid size-[38px] flex-none place-items-center rounded-full text-[13px] font-semibold',
                sesion.isAdmin ? 'bg-hueso' : 'bg-lima-400',
              )}
            >
              {sesion.iniciales}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold">
                {sesion.nombre}
              </span>
              <span className="truncate text-xs text-white/55">
                {sesion.detalle}
              </span>
            </div>
            <button
              type="button"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              onClick={() => {
                onNavegar?.()
                sesion.salir()
              }}
              className="grid size-8 cursor-pointer place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/8 hover:text-white"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            onClick={onNavegar}
            className="bg-lima-400 text-pino-800 hover:bg-lima-500 flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-colors"
          >
            <LogIn className="size-4" />
            Iniciar sesión
          </Link>
        )}
      </div>
    </div>
  )
}

function ContadorLibros() {
  const total = useTotalLibros()
  return (
    <ContadorNav
      valor={total.data}
      cargando={total.isPending}
      etiqueta="libros"
      tono="neutro"
    />
  )
}

function ContadorLectores() {
  const total = useTotalLectores()
  return (
    <ContadorNav
      valor={total.data}
      cargando={total.isPending}
      etiqueta="lectores"
      tono="neutro"
    />
  )
}

function ContadorReservas() {
  const activas = useReservasActivasCount()
  return (
    <ContadorNav
      valor={activas.data}
      cargando={activas.isPending && activas.fetchStatus !== 'idle'}
      etiqueta="reservas activas"
    />
  )
}

function ContadorNav({
  valor,
  cargando = false,
  etiqueta,
  tono = 'lima',
}: {
  valor: number | undefined
  cargando?: boolean
  etiqueta: string
  tono?: 'lima' | 'neutro'
}) {
  if (cargando) {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
      >
        <Hueso cargando ancho={20} alto={16} radio={999} />
      </div>
    )
  }
  if (!valor) return null
  return (
    <span
      className={cn(
        tono === 'lima'
          ? 'bg-lima-400 text-pino-800'
          : 'bg-white/10 text-white/80',
        'pointer-events-none absolute top-1/2 right-3 grid h-5 min-w-5 -translate-y-1/2 place-items-center rounded-full px-1.5 font-mono text-[11px] font-semibold',
      )}
    >
      <CountUp value={valor} duration={0.9} />
      <span className="sr-only"> {etiqueta}</span>
    </span>
  )
}

function ItemNav({
  activo,
  icono: Icono,
  onClick,
  children,
}: {
  activo: boolean
  icono: LucideIcon
  onClick?: () => void
  children: ReactNode
}) {
  return (
    <div
      data-item-nav
      onClick={onClick}
      className={cn(
        'relative [&>a]:flex [&>a]:h-11 [&>a]:items-center [&>a]:gap-3 [&>a]:rounded-xl [&>a]:pr-3 [&>a]:pl-[42px] [&>a]:text-[15px] [&>a]:transition-colors',
        activo
          ? '[&>a]:bg-lima-400/10 [&>a]:text-lima-400 [&>a]:font-semibold'
          : '[&>a]:font-medium [&>a]:text-white/78 [&>a:hover]:bg-white/5 [&>a:hover]:text-white',
      )}
    >
      {activo ? (
        <span
          aria-hidden
          className="bg-lima-400 absolute top-2.5 -left-5 h-6 w-[3px] rounded-r-[3px]"
        />
      ) : null}
      <Icono
        aria-hidden
        strokeWidth={1.8}
        className={cn(
          'pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2',
          activo ? 'text-lima-400' : 'text-white/78',
        )}
      />
      {children}
    </div>
  )
}
