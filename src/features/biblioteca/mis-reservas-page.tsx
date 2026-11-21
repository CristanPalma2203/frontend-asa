import { Link } from '@tanstack/react-router'
import { BookmarkX, ChevronLeft, ChevronRight } from 'lucide-react'
import gsap from 'gsap'
import { useRef, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { CountUp } from '@/components/ui/count-up'
import { Hueso } from '@/components/ui/hueso'
import { CancelarReservaDialog } from '@/features/biblioteca/components/cancelar-reserva-dialog'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { ReservaCard, ReservaCardFantasma } from '@/features/biblioteca/components/reserva-card'
import {
  useCancelarReserva,
  useMisReservas,
  useReservasActivasCount,
} from '@/features/biblioteca/hooks/use-reservas'
import type { Reserva } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { dur, prefersReducedMotion, reveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Pestana = 'activas' | 'historial'

function textoActivas(valor: number) {
  const n = Math.round(valor)
  return n === 1 ? '1 reserva activa' : `${n} reservas activas`
}

const pestanas: Array<{ id: Pestana; label: string }> = [
  { id: 'activas', label: 'Activas' },
  { id: 'historial', label: 'Historial' },
]

export function MisReservasPage() {
  const [pestana, setPestana] = useState<Pestana>('activas')
  const [page, setPage] = useState(1)
  const [elegida, setElegida] = useState<Reserva | null>(null)
  // La API filtra por un solo estado: Historial pide todas y descarta las activas.
  const reservas = useMisReservas(pestana === 'activas' ? 'Activa' : 'Todas', page)
  const activas = useReservasActivasCount()
  const cancelar = useCancelarReserva()
  const listaRef = useRef<HTMLOListElement>(null)

  const items = (reservas.data?.items ?? []).filter((reserva) =>
    pestana === 'activas' ? reserva.estado === 'Activa' : reserva.estado !== 'Activa',
  )
  const totalPages = reservas.data?.totalPages ?? 0
  const claveItems = `${pestana}|${page}|${items.map((r) => r.idReserva).join(',')}`

  // Ítems: so() de Flito (y 10, stagger 0.03, delay 0.1), de nuevo al cambiar de pestaña o página.
  useMotion(listaRef, (root) => reveal(root.children, { y: 10, stagger: 0.03, delay: 0.1 }), [claveItems])

  /** El ítem sale (opacity 0, y −8, 0.16 s power2.in) y al terminar se cancela de verdad. */
  function confirmarCancelacion(reserva: Reserva) {
    const cancelarYa = () =>
      cancelar.mutate(
        { idReserva: reserva.idReserva },
        {
          onSuccess: () => setElegida(null),
          // Si falla, el ítem vuelve (rollback): se le quita el estilo de la salida.
          onError: () => {
            if (item) gsap.set(item, { clearProps: 'opacity,transform' })
          },
        },
      )
    const item = listaRef.current?.querySelector<HTMLElement>(`[data-reserva="${reserva.idReserva}"]`)
    if (!item || prefersReducedMotion()) {
      cancelarYa()
      return
    }
    gsap.to(item, { opacity: 0, y: -8, duration: dur(0.16), ease: 'power2.in', onComplete: cancelarYa })
  }
  const totalActivas = activas.data

  function cambiarPestana(id: Pestana) {
    setPestana(id)
    setPage(1)
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 pt-6 pb-14 lg:px-14">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Tu cuenta</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-[36px] leading-[1.02] sm:text-[48px]">
            Mis <span className="titulo-serif">reservas</span>
          </h1>
          {activas.isPending && activas.fetchStatus !== 'idle' ? (
            <div className="bg-card border-linea inline-flex h-9 items-center gap-2 self-start rounded-full border px-4 sm:self-auto">
              <span aria-hidden className="bg-texto-5 size-2 rounded-full" />
              <Hueso cargando ancho={20} alto={16} />
              <span className="text-texto-2 text-sm font-medium">reservas activas</span>
            </div>
          ) : totalActivas !== undefined ? (
            <p className="bg-card border-linea text-texto-2 inline-flex h-9 items-center gap-2 self-start rounded-full border px-4 text-sm font-medium sm:self-auto">
              <span
                aria-hidden
                className={cn('size-2 rounded-full', totalActivas > 0 ? 'bg-lima-400' : 'bg-texto-5')}
              />
              <CountUp value={totalActivas} format={textoActivas} />
            </p>
          ) : null}
        </div>
      </header>

      <div role="tablist" aria-label="Reservas" className="border-linea flex gap-6 border-b">
        {pestanas.map((item) => {
          const seleccionada = pestana === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              onClick={() => cambiarPestana(item.id)}
              className={cn(
                'focus-visible:shadow-foco relative -mb-px h-11 cursor-pointer border-b-2 text-[15px] font-semibold transition-colors outline-none',
                seleccionada
                  ? 'border-pino-800 text-tinta'
                  : 'text-texto-3 hover:text-tinta border-transparent',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <section role="tabpanel" aria-label={pestana === 'activas' ? 'Activas' : 'Historial'}>
        {reservas.isPending ? (
          <ol aria-busy aria-label="Cargando reservas" className="before:bg-linea relative flex flex-col gap-4 before:absolute before:top-4 before:bottom-4 before:left-[10px] before:w-px">
            {Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <ReservaCardFantasma />
              </li>
            ))}
          </ol>
        ) : null}

        {reservas.isError ? (
          <div className="bg-card border-linea shadow-card rounded-xl border p-8">
            <h2 className="text-xl">No se pudieron cargar las reservas</h2>
            <ErrorReintentar error={reservas.error} onRetry={() => void reservas.refetch()} />
          </div>
        ) : null}

        {reservas.isSuccess && items.length === 0 ? (
          <div className="bg-card border-linea flex flex-col items-center gap-3 rounded-xl border px-6 py-14 text-center">
            <span className="bg-lima-wash text-pino-800 grid size-14 place-items-center rounded-full">
              <BookmarkX aria-hidden className="size-6" strokeWidth={2} />
            </span>
            <h2 className="mt-2 text-xl">Sin reservas</h2>
            <p className="text-texto-3 max-w-sm text-[15px]">
              {pestana === 'activas'
                ? 'No tienes reservas activas. Busca un libro y resérvalo desde su ficha.'
                : 'Aquí verás las reservas canceladas o completadas.'}
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

        {reservas.isSuccess && items.length > 0 ? (
          <ol
            ref={listaRef}
            className="before:bg-linea relative flex flex-col gap-4 before:absolute before:top-4 before:bottom-4 before:left-[10px] before:w-px"
          >
            {items.map((reserva) => (
              <li key={reserva.idReserva} data-reserva={reserva.idReserva}>
                <ReservaCard reserva={reserva} onCancelar={() => setElegida(reserva)} />
              </li>
            ))}
          </ol>
        ) : null}

        {reservas.isSuccess && totalPages > 1 ? (
          <nav aria-label="Paginación" className="mt-6 flex justify-end gap-2">
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
