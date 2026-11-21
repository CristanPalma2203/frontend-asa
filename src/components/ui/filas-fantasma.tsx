import { Hueso } from '@/components/ui/hueso'
import { TableCell, TableRow } from '@/components/ui/table'

const COL_WIDTHS = ['72%', '58%', '46%', '64%', '40%', '52%']

export function FilasFantasma({
  columnas,
  filas = 8,
  acciones = true,
}: {
  columnas: number
  filas?: number
  acciones?: boolean
}) {
  return (
    <>
      {Array.from({ length: filas }, (_, fila) => (
        <TableRow
          key={fila}
          aria-hidden
          data-testid="fila-fantasma"
          className="hover:bg-transparent"
        >
          {Array.from({ length: columnas }, (_, col) => (
            <TableCell key={col}>
              <Hueso
                cargando
                ancho={COL_WIDTHS[col % COL_WIDTHS.length]}
                alto={12}
              />
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
