import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

import { Hueso } from '@/components/ui/hueso'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import type { Reserva } from '@/features/biblioteca/types/api'
import { formatearFecha } from '@/lib/fechas'

/**
 * «Tu reserva activa» del Home: la más reciente, con portada, título, autor, código de ejemplar,
 * fecha y estado; si hay más, «+N más». La reserva no trae ISBN ni autor: salen del detalle
 * del libro.
 */
export function HomeReservaActiva({
  reserva,
  otras,
}: {
  reserva: Reserva
  otras: number
}) {
  const libro = useLibro(reserva.idLibro)

  return (
    <section
      aria-label="Tu reserva activa"
      className="bg-card shadow-card flex h-full flex-col gap-5 rounded-2xl p-5"
    >
      <p className="eyebrow">Tu reserva activa</p>
      <div className="flex gap-4">
        <div className="w-24 flex-none">
          {libro.isPending ? (
            <Hueso
              cargando
              alto={144}
              radio={6}
              llenar
              className="aspect-[2/3] w-full"
            />
          ) : (
            <PortadaLibro
              isbn={libro.data?.isbn ?? ''}
              titulo={reserva.titulo}
              className="w-full"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="bg-lima-400 text-pino-800 inline-flex h-6 items-center gap-1.5 self-start rounded-full px-2.5 text-xs font-semibold">
            <span aria-hidden className="bg-pino-800 size-1.5 rounded-full" />
            {reserva.estado}
          </span>
          <p className="text-tinta text-[17px] leading-tight font-semibold">
            {reserva.titulo}
          </p>
          {libro.data ? (
            <p className="text-texto-3 truncate text-sm">{libro.data.autor}</p>
          ) : null}
          <p className="text-texto-2 mt-1 text-sm">
            Tu ejemplar:{' '}
            <span className="bg-pino-950 text-lima-400 rounded-md px-1.5 py-0.5 font-mono text-[13px] font-semibold">
              {reserva.codigoInventario}
            </span>
          </p>
          <p className="text-texto-3 text-xs">
            Reservado el {formatearFecha(reserva.fechaSolicitud)}
          </p>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        {otras > 0 ? (
          <p className="text-texto-3 text-sm">
            +{otras}{' '}
            {otras === 1 ? 'reserva activa más' : 'reservas activas más'}
          </p>
        ) : null}
        <Link
          to="/mis-reservas"
          className="bg-pino-800 text-papel hover:bg-pino-850 hover:text-papel focus-visible:shadow-foco flex h-11 items-center justify-center gap-1.5 rounded-full text-sm font-semibold outline-none hover:no-underline"
        >
          Ver mis reservas
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  )
}

/** Hueco de la tarjeta mientras la consulta de reservas tarda (solo pasados ~300 ms). */
export function HomeReservaActivaCargando() {
  return (
    <div
      aria-busy
      aria-label="Cargando tu reserva"
      className="bg-card shadow-card flex h-full flex-col gap-5 rounded-2xl p-5"
    >
      <Hueso cargando ancho={110} alto={11} />
      <div className="flex gap-4">
        <Hueso cargando ancho={96} alto={144} radio={6} />
        <div className="flex flex-1 flex-col gap-2">
          <Hueso cargando ancho={64} alto={22} radio={999} />
          <Hueso cargando ancho="90%" alto={16} />
          <Hueso cargando ancho="60%" alto={13} />
        </div>
      </div>
      <Hueso cargando alto={44} radio={999} className="mt-auto" />
    </div>
  )
}
