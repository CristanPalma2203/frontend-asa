import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Hueso } from '@/components/ui/hueso'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeReserva } from '@/features/biblioteca/components/estado-badge.styles'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import type { Reserva } from '@/features/biblioteca/types/api'
import { formatearFecha } from '@/lib/fechas'

/**
 * Reserva activa protagonista: portada, título, autor en serif itálica, badge Activa y ticket
 * del ejemplar (código + fecha de solicitud reales). En móvil el ticket va debajo de la info.
 */
export function ReservaActivaCard({
  reserva,
  onCancelar,
}: {
  reserva: Reserva
  onCancelar: () => void
}) {
  const libro = useLibro(reserva.idLibro)

  return (
    <article
      data-reserva={reserva.idReserva}
      className="bg-card border-linea shadow-card flex h-full flex-col gap-5 rounded-2xl border p-5 sm:p-6"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
        <div className="w-28 flex-none sm:w-32">
          {libro.isPending ? (
            <Hueso
              cargando
              alto={168}
              radio={8}
              llenar
              className="aspect-[2/3] w-full"
            />
          ) : (
            <PortadaLibro
              isbn={libro.data?.isbn ?? ''}
              titulo={reserva.titulo}
              className="w-full rounded-lg"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <EstadoBadge estilo={badgeReserva.Activa} />
          <div className="flex flex-col gap-1">
            <h2 className="text-tinta text-2xl leading-tight font-semibold tracking-[-0.03em] sm:text-[28px]">
              {reserva.titulo}
            </h2>
            {libro.data ? (
              <p className="titulo-serif text-texto-3 text-lg italic">
                {libro.data.autor}
              </p>
            ) : libro.isPending ? (
              <Hueso cargando ancho="40%" alto={18} />
            ) : null}
          </div>

          {/* Ticket: debajo de la info en móvil (columna); en sm+ sigue bajo el autor. */}
          <div className="bg-pino-950 mt-1 flex flex-col gap-2 rounded-xl p-4">
            <p className="text-[11px] font-semibold tracking-[0.12em] text-white/50 uppercase">
              Tu ejemplar
            </p>
            <p className="text-lima-400 self-start font-mono text-lg font-semibold tracking-[0.02em]">
              {reserva.codigoInventario}
            </p>
            <p className="text-sm text-white/70">
              Solicitud {formatearFecha(reserva.fechaSolicitud)}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            <Link
              to="/libros/$idLibro"
              params={{ idLibro: String(reserva.idLibro) }}
              aria-label={`Ver libro: ${reserva.titulo}`}
              className={buttonVariants({ size: 'sm' })}
            >
              Ver libro
              <ArrowRight aria-hidden />
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCancelar}
            >
              Cancelar reserva
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ReservaActivaCardFantasma() {
  return (
    <article
      aria-hidden
      className="bg-card border-linea flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:gap-6 sm:p-6"
    >
      <Hueso
        cargando
        alto={168}
        radio={8}
        llenar
        className="aspect-[2/3] w-28 shrink-0 sm:w-32"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Hueso cargando ancho={72} alto={24} radio={999} />
        <Hueso cargando ancho="70%" alto={28} />
        <Hueso cargando ancho="45%" alto={18} />
        <Hueso cargando alto={96} radio={12} className="mt-1" />
      </div>
    </article>
  )
}
