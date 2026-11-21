import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import type { ResumenLibroPorAgotarse } from '@/features/admin/types/resumen'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PORTADA =
  '!size-10 !aspect-square !h-10 !w-10 max-h-10 max-w-10 shrink-0 overflow-hidden rounded-md shadow-sm [&_*]:!text-[9px] [&_*]:leading-tight'

/**
 * Lista «Por agotarse», portado de «Running out» de Flito.
 * Grilla 2 cols; miniportada fija 40 px (mismo fallback para todos).
 */
export function PorAgotarse({
  items,
  cargando = false,
  className,
}: {
  items: ResumenLibroPorAgotarse[]
  cargando?: boolean
  className?: string
}) {
  return (
    <section
      className={cn(
        'bg-card border-linea shadow-card rounded-2xl border p-5 sm:p-6',
        className,
      )}
    >
      <div className="mb-5">
        <h2 className="text-lg tracking-[-0.02em]">
          Por <span className="titulo-serif">agotarse</span>
        </h2>
        <p className="text-texto-3 text-sm">Stock bajo o cero</p>
      </div>

      {cargando ? (
        <ul className="grid gap-3 sm:grid-cols-2" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="bg-niebla h-14 animate-pulse rounded-lg" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-texto-3 py-10 text-center text-sm">
          Ningún título cerca de agotarse
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((libro) => {
            const agotado = libro.disponibles === 0
            return (
              <li
                key={libro.libroId}
                className="flex items-center gap-3"
              >
                <PortadaLibro
                  isbn={libro.isbn}
                  titulo={libro.titulo}
                  tamano="S"
                  className={PORTADA}
                />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/admin/libros/$idLibro"
                    params={{ idLibro: String(libro.libroId) }}
                    search={{ page: 1, pageSize: 12 }}
                    className="text-tinta hover:text-pino-800 focus-visible:shadow-foco block truncate text-sm font-medium outline-none transition-colors"
                  >
                    {libro.titulo}
                  </Link>
                  <span
                    className={cn(
                      'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                      agotado
                        ? 'bg-rojo-100 text-rojo-800'
                        : 'bg-ambar-100 text-ambar-800',
                    )}
                  >
                    {agotado ? 'Agotado' : 'Queda 1'}
                  </span>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1"
                >
                  <Link
                    to="/admin/libros/$idLibro"
                    params={{ idLibro: String(libro.libroId) }}
                    search={{ page: 1, pageSize: 12 }}
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Ejemplar
                  </Link>
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
