import { Button } from '@/components/ui/button'
import { FilasFantasma } from '@/components/ui/filas-fantasma'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeEjemplar } from '@/features/biblioteca/components/estado-badge.styles'
import type { EjemplarLista } from '@/features/biblioteca/types/api'

/** Ejemplares de un libro con el botón para pasar entre Disponible e Inactivo. */
export function EjemplaresAdminTable({
  ejemplares,
  cargando = false,
  deshabilitado,
  onCambiarEstado,
}: {
  ejemplares: EjemplarLista[]
  /** Mientras llega la consulta: cabecera real y filas con un hueco por celda. */
  cargando?: boolean
  deshabilitado: boolean
  onCambiarEstado: (ejemplar: EjemplarLista) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
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
            <TableCell className="text-tinta font-mono text-[13px] font-medium">
              {item.codigoInventario}
            </TableCell>
            <TableCell>
              <EstadoBadge estilo={badgeEjemplar[item.estado]} />
            </TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={deshabilitado}
                onClick={() => onCambiarEstado(item)}
              >
                {item.estado === 'Inactivo' ? 'Activar' : 'Inactivar'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
