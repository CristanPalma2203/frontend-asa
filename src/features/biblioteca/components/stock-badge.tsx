import { Badge } from '@/components/ui/badge'
import type { Libro } from '@/features/biblioteca/types/api'

export function StockBadge({ libro }: { libro: Libro }) {
  if (libro.disponibles > 0) {
    return <Badge variant="disponible">Disponible ({libro.disponibles})</Badge>
  }

  return (
    <Badge variant="outline" className="bg-muted text-verde/70">
      Sin stock
    </Badge>
  )
}
