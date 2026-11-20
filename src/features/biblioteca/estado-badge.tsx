import { Badge } from '@/components/ui/badge'
import type { EstiloBadge } from '@/features/biblioteca/estados'

export function EstadoBadge({ estilo }: { estilo: EstiloBadge }) {
  return (
    <Badge variant={estilo.variant} className={estilo.className}>
      {estilo.etiqueta}
    </Badge>
  )
}
