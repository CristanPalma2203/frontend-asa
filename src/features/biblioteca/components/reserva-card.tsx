import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { RefObject } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Hueso } from '@/components/ui/hueso'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeReserva } from '@/features/biblioteca/components/estado-badge.styles'
import { MiniPortada } from '@/features/biblioteca/components/portadas'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import type { Reserva } from '@/features/biblioteca/types/api'
import { formatearFecha } from '@/lib/fechas'
import { cn } from '@/lib/utils'

/**
 * Fila compacta del historial: miniportada 48 px, título/autor, código mono, fechas, badge y
 * «Ver libro». Sin ticket oscuro (eso es solo de la reserva activa protagonista).
 */
export function ReservaCard({
  reserva,
  onCancelar,
}: {
  reserva: Reserva
  onCancelar: () => void
}) {
  const activa = reserva.estado === 'Activa'
  const libro = useLibro(reserva.idLibro)

  return (
    <article className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-4">
      <MiniPortada
        idLibro={reserva.idLibro}
        titulo={reserva.titulo}
        className="w-12 flex-none rounded-md"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <h3 className="text-tinta min-w-0 text-[15px] leading-snug font-semibold tracking-[-0.01em]">
            {reserva.titulo}
          </h3>
          <EstadoBadge estilo={badgeReserva[reserva.estado]} />
        </div>
        {libro.data ? (
          <p className="titulo-serif text-texto-3 truncate text-sm italic">
            {libro.data.autor}
          </p>
        ) : libro.isPending ? (
          <Hueso cargando ancho="40%" alto={12} />
        ) : null}
        <p className="text-tinta font-mono text-[13px] font-semibold">
          {reserva.codigoInventario}
        </p>
        <p className="text-texto-3 text-[12px]">
          Solicitud {formatearFecha(reserva.fechaSolicitud)}
          {reserva.fechaCancelacion ? (
            <>
              {' · '}
              Cancelación {formatearFecha(reserva.fechaCancelacion)}
            </>
          ) : null}
        </p>
      </div>
      <div className="flex flex-none flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <Link
          to="/libros/$idLibro"
          params={{ idLibro: String(reserva.idLibro) }}
          aria-label={`Ver libro: ${reserva.titulo}`}
          className={buttonVariants({ size: 'sm', variant: 'ghost' })}
        >
          Ver libro
          <ArrowRight aria-hidden />
        </Link>
        {activa ? (
          <Button type="button" size="sm" variant="ghost" onClick={onCancelar}>
            Cancelar reserva
          </Button>
        ) : null}
      </div>
    </article>
  )
}

/** Lista del historial: una sola tarjeta blanca con filas separadas por borde. */
export function ReservaHistorialLista({
  items,
  onCancelar,
  listRef,
}: {
  items: Reserva[]
  onCancelar: (reserva: Reserva) => void
  listRef?: RefObject<HTMLOListElement | null>
}) {
  return (
    <div className="bg-card border-linea shadow-card overflow-hidden rounded-2xl border">
      <ol ref={listRef} className="flex flex-col [&>li+li]:border-linea [&>li+li]:border-t">
        {items.map((reserva) => (
          <li key={reserva.idReserva} data-reserva={reserva.idReserva}>
            <ReservaCard
              reserva={reserva}
              onCancelar={() => onCancelar(reserva)}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Huecos del historial: misma tarjeta única, filas fantasma. */
export function ReservaCardFantasma({ filas = 2 }: { filas?: number }) {
  return (
    <div
      aria-hidden
      className="bg-card border-linea overflow-hidden rounded-2xl border"
    >
      {Array.from({ length: filas }, (_, i) => (
        <div
          key={i}
          className={cn(
            'border-linea flex items-center gap-4 px-4 py-3.5 sm:px-5',
            i > 0 && 'border-t',
          )}
        >
          <Hueso
            cargando
            alto={72}
            radio={6}
            llenar
            className="aspect-[2/3] w-12 shrink-0"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Hueso cargando ancho="50%" alto={14} />
            <Hueso cargando ancho="35%" alto={12} />
            <Hueso cargando ancho="25%" alto={12} />
          </div>
          <Hueso cargando ancho={64} alto={24} radio={999} />
        </div>
      ))}
    </div>
  )
}
