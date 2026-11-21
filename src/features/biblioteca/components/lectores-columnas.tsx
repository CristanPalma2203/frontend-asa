import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  ayudanteColumnas,
  type ClasesColumnas,
} from '@/components/ui/tabla-datos'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeLector } from '@/features/biblioteca/components/estado-badge.styles'
import type { LectorLista } from '@/features/biblioteca/types/api'
import { cn } from '@/lib/utils'

const columna = ayudanteColumnas<LectorLista>()

export const clasesLectores: ClasesColumnas = {
  identificador: { celda: 'text-texto-2 font-mono text-[13px]' },
  nombre: { celda: 'text-tinta font-semibold' },
  correo: { celda: 'text-texto-3' },
}

export function columnasLectores({
  abiertoId,
  onEdit,
  onToggle,
}: {
  abiertoId: number | null
  onEdit: (lector: LectorLista) => void
  onToggle: (lector: LectorLista) => void
}) {
  return columna.columns([
    columna.accessor('identificador', {
      header: 'Identificador',
      cell: ({ getValue }) => getValue(),
    }),
    columna.accessor('nombre', {
      header: 'Nombre',
      cell: ({ getValue }) => getValue(),
    }),
    columna.accessor('correo', {
      header: 'Correo',
      cell: ({ getValue }) => getValue(),
    }),
    columna.accessor('estado', {
      header: 'Estado',
      cell: ({ getValue }) => <EstadoBadge estilo={badgeLector[getValue()]} />,
    }),
    columna.display({
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const abierto = abiertoId === row.original.idLector
        return (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onEdit(row.original)}
            >
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-expanded={abierto}
              onClick={() => onToggle(row.original)}
            >
              Reservas
              <ChevronDown
                aria-hidden
                className={cn('transition-transform', abierto && 'rotate-180')}
              />
            </Button>
          </div>
        )
      },
    }),
  ])
}
