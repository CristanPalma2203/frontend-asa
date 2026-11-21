import { Link } from '@tanstack/react-router'

import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { StockBadge } from '@/features/biblioteca/components/stock-badge'
import type { ChatLibro } from '@/features/luxia/types/chat'

export function LuxiaLibroCard({
  libro,
  onNavegar,
}: {
  libro: ChatLibro
  onNavegar: () => void
}) {
  return (
    <Link
      to="/libros/$idLibro"
      params={{ idLibro: String(libro.idLibro) }}
      className="luxia-chat__card"
      onClick={onNavegar}
    >
      <PortadaLibro
        isbn={libro.isbn}
        titulo={libro.titulo}
        tamano="S"
        className="w-10 rounded-[6px] shadow-none"
      />
      <span className="luxia-chat__card-texto">
        <span className="luxia-chat__card-titulo">{libro.titulo}</span>
        {libro.autor ? (
          <span className="luxia-chat__card-autor">{libro.autor}</span>
        ) : null}
        <span className="mt-1">
          <StockBadge disponibles={libro.disponibles} />
        </span>
      </span>
    </Link>
  )
}
