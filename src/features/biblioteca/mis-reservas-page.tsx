import { getRouteApi, Link } from '@tanstack/react-router'
import { BookmarkX, ChevronLeft, ChevronRight } from 'lucide-react'
import gsap from 'gsap'
import { useRef, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { CancelarReservaDialog } from '@/features/biblioteca/components/cancelar-reserva-dialog'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { MisReservasExplorar } from '@/features/biblioteca/components/mis-reservas-explorar'
import { MisReservasStats } from '@/features/biblioteca/components/mis-reservas-stats'
import {
  ReservaActivaCard,
  ReservaActivaCardFantasma,
} from '@/features/biblioteca/components/reserva-activa-card'
import {
  ReservaCardFantasma,
  ReservaHistorialLista,
} from '@/features/biblioteca/components/reserva-card'
import {
  useCancelarReserva,
  useMisReservas,
} from '@/features/biblioteca/hooks/use-reservas'
import {
  filtroHistorial,
  type MisReservasSearch,
} from '@/features/biblioteca/schemas/mis-reservas-search.schema'
import type { Reserva } from '@/features/biblioteca/types/api'
import type { FiltroReservas } from '@/features/biblioteca/types/estados'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn, dur, prefersReducedMotion, reveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

const Route = getRouteApi('/mis-reservas')

const chips: Array<{ id: FiltroReservas; label: string }> = [
  { id: 'Todas', label: 'Todas' },
  { id: 'Activa', label: 'Activas' },
  { id: 'Cancelada', label: 'Canceladas' },
]

export function MisReservasPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const filtro = filtroHistorial(search)
  const [page, setPage] = useState(1)
  const [elegida, setElegida] = useState<Reserva | null>(null)

  const activasQuery = useMisReservas('Activa', 1, 50)
  const historial = useMisReservas(filtro, page)
  const cancelar = useCancelarReserva()

  const activasRef = useRef<HTMLDivElement>(null)
  const historialRef = useRef<HTMLOListElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  const activas = (activasQuery.data?.items ?? []).filter(
    (reserva) => reserva.estado === 'Activa',
  )
  const items = historial.data?.items ?? []
  const totalPages = historial.data?.totalPages ?? 0
  const totalTodas = useMisReservas('Todas', 1, 1)
  const sinNinguna = totalTodas.isSuccess && totalTodas.data.totalCount === 0

  const claveActivas = activas.map((r) => r.idReserva).join(',')
  const claveHistorial = `${filtro}|${page}|${items.map((r) => r.idReserva).join(',')}`

  useMotion(
    headerRef,
    (root) => reveal(root.children, { y: 10, stagger: 0.06 }),
    [0],
  )
  useMotion(
    activasRef,
    (root) => cardsIn(root.children, { stagger: 0.08, delay: 0.05 }),
    [claveActivas],
  )
  useMotion(
    historialRef,
    (root) => cardsIn(root.children, { stagger: 0.05, delay: 0.08 }),
    [claveHistorial],
  )

  function irCon(cambios: Partial<MisReservasSearch>) {
    setPage(1)
    const estado = cambios.estado ?? filtro
    void navigate({
      search: estado === 'Todas' ? {} : { estado },
      replace: false,
    })
  }

  function confirmarCancelacion(reserva: Reserva) {
    const cancelarYa = () =>
      cancelar.mutate(
        { idReserva: reserva.idReserva },
        {
          onSuccess: () => setElegida(null),
          onError: () => {
            if (item) gsap.set(item, { clearProps: 'opacity,transform' })
          },
        },
      )
    const item =
      activasRef.current?.querySelector<HTMLElement>(
        `[data-reserva="${reserva.idReserva}"]`,
      ) ??
      historialRef.current?.querySelector<HTMLElement>(
        `[data-reserva="${reserva.idReserva}"]`,
      )
    if (!item || prefersReducedMotion()) {
      cancelarYa()
      return
    }
    gsap.to(item, {
      opacity: 0,
      y: -8,
      duration: dur(0.16),
      ease: 'power2.in',
      onComplete: cancelarYa,
    })
  }

  const cargando =
    activasQuery.isPending || historial.isPending || totalTodas.isPending
  const error = activasQuery.isError
    ? activasQuery.error
    : historial.isError
      ? historial.error
      : null

  return (
    <main className="flex w-full flex-col gap-8 pt-6 pr-4 pb-14 pl-4 sm:pr-32 md:pl-6 xl:pl-8">
      <header
        ref={headerRef}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex flex-col gap-2">
          <p className="eyebrow">Tu cuenta</p>
          <h1 className="text-[36px] leading-[1.02] sm:text-[48px]">
            Mis <span className="titulo-serif">reservas</span>
          </h1>
          <p className="text-texto-3 text-[15px]">
            Tus reservas activas y el historial de las que cancelaste.
          </p>
        </div>
        <Link
          to="/catalogo"
          search={{ page: 1, pageSize: 12 }}
          className={buttonVariants({ className: 'self-start sm:self-auto' })}
        >
          Explorar catálogo
        </Link>
      </header>

      <MisReservasStats />

      {error ? (
        <div className="bg-card border-linea shadow-card rounded-xl border p-8">
          <h2 className="text-xl">
            No pudimos cargar tus <span className="titulo-serif">reservas</span>
          </h2>
          <ErrorReintentar
            error={error}
            onRetry={() => {
              void activasQuery.refetch()
              void historial.refetch()
              void totalTodas.refetch()
            }}
          />
        </div>
      ) : null}

      {!error && cargando ? (
        <>
          <div
            aria-busy
            aria-label="Cargando reservas activas"
            className="grid gap-4 md:grid-cols-2"
          >
            <ReservaActivaCardFantasma />
          </div>
          <div aria-busy aria-label="Cargando historial">
            <ReservaCardFantasma filas={2} />
          </div>
        </>
      ) : null}

      {!error && !cargando && sinNinguna ? (
        <div className="bg-card border-linea flex flex-col items-center gap-3 rounded-xl border px-6 py-14 text-center">
          <span className="bg-lima-wash text-pino-800 grid size-14 place-items-center rounded-full">
            <BookmarkX aria-hidden className="size-6" strokeWidth={2} />
          </span>
          <h2 className="mt-2 text-xl">
            Aún no tienes <span className="titulo-serif">reservas</span>
          </h2>
          <p className="text-texto-3 max-w-sm text-[15px]">
            Busca un libro en el catálogo y resérvalo. Aquí verás el código de
            tu ejemplar.
          </p>
          <Link
            to="/catalogo"
            search={{ page: 1, pageSize: 12 }}
            className={buttonVariants({ className: 'mt-3' })}
          >
            Explorar catálogo
          </Link>
        </div>
      ) : null}

      {!error && !cargando && !sinNinguna ? (
        <>
          {activas.length > 0 ? (
            <section
              aria-label="Reservas activas"
              className="flex flex-col gap-4"
            >
              <h2 className="text-xl tracking-[-0.02em]">
                {activas.length === 1 ? (
                  <>
                    Tu reserva <span className="titulo-serif">activa</span>
                  </>
                ) : (
                  <>
                    Tus reservas <span className="titulo-serif">activas</span>
                  </>
                )}
              </h2>
              <div
                ref={activasRef}
                className={cn(
                  'grid gap-4',
                  activas.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1',
                )}
              >
                {activas.map((reserva) => (
                  <ReservaActivaCard
                    key={reserva.idReserva}
                    reserva={reserva}
                    onCancelar={() => setElegida(reserva)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="bg-card border-linea flex flex-col items-center gap-3 rounded-xl border px-6 py-10 text-center">
              <h2 className="text-xl">No tienes reservas activas</h2>
              <p className="text-texto-3 max-w-sm text-[15px]">
                Busca un libro y resérvalo desde su ficha: el sistema te asigna
                un ejemplar.
              </p>
              <Link
                to="/catalogo"
                search={{ page: 1, pageSize: 12 }}
                className={buttonVariants({ className: 'mt-1' })}
              >
                Explorar catálogo
              </Link>
            </div>
          )}

          <section aria-label="Historial" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl tracking-[-0.02em]">Historial</h2>
              <div
                role="tablist"
                aria-label="Filtro del historial"
                className="bg-niebla flex gap-1 self-start rounded-full p-1"
              >
                {chips.map((chip) => {
                  const seleccionada = filtro === chip.id
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      role="tab"
                      aria-selected={seleccionada}
                      onClick={() => irCon({ estado: chip.id })}
                      className={cn(
                        'focus-visible:shadow-foco h-9 cursor-pointer rounded-full px-4 text-sm transition-colors outline-none',
                        seleccionada
                          ? 'bg-card text-tinta font-semibold shadow-sm'
                          : 'text-texto-3 hover:text-tinta font-medium',
                      )}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {historial.isSuccess && items.length === 0 ? (
              <div className="border-linea rounded-xl border border-dashed px-6 py-12 text-center">
                <h3 className="text-base font-semibold">
                  {filtro === 'Activa'
                    ? 'No tienes reservas activas'
                    : filtro === 'Cancelada'
                      ? 'Sin reservas canceladas'
                      : 'Tu historial está vacío'}
                </h3>
                <p className="text-texto-3 mt-1 text-sm">
                  {filtro === 'Activa'
                    ? 'Cuando reserves un libro aparecerá aquí.'
                    : 'Las reservas que canceles quedarán en este historial.'}
                </p>
              </div>
            ) : null}

            {historial.isSuccess && items.length > 0 ? (
              <ReservaHistorialLista
                items={items}
                listRef={historialRef}
                onCancelar={setElegida}
              />
            ) : null}

            {historial.isSuccess && totalPages > 1 ? (
              <nav aria-label="Paginación" className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft aria-hidden />
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                  <ChevronRight aria-hidden />
                </Button>
              </nav>
            ) : null}
          </section>
        </>
      ) : null}

      <MisReservasExplorar />

      <CancelarReservaDialog
        reserva={elegida}
        onClose={() => setElegida(null)}
        pending={cancelar.isPending}
        error={cancelar.error}
        onConfirmar={confirmarCancelacion}
      />
    </main>
  )
}
