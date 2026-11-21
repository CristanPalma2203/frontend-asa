import { Badge } from '@/components/ui/badge'
import { textoDisponibles } from '@/features/biblioteca/disponibilidad'

/** Disponibilidad de un libro: lima con stock, neutro sin stock. */
export function StockBadge({ disponibles }: { disponibles: number }) {
  if (disponibles > 0) {
    return (
      <Badge variant="disponible">
        <span aria-hidden className="bg-pino-800 size-1.5 rounded-full" />
        {textoDisponibles(disponibles)}
      </Badge>
    )
  }

  return (
    <Badge variant="outline">
      <span aria-hidden className="bg-texto-5 size-1.5 rounded-full" />
      Sin stock
    </Badge>
  )
}
