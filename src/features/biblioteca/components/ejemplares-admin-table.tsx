import { Button } from '@/components/ui/button'
import { FilasFantasma } from '@/components/ui/filas-fantasma'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeEjemplar } from '@/features/biblioteca/components/estado-badge.styles'
import type { EjemplarLista } from '@/features/biblioteca/types/api'

export function EjemplaresAdminTable({
  ejemplares,
  cargando = false,
  deshabilitado,
  onCambiarEstado,
  onEditar,
  onDesactivar,
}: {
  ejemplares: EjemplarLista[]
  cargando?: boolean
  deshabilitado: boolean
  onCambiarEstado: (ejemplar: EjemplarLista) => void
  onEditar?: (ejemplar: EjemplarLista) => void
  onDesactivar?: (ejemplar: EjemplarLista) => void
}) {
  return (
    <Table accionesFijas className="w-max min-w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[8rem]">Código</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cargando ? <FilasFantasma columnas={2} filas={4} /> : null}
        {ejemplares.map((item) => (
          <TableRow key={item.idEjemplar}>
            <TableCell className="text-tinta min-w-[8rem] font-mono text-[13px] font-medium whitespace-nowrap">
              {item.codigoInventario}
            </TableCell>
            <TableCell>
              <EstadoBadge estilo={badgeEjemplar[item.estado]} />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={deshabilitado}
                  onClick={() => onCambiarEstado(item)}
                >
                  {item.estado === 'Inactivo' ? 'Activar' : 'Inactivar'}
                </Button>
                {onEditar ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={deshabilitado}
                    aria-label={`Editar ${item.codigoInventario}`}
                    onClick={() => onEditar(item)}
                  >
                    Editar
                  </Button>
                ) : null}
                {onDesactivar && item.estado !== 'Inactivo' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={deshabilitado}
                    aria-label={`Desactivar ${item.codigoInventario}`}
                    className="text-rojo-800"
                    onClick={() => onDesactivar(item)}
                  >
                    Desactivar
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
