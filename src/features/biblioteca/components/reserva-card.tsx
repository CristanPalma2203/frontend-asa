import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeReserva } from '@/features/biblioteca/components/estado-badge.styles'
import { MiniPortada } from '@/features/biblioteca/components/portadas'
import type { Reserva } from '@/features/biblioteca/types/api'
import { formatearFecha } from '@/lib/fechas'

export function ReservaCard({ reserva, onCancelar }: { reserva: Reserva; onCancelar: () => void }) {
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
