import { Link } from '@tanstack/react-router'

import { Hueso } from '@/components/ui/hueso'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { StockBadge } from '@/features/biblioteca/components/stock-badge'
import type { Libro } from '@/features/biblioteca/types/api'

/**
 * Tarjeta del catálogo. Toda la tarjeta lleva a la ficha: el enlace del título se estira encima
 * (un solo elemento enfocable; el foco se ve en la tarjeta entera).
 */
export function LibroCard({ libro }: { libro: Libro }) {
  return (
    <article
      data-lift
      className="group bg-card border-linea shadow-card hover:shadow-card-hover has-focus-visible:shadow-foco relative flex h-full flex-col rounded-xl border p-3 transition-shadow duration-300"
    >
      <div className="bg-hueso flex justify-center rounded-[14px] px-6 pt-7 pb-6">
        <PortadaLibro
          isbn={libro.isbn}
          titulo={libro.titulo}
          className="w-[112px] transition-transform duration-300 group-hover:-translate-y-1"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2 pt-4 pb-2">
        <p className="eyebrow truncate">{libro.categoria}</p>
        <h2 className="text-tinta line-clamp-2 text-[17px] leading-snug tracking-[-0.02em]">
          <Link
            to="/libros/$idLibro"
            params={{ idLibro: String(libro.idLibro) }}
            className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            {libro.titulo}
          </Link>
        </h2>
        <p className="text-texto-3 truncate text-sm">{libro.autor}</p>
        <div className="mt-auto pt-3">
          <StockBadge disponibles={libro.disponibles} />
        </div>
      </div>
    </article>
  )
}

/**
 * Tarjeta mientras llega la consulta: misma forma que LibroCard; el shimmer solo está en los
 * huecos de los datos (portada, categoría, título en 2 líneas, autor al 60 % y badge).
 */
export function LibroCardFantasma() {
  return (
    <article
      aria-hidden
      data-testid="libro-card-fantasma"
      className="bg-card border-linea shadow-card relative flex h-full flex-col rounded-xl border p-3"
    >
      <div className="bg-hueso flex justify-center rounded-[14px] px-6 pt-7 pb-6">
        <Hueso cargando ancho={112} alto={168} radio={6} className="shrink-0" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-2 pt-4 pb-2">
        <Hueso cargando ancho="35%" alto={10} />
        <div
          data-testid="titulo-fantasma"
          className="flex flex-col gap-1.5 py-0.5"
        >
          <Hueso cargando alto={14} />
          <Hueso cargando ancho="70%" alto={14} />
        </div>
        <Hueso cargando ancho="60%" alto={12} />
        <div className="mt-auto pt-3">
          <Hueso cargando ancho={96} alto={24} radio={999} />
        </div>
      </div>
    </article>
  )
}
