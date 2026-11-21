import { Button } from '@/components/ui/button'
import {
  ayudanteColumnas,
  type ClasesColumnas,
} from '@/components/ui/tabla-datos'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeEjemplar } from '@/features/biblioteca/components/estado-badge.styles'
import type { EjemplarLista } from '@/features/biblioteca/types/api'

const columna = ayudanteColumnas<EjemplarLista>()

export const clasesEjemplaresAdmin: ClasesColumnas = {
  codigoInventario: {
    cabecera: 'min-w-[8rem]',
    celda:
      'text-tinta min-w-[8rem] font-mono text-[13px] font-medium whitespace-nowrap',
  },
  acciones: { celda: 'text-right' },
}

export function columnasEjemplaresAdmin({
  deshabilitado,
  onCambiarEstado,
  onEditar,
}: {
  deshabilitado: boolean
  onCambiarEstado: (ejemplar: EjemplarLista) => void
  onEditar?: (ejemplar: EjemplarLista) => void
}) {
  return columna.columns([
    columna.accessor('codigoInventario', {
      header: 'Código',
      cell: ({ getValue }) => getValue(),
    }),
    columna.accessor('estado', {
      header: 'Estado',
      cell: ({ getValue }) => (
        <EstadoBadge estilo={badgeEjemplar[getValue()]} />
      ),
    }),
    columna.display({
      id: 'acciones',
      header: () => <span className="sr-only">Acciones</span>,
      cell: ({ row }) => {
        const ejemplar = row.original
        return (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={deshabilitado}
              onClick={() => onCambiarEstado(ejemplar)}
            >
              {ejemplar.estado === 'Inactivo' ? 'Activar' : 'Inactivar'}
            </Button>
            {onEditar ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={deshabilitado}
                aria-label={`Editar ${ejemplar.codigoInventario}`}
                onClick={() => onEditar(ejemplar)}
              >
                Editar
              </Button>
            ) : null}
          </div>
        )
      },
    }),
  ])
}
