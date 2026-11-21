import { useNavigate } from '@tanstack/react-router'

import { FilasFantasma } from '@/components/ui/filas-fantasma'
import { Table, TableBody, TableRow } from '@/components/ui/table'
import {
  CabeceraDatos,
  CeldasDatos,
  useTablaDatos,
  type PaginacionServidor,
} from '@/components/ui/tabla-datos'
import { columnasLibrosAdmin } from '@/features/biblioteca/components/libros-admin-columnas'
import type { Libro } from '@/features/biblioteca/types/api'

export function LibrosAdminTable({
  libros,
  cargando = false,
  paginacion,
  onEdit,
  onBaja,
}: {
  libros: Libro[]
  cargando?: boolean
  paginacion?: PaginacionServidor
  onEdit: (libro: Libro) => void
  onBaja: (libro: Libro) => void
}) {
  const navigate = useNavigate()
  const tabla = useTablaDatos({
    filas: libros,
    columnas: columnasLibrosAdmin({ onEdit, onBaja }),
    paginacion,
  })

  return (
    <Table accionesFijas className="min-w-[44rem]">
      <CabeceraDatos tabla={tabla} />
      <TableBody>
        {cargando ? <FilasFantasma columnas={5} /> : null}
        {tabla.getRowModel().rows.map((fila) => (
          <TableRow
            key={fila.id}
            className="cursor-pointer"
            onClick={() =>
              void navigate({
                to: '/admin/libros/$idLibro',
                params: { idLibro: String(fila.original.idLibro) },
                search: { page: 1, pageSize: 12 },
              })
            }
          >
            <CeldasDatos fila={fila} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
