import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import heroBlobs from '@/assets/hero-blobs.png'
import { Button } from '@/components/ui/button'
import { CancelarReservaDialog } from '@/features/biblioteca/components/cancelar-reserva-dialog'
import { ReservaCard } from '@/features/biblioteca/components/reserva-card'
import { ReservasSkeleton } from '@/features/biblioteca/components/skeletons'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { useCancelarReserva, useMisReservas } from '@/features/biblioteca/hooks/use-reservas'
import type { Reserva } from '@/features/biblioteca/types/api'
import type { FiltroReservas } from '@/features/biblioteca/types/estados'
import { ApiError } from '@/lib/api/client'

const filtros: Array<{ id: FiltroReservas; label: string }> = [
  { id: 'Activa', label: 'Activas' },
  { id: 'Cancelada', label: 'Canceladas' },
  { id: 'Todas', label: 'Todas' },
]

export function MisReservasPage() {
  const [filtro, setFiltro] = useState<FiltroReservas>('Activa')
  const [page, setPage] = useState(1)
  const [elegida, setElegida] = useState<Reserva | null>(null)
  const reservas = useMisReservas(filtro, page)
  const cancelar = useCancelarReserva()

  const items = (reservas.data?.items ?? []).filter((reserva) =>
    filtro === 'Todas' ? true : reserva.estado === filtro,
  )
  const totalPages = reservas.data?.totalPages ?? 0

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <h1 className="font-display text-4xl text-verde">Mis reservas</h1>
      <div className="flex flex-wrap gap-2">
        {filtros.map((item) => (
          <Button
            key={item.id}
            type="button"
            size="sm"
            variant={filtro === item.id ? 'secondary' : 'outline'}
            onClick={() => {
              setFiltro(item.id)
              setPage(1)
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {reservas.isPending ? <ReservasSkeleton /> : null}

      {reservas.isError ? (
        <section className="rounded-2xl border-2 border-tinta bg-white p-6 shadow-cartoon">
          <h2 className="font-display text-2xl text-verde">No se pudieron cargar las reservas</h2>
          <p className="mt-2 text-sm">
            {reservas.error instanceof ApiError
              ? mensajeDeError(reservas.error.code, reservas.error.detail || reservas.error.title)
              : 'Error de red.'}
          </p>
          <Button type="button" className="mt-4" onClick={() => void reservas.refetch()}>
            Reintentar
          </Button>
        </section>
      ) : null}

      {reservas.isSuccess && items.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border-2 border-tinta bg-white px-6 py-10 text-center shadow-cartoon">
          <img src={heroBlobs} alt="" className="h-28 w-40 rounded-2xl object-cover" />
          <h2 className="font-display text-2xl text-verde">Sin reservas</h2>
          <p className="text-sm">En este filtro no hay nada todavía.</p>
          <Button asChild variant="secondary">
            <Link to="/catalogo" search={{ page: 1, pageSize: 12 }}>
              Explorar catálogo
            </Link>
          </Button>
        </section>
      ) : null}

      {reservas.isSuccess && items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((reserva) => (
            <li key={reserva.idReserva}>
              <ReservaCard reserva={reserva} onCancelar={() => setElegida(reserva)} />
            </li>
          ))}
        </ul>
      ) : null}

      {reservas.isSuccess && totalPages > 1 ? (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </Button>
        </div>
      ) : null}

      <CancelarReservaDialog
        reserva={elegida}
        onClose={() => setElegida(null)}
        pending={cancelar.isPending}
        error={cancelar.error}
        onConfirmar={(reserva) =>
          cancelar.mutate(
            { idReserva: reserva.idReserva },
            { onSuccess: () => setElegida(null) },
          )
        }
      />
    </main>
  )
}
