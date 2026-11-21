import { Hueso } from '@/components/ui/hueso'
import { TableCell, TableRow } from '@/components/ui/table'

/** Anchos de los huecos por columna, los de COL_WIDTHS de Corelux (components/Skeleton.js). */
const COL_WIDTHS = ['72%', '58%', '46%', '64%', '40%', '52%']

/**
 * Filas de una tabla mientras llega la consulta. La tabla y su cabecera ya están pintadas; aquí
 * solo hay un hueco por celda y, en la columna de acciones, dos huecos de 28 × 28.
 */
export function FilasFantasma({
  columnas,
  filas = 8,
  acciones = true,
}: {
  /** Columnas de datos (sin contar la de acciones). */
  columnas: number
  filas?: number
  acciones?: boolean
}) {
  return (
    <>
      {Array.from({ length: filas }, (_, fila) => (
        <TableRow key={fila} aria-hidden data-testid="fila-fantasma" className="hover:bg-transparent">
          {Array.from({ length: columnas }, (_, col) => (
            <TableCell key={col}>
              <Hueso cargando ancho={COL_WIDTHS[col % COL_WIDTHS.length]} alto={12} />
            </TableCell>
          ))}
          {acciones ? (
            <TableCell>
              <div className="flex justify-end gap-2">
                <Hueso cargando ancho={28} alto={28} radio={8} />
                <Hueso cargando ancho={28} alto={28} radio={8} />
              </div>
            </TableCell>
          ) : null}
        </TableRow>
      ))}
    </>
  )
}
