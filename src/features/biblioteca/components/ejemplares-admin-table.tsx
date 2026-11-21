import { FilasFantasma } from '@/components/ui/filas-fantasma'
import { Table, TableBody, TableRow } from '@/components/ui/table'
import {
  CabeceraDatos,
  CeldasDatos,
  useTablaDatos,
} from '@/components/ui/tabla-datos'
import {
  clasesEjemplaresAdmin,
  columnasEjemplaresAdmin,
} from '@/features/biblioteca/components/ejemplares-admin-columnas'
import type { EjemplarLista } from '@/features/biblioteca/types/api'

export function EjemplaresAdminTable({
  ejemplares,
  cargando = false,
  deshabilitado,
  onCambiarEstado,
  onEditar,
}: {
  ejemplares: EjemplarLista[]
  cargando?: boolean
  deshabilitado: boolean
  onCambiarEstado: (ejemplar: EjemplarLista) => void
  onEditar?: (ejemplar: EjemplarLista) => void
}) {
  const tabla = useTablaDatos({
    filas: ejemplares,
    columnas: columnasEjemplaresAdmin({
      deshabilitado,
      onCambiarEstado,
      onEditar,
    }),
  })

  return (
    <Table accionesFijas className="w-max min-w-full">
      <CabeceraDatos tabla={tabla} clases={clasesEjemplaresAdmin} />
      <TableBody>
        {cargando ? <FilasFantasma columnas={2} filas={4} /> : null}
        {tabla.getRowModel().rows.map((fila) => (
          <TableRow key={fila.id}>
            <CeldasDatos fila={fila} clases={clasesEjemplaresAdmin} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
