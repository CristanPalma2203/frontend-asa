import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { Hueso } from '@/components/ui/hueso'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { textoDisponibles } from '@/features/biblioteca/disponibilidad'
import { useResumenHome } from '@/features/biblioteca/hooks/use-libros'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn, lift } from '@/lib/motion'
import { cn } from '@/lib/utils'

const MIN_PORTADA = 150
const GAP = 24
const EN_MOVIL = 6

export function MisReservasExplorar() {
  const recomendados = useResumenHome()
  const candidatos = recomendados.data?.destacados ?? []
  const cargando = recomendados.isPending
  const ref = useRef<HTMLUListElement>(null)
  const [porFila, setPorFila] = useState(EN_MOVIL)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => {
      if (getComputedStyle(el).display !== 'grid') {
        setPorFila(EN_MOVIL)
        return
      }
      const columnas = Math.floor((el.clientWidth + GAP) / (MIN_PORTADA + GAP))
      setPorFila(Math.max(1, columnas))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [cargando])

  const lista = candidatos.slice(0, Math.min(12, porFila))

  useMotion(
    ref,
    (root) => {
      if (!lista.length && !cargando) return
      cardsIn(root.children, { stagger: 0.05, delay: 0.08 })
      return lift(root)
    },
    [lista.map((l) => l.idLibro).join(','), cargando],
  )

  if (!cargando && candidatos.length === 0) return null

  const claseLista =
    'tira-sin-barra -mx-4 flex snap-x gap-4 overflow-x-auto overflow-y-hidden px-4 pt-2 pb-4 sm:mx-0 sm:grid sm:w-full sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:gap-6 sm:overflow-visible sm:p-0'

  if (cargando) {
    return (
      <section
        aria-labelledby="sigue-explorando"
        className="flex w-full flex-col gap-4"
      >
        <h2
          id="sigue-explorando"
          className="text-xl leading-tight tracking-[-0.02em]"
        >
          Sigue <span className="titulo-serif">explorando</span>
        </h2>
        <ul
          ref={ref}
          aria-label="Cargando libros recomendados"
          aria-busy
          className={claseLista}
        >
          {Array.from({ length: porFila }, (_, i) => (
            <li
              key={i}
              className="flex w-[140px] flex-none flex-col gap-2.5 sm:w-auto"
            >
              <Hueso
                cargando
                alto={210}
                radio={8}
                llenar
                className="aspect-[2/3] w-full"
              />
              <Hueso cargando ancho="85%" alto={14} />
              <Hueso cargando ancho="55%" alto={12} />
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="sigue-explorando"
      className="flex w-full flex-col gap-4"
    >
      <h2
        id="sigue-explorando"
        className="text-xl leading-tight tracking-[-0.02em]"
      >
        Sigue <span className="titulo-serif">explorando</span>
      </h2>
      <ul ref={ref} aria-label="Libros recomendados" className={claseLista}>
        {lista.map((libro) => (
          <li
            key={libro.idLibro}
            className="w-[140px] flex-none snap-start sm:w-auto"
          >
            <Link
              to="/libros/$idLibro"
              params={{ idLibro: String(libro.idLibro) }}
              data-lift
              aria-label={`${libro.titulo}, ${libro.disponibles > 0 ? textoDisponibles(libro.disponibles) : 'agotado'}`}
              className="group text-tinta focus-visible:shadow-foco flex flex-col gap-2.5 rounded-lg outline-none hover:no-underline"
            >
              <span className="relative block">
                <PortadaLibro
                  isbn={libro.isbn}
                  titulo={libro.titulo}
                  className="w-full rounded-lg shadow-[0_2px_4px_rgb(0_0_0/0.1),0_24px_36px_-18px_rgb(0_0_0/0.45)]"
                />
                <span
                  className={cn(
                    'absolute top-2 left-2 inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold shadow-[0_2px_6px_rgb(0_0_0/0.2)]',
                    libro.disponibles > 0
                      ? 'bg-lima-400 text-pino-800'
                      : 'bg-niebla text-texto-2',
                  )}
                >
                  {libro.disponibles > 0 ? (
                    <span
                      aria-hidden
                      className="bg-pino-800 size-[5px] rounded-full"
                    />
                  ) : null}
                  {libro.disponibles > 0
                    ? textoDisponibles(libro.disponibles)
                    : 'Agotado'}
                </span>
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="line-clamp-2 text-[14px] leading-snug font-semibold">
                  {libro.titulo}
                </span>
                <span className="text-texto-3 truncate text-[13px]">
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
