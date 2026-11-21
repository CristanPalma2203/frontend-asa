import { Fragment } from 'react'

import { FilasFantasma } from '@/components/ui/filas-fantasma'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import {
  CabeceraDatos,
  CeldasDatos,
  useTablaDatos,
  type PaginacionServidor,
} from '@/components/ui/tabla-datos'
import {
  clasesLectores,
  columnasLectores,
} from '@/features/biblioteca/components/lectores-columnas'
import type { Lector, LectorLista } from '@/features/biblioteca/types/api'
import { cn } from '@/lib/utils'

export function LectoresTable({
  lectores,
  cargando = false,
  paginacion,
  abiertoId,
  detalle,
  cargandoDetalle,
  onEdit,
  onToggle,
}: {
  lectores: LectorLista[]
  cargando?: boolean
  paginacion?: PaginacionServidor
  abiertoId: number | null
  detalle: Lector | undefined
  cargandoDetalle: boolean
  onEdit: (lector: LectorLista) => void
  onToggle: (lector: LectorLista) => void
}) {
  const tabla = useTablaDatos({
    filas: lectores,
    columnas: columnasLectores({ abiertoId, onEdit, onToggle }),
    paginacion,
  })
  const totalColumnas = tabla.getAllLeafColumns().length

  return (
    <Table accionesFijas className="min-w-[44rem]">
      <CabeceraDatos tabla={tabla} clases={clasesLectores} />
      <TableBody>
        {cargando ? <FilasFantasma columnas={4} /> : null}
        {tabla.getRowModel().rows.map((fila) => {
          const abierto = abiertoId === fila.original.idLector
          return (
            <Fragment key={fila.id}>
              <TableRow
                data-resaltada={abierto || undefined}
                className={cn(abierto && 'bg-lima-wash/60')}
              >
                <CeldasDatos fila={fila} clases={clasesLectores} />
              </TableRow>
              {abierto ? (
                <TableRow
                  data-sin-hover
                  className="bg-hueso-claro hover:bg-hueso-claro"
                >
                  <TableCell
                    colSpan={totalColumnas}
                    className="text-texto-2 text-sm"
                  >
                    {cargandoDetalle ? 'Cargando…' : null}
                    {detalle ? (
                      <span className="inline-flex items-center gap-2">
                        Reservas activas:
                        <span className="text-tinta font-mono font-semibold">
                          {detalle.reservasActivas}
                        </span>
                      </span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}
