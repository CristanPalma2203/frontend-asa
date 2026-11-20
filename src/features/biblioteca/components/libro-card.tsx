import { Link } from '@tanstack/react-router'

import { PortadaTarjeta } from '@/features/biblioteca/components/portadas'
import { StockBadge } from '@/features/biblioteca/components/stock-badge'
import type { Libro } from '@/features/biblioteca/types/api'

export function LibroCard({ libro }: { libro: Libro }) {
  return (
    <Link
      to="/libros/$idLibro"
      params={{ idLibro: String(libro.idLibro) }}
      className="flex h-full gap-3 rounded-2xl border-2 border-tinta bg-white p-3 shadow-cartoon transition-transform hover:-rotate-1"
    >
      <PortadaTarjeta isbn={libro.isbn} titulo={libro.titulo} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="font-display text-xl leading-tight text-verde">{libro.titulo}</h2>
        <p className="truncate text-sm">{libro.autor}</p>
        <p className="text-xs uppercase tracking-wide text-verde/70">{libro.categoria}</p>
        <div className="mt-auto pt-2">
          <StockBadge libro={libro} />
        </div>
      </div>
    </Link>
  )
}
