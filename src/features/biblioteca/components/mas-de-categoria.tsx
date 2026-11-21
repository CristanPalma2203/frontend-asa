import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useId, useRef } from 'react'

import { Hueso } from '@/components/ui/hueso'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { textoDisponibles } from '@/features/biblioteca/disponibilidad'
import {
  MAS_DE_CATEGORIA,
  useMasDeCategoria,
} from '@/features/biblioteca/hooks/use-libros'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn, lift } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Otros libros de la misma categoría (sin el actual, máximo 6), cada uno con enlace directo a su
 * ficha. Si no hay otros, la sección no aparece.
 */
export function MasDeCategoria({
  categoria,
  idActual,
}: {
  categoria: string
  idActual: number
}) {
  const libros = useMasDeCategoria(categoria, idActual)
  const ref = useRef<HTMLUListElement>(null)
  const id = useId()
  const items = libros.data ?? []

  useMotion(
    ref,
    (root) => {
      if (!items.length) return
      cardsIn(root.children, { stagger: 0.05 })
      return lift(root)
    },
    [items.map((libro) => libro.idLibro).join(',')],
  )

  if (libros.isError || (libros.isSuccess && items.length === 0)) return null

  return (
    <section
      data-m="seccion"
      aria-labelledby={`${id}-titulo`}
      className="flex flex-col gap-5 md:gap-7"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id={`${id}-titulo`}
          className="text-[24px] leading-[1.05] md:text-[34px]"
        >
          Más de esta <span className="titulo-serif">categoría</span>
        </h2>
        <Link
          to="/catalogo"
          search={{ page: 1, pageSize: 12, categoria }}
          className="text-pino-800 inline-flex flex-none items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Ver todo en {categoria}
          <ArrowRight aria-hidden className="size-3.5" strokeWidth={2.2} />
        </Link>
      </div>

      <ul
        ref={ref}
        aria-label={`Más libros de ${categoria}`}
        aria-busy={libros.isPending || undefined}
        className={cn(
          'tira-sin-barra -mx-5 -mt-3 flex snap-x gap-3 overflow-x-auto overflow-y-hidden px-5 pt-3 pb-4',
          'md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-6',
        )}
      >
        {libros.isPending
          ? Array.from({ length: MAS_DE_CATEGORIA }, (_, i) => (
              <li
                key={i}
                aria-hidden
                className="flex w-28 flex-none flex-col gap-2.5 md:w-auto"
              >
                <Hueso
                  cargando
                  alto={168}
                  radio={6}
                  llenar
                  className="aspect-[2/3] w-full"
                />
                <Hueso cargando ancho="80%" alto={13} />
              </li>
            ))
          : items.map((libro) => (
              <li
                key={libro.idLibro}
                className="w-28 flex-none snap-start md:w-auto"
              >
                <Link
                  to="/libros/$idLibro"
                  params={{ idLibro: String(libro.idLibro) }}
                  data-lift
                  aria-label={`${libro.titulo}, ${textoDisponibles(libro.disponibles)}`}
                  className="group text-tinta focus-visible:shadow-foco flex flex-col gap-3 rounded-lg outline-none hover:no-underline"
                >
                  <span className="relative block">
                    <PortadaLibro
                      isbn={libro.isbn}
                      titulo={libro.titulo}
                      className="w-full"
                    />
                    <span
                      className={cn(
                        'absolute top-2 left-2 inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold shadow-[0_2px_6px_rgb(0_0_0/0.18)]',
                        libro.disponibles > 0
                          ? 'bg-lima-400 text-pino-800'
                          : 'bg-niebla text-texto-3',
                      )}
                    >
                      {libro.disponibles > 0 ? (
                        <span
                          aria-hidden
                          className="bg-pino-800 size-[5px] rounded-full"
                        />
                      ) : null}
                      {textoDisponibles(libro.disponibles)}
                    </span>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="line-clamp-2 text-[13px] leading-snug font-semibold md:text-sm">
                      {libro.titulo}
                    </span>
                    <span className="text-texto-3 hidden truncate text-[13px] md:block">
                      {libro.autor}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  )
}
