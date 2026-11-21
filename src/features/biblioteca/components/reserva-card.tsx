import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Hueso } from '@/components/ui/hueso'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeReserva } from '@/features/biblioteca/components/estado-badge.styles'
import { MiniPortada } from '@/features/biblioteca/components/portadas'
import type { Reserva } from '@/features/biblioteca/types/api'
import { formatearFecha } from '@/lib/fechas'
import { cn } from '@/lib/utils'

/** Reserva como punto de una línea de tiempo: el `<li>` padre dibuja el riel. */
export function ReservaCard({
  reserva,
  onCancelar,
}: {
  reserva: Reserva
  onCancelar: () => void
}) {
  const activa = reserva.estado === 'Activa'

  return (
    <article className="relative pl-9">
      <span
        aria-hidden
        className={cn(
          'absolute top-7 left-[5px] size-3 rounded-full ring-4 ring-[var(--color-hueso)]',
          activa
            ? 'bg-lima-400 shadow-[0_0_0_7px_var(--color-lima-wash)]'
            : 'bg-separador',
        )}
      />
      <div
        className={cn(
          'bg-card border-linea flex gap-4 rounded-xl border p-4 transition-shadow sm:p-5',
          activa ? 'shadow-card hover:shadow-card-hover' : '',
        )}
      >
        <MiniPortada idLibro={reserva.idLibro} titulo={reserva.titulo} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
            <Link
              to="/libros/$idLibro"
              params={{ idLibro: String(reserva.idLibro) }}
              className="text-tinta min-w-0 text-[17px] leading-snug font-semibold tracking-[-0.02em] underline-offset-4 hover:underline"
            >
              {reserva.titulo}
            </Link>
            <EstadoBadge estilo={badgeReserva[reserva.estado]} />
          </div>
          <p className="text-texto-2 font-mono text-[13px]">
            {reserva.codigoInventario}
          </p>
          <p className="text-texto-3 text-[13px]">
            Solicitud {formatearFecha(reserva.fechaSolicitud)}
          </p>
          {reserva.fechaCancelacion ? (
            <p className="text-texto-3 text-[13px]">
              Cancelación {formatearFecha(reserva.fechaCancelacion)}
            </p>
          ) : null}
          {activa ? (
            <div className="mt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onCancelar}
              >
                Cancelar reserva
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/** Reserva mientras carga la lista: misma forma que ReservaCard, huecos en los datos. */
export function ReservaCardFantasma() {
  return (
    <article aria-hidden className="relative pl-9">
      <span className="bg-separador absolute top-7 left-[5px] size-3 rounded-full ring-4 ring-[var(--color-hueso)]" />
      <div className="bg-card border-linea flex gap-4 rounded-xl border p-4 sm:p-5">
        <Hueso cargando ancho={56} alto={84} radio={6} className="shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <Hueso cargando ancho="55%" alto={18} />
            <Hueso cargando ancho={64} alto={24} radio={999} />
          </div>
          <Hueso cargando ancho="30%" alto={12} />
          <Hueso cargando ancho="45%" alto={12} />
        </div>
      </div>
    </article>
  )
}
