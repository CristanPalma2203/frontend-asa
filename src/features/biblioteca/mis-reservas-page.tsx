import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import heroBlobs from '@/assets/hero-blobs.png'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { EstadoBadge } from '@/features/biblioteca/estado-badge'
import { badgeReserva } from '@/features/biblioteca/estados'
import { useCancelarReserva, useLibro, useMisReservas } from '@/features/biblioteca/hooks'
import type { FiltroReservas } from '@/features/biblioteca/api'
import type { Reserva } from '@/features/biblioteca/types'
import { ApiError } from '@/lib/api/client'

const filtros: Array<{ id: FiltroReservas; label: string }> = [
  { id: 'Activa', label: 'Activas' },
  { id: 'Cancelada', label: 'Canceladas' },
  { id: 'Todas', label: 'Todas' },
]

import { formatearFecha } from '@/lib/fechas'

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

      {reservas.isPending ? <ListaSkeleton /> : null}

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

      <Dialog open={elegida !== null} onOpenChange={(open) => !open && setElegida(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar reserva</DialogTitle>
            <DialogDescription>
              Se libera {elegida?.titulo} ({elegida?.codigoInventario}).
            </DialogDescription>
          </DialogHeader>
          {cancelar.error instanceof ApiError ? (
            <p className="text-sm text-destructive">
              {mensajeDeError(cancelar.error.code, cancelar.error.detail || cancelar.error.title)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setElegida(null)}>
              Volver
            </Button>
            <Button
              type="button"
              disabled={cancelar.isPending || !elegida}
              onClick={() => {
                if (!elegida) return
                cancelar.mutate(
                  { idReserva: elegida.idReserva, libroId: elegida.idLibro },
                  { onSuccess: () => setElegida(null) },
                )
              }}
            >
              Cancelar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function ReservaCard({ reserva, onCancelar }: { reserva: Reserva; onCancelar: () => void }) {
  return (
    <article className="flex gap-3 rounded-2xl border-2 border-tinta bg-white p-3 shadow-cartoon">
      <MiniPortada idLibro={reserva.idLibro} titulo={reserva.titulo} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          to="/libros/$idLibro"
          params={{ idLibro: String(reserva.idLibro) }}
          className="font-display text-xl text-verde hover:underline"
        >
          {reserva.titulo}
        </Link>
        <p className="text-sm">{reserva.codigoInventario}</p>
        <p className="text-sm">Solicitud {formatearFecha(reserva.fechaSolicitud)}</p>
        {reserva.fechaCancelacion ? (
          <p className="text-sm">Cancelación {formatearFecha(reserva.fechaCancelacion)}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <EstadoBadge estilo={badgeReserva[reserva.estado]} />
          {reserva.estado === 'Activa' ? (
            <Button type="button" size="sm" variant="outline" onClick={onCancelar}>
              Cancelar reserva
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function MiniPortada({ idLibro, titulo }: { idLibro: number; titulo: string }) {
  const libro = useLibro(idLibro)
  const [fallo, setFallo] = useState(false)
  const isbn = libro.data?.isbn.replace(/[^0-9Xx]/g, '') ?? ''

  if (!isbn || fallo) {
    return (
      <svg viewBox="0 0 64 96" role="img" aria-label={titulo} className="h-24 w-16 shrink-0 rounded-xl border-2 border-tinta">
        <rect width="64" height="96" fill="#1E3D2E" />
        <text x="32" y="50" textAnchor="middle" fill="#FEF8EC" fontFamily="Fredoka, sans-serif" fontSize="8">
          {titulo.slice(0, 18)}
        </text>
      </svg>
    )
  }

  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg?default=false`}
      alt=""
      className="h-24 w-16 shrink-0 rounded-xl border-2 border-tinta object-cover"
      onError={() => setFallo(true)}
    />
  )
}

function ListaSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-28 rounded-2xl border-2 border-tinta" />
      <Skeleton className="h-28 rounded-2xl border-2 border-tinta" />
    </div>
  )
}
