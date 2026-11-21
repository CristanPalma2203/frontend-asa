import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useRef } from 'react'

import { Hueso } from '@/components/ui/hueso'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import type { ResumenHome } from '@/features/biblioteca/hooks/use-libros'
import { useMotion } from '@/hooks/use-motion'
import { lift, reveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function HomeCategorias({
  categorias,
  cargando,
  anchoCompleto,
}: {
  categorias: ResumenHome['conteoCategorias'] | undefined
  cargando: boolean
  anchoCompleto: boolean
}) {
  const ref = useRef<HTMLUListElement>(null)
  const lista = (categorias ?? []).slice(0, anchoCompleto ? 12 : 4)
  useMotion(
    ref,
    (root) => {
      if (!lista.length) return
      reveal(root.children, { y: 16, stagger: 0.05, delay: 0.2 })
      return lift(root)
    },
    [lista.map((c) => c.categoria).join('|')],
  )

  if (!cargando && lista.length === 0) return null

  const claseGrilla = cn(
    'grid grid-cols-2 gap-x-3 gap-y-8 pt-5 lg:gap-x-4 lg:gap-y-10',
    anchoCompleto && 'sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]',
  )

  return (
    <section
      aria-labelledby="home-categorias-titulo"
      className="flex flex-col gap-6"
    >
      <h2
        id="home-categorias-titulo"
        className="text-[26px] leading-[1.05] tracking-[-0.03em] lg:text-[30px]"
      >
        Explora por <span className="titulo-serif">categoría</span>
      </h2>
      {cargando ? (
        <ul aria-label="Cargando categorías" aria-busy className={claseGrilla}>
          {Array.from({ length: anchoCompleto ? 6 : 4 }, (_, i) => (
            <li key={i}>
              <Hueso cargando alto={132} radio={22} />
            </li>
          ))}
        </ul>
      ) : (
        <ul
          ref={ref}
          aria-label="Categorías"
          data-columnas={anchoCompleto ? 'auto' : '2'}
          className={claseGrilla}
        >
          {lista.map(({ categoria, cantidad, portada }) => (
            <li key={categoria}>
              <Link
                to="/catalogo"
                search={{ page: 1, pageSize: 12, categoria }}
                data-lift
                aria-label={`Ver libros de ${categoria}`}
                className="group bg-card text-tinta shadow-card hover:shadow-card-hover focus-visible:ring-pino-800 focus-visible:ring-offset-hueso relative flex h-[132px] flex-col justify-between rounded-[22px] p-4 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-offset-2 lg:p-[22px]"
              >
                <span
                  aria-hidden
                  className="absolute -top-6 right-4 w-[52px] rotate-[8deg] lg:right-[22px] lg:w-[70px]"
                >
                  <PortadaLibro
                    isbn={portada.isbn}
                    titulo={portada.titulo}
                    className="w-full shadow-[0_18px_26px_-12px_rgb(4_44_36/0.55)]"
                  />
                </span>
                <span className="max-w-[62%] text-base leading-tight font-semibold tracking-[-0.02em] lg:text-[19px]">
                  {categoria}
                </span>
                <span className="relative z-10 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="bg-pino-800 text-papel group-hover:bg-lima-400 group-hover:text-pino-800 group-focus-visible:bg-lima-400 group-focus-visible:text-pino-800 grid size-9 flex-none place-items-center rounded-full transition-[background-color,color,translate] duration-200 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                  >
                    <ArrowRight className="size-4" strokeWidth={2.4} />
                  </span>
                  <span className="text-texto-3 text-[13px]">
                    {cantidad} {cantidad === 1 ? 'libro' : 'libros'}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
