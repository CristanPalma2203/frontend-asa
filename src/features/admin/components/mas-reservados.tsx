import { Link } from '@tanstack/react-router'

import type { ResumenLibroReservado } from '@/features/admin/types/resumen'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { cn } from '@/lib/utils'

const MAX_FILAS = 5

/**
 * Ranking «Más reservados», portado de «Selling best» de Flito.
 * Hasta 5 filas; si hay menos, se reparten el alto + mini resumen abajo.
 */
export function MasReservados({
  items,
  cargando = false,
  className,
}: {
  items: ResumenLibroReservado[]
  cargando?: boolean
  className?: string
}) {
  const top = items.slice(0, MAX_FILAS)
  const max = Math.max(1, ...top.map((i) => i.reservas))
  const totalTitulos = items.length

  return (
    <section
      className={cn(
        'bg-card border-linea shadow-card flex h-full min-h-0 flex-col rounded-2xl border p-5 sm:p-6',
        className,
      )}
    >
      <div className="mb-4 shrink-0">
        <h2 className="text-lg tracking-[-0.02em]">
          Más <span className="titulo-serif">reservados</span>
        </h2>
        <p className="text-texto-3 text-sm">Top del periodo</p>
      </div>

      {cargando ? (
        <ul className="flex flex-1 flex-col gap-4" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="bg-niebla h-12 animate-pulse rounded-lg" />
          ))}
        </ul>
      ) : top.length === 0 ? (
        <p className="text-texto-3 flex flex-1 items-center justify-center py-10 text-center text-sm">
          Sin reservas en este periodo
        </p>
      ) : (
        <>
          <ol className="flex min-h-0 flex-1 flex-col justify-evenly gap-2">
            {top.map((libro, idx) => (
              <li key={libro.libroId} className="min-h-0">
                <Link
                  to="/admin/libros/$idLibro"
                  params={{ idLibro: String(libro.libroId) }}
                  search={{ page: 1, pageSize: 12 }}
                  className="focus-visible:shadow-foco group flex items-center gap-3 outline-none"
                >
                  <span className="text-texto-4 w-5 shrink-0 text-sm tabular-nums">
                    {idx + 1}
                  </span>
                  <PortadaLibro
                    isbn={libro.isbn}
                    titulo={libro.titulo}
                    tamano="S"
                    className="!size-10 !aspect-square !h-10 !w-10 shrink-0 overflow-hidden rounded-md shadow-sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-tinta group-hover:text-pino-800 block truncate text-sm font-medium transition-colors">
                      {libro.titulo}
                    </span>
                    <span className="bg-niebla mt-1.5 block h-1.5 overflow-hidden rounded-full">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(libro.reservas / max) * 100}%`,
                          background:
                            'linear-gradient(90deg, var(--color-pino-800), var(--color-lima-400))',
                        }}
                      />
                    </span>
                  </span>
                  <span className="text-tinta shrink-0 text-sm font-semibold tabular-nums">
                    {libro.reservas}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="text-texto-3 mt-4 shrink-0 text-xs">
            {totalTitulos === 1
              ? '1 título reservado en el periodo'
              : `${totalTitulos} títulos reservados en el periodo`}
          </p>
        </>
      )}
    </section>
  )
}
