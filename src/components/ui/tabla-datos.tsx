import {
  createColumnHelper,
  flexRender,
  rowPaginationFeature,
  tableFeatures,
  useTable,
  type RowData,
} from '@tanstack/react-table'

import {
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const funcionesTabla = tableFeatures({ rowPaginationFeature })

export type FuncionesTabla = typeof funcionesTabla

export function ayudanteColumnas<TFila extends RowData>() {
  return createColumnHelper<FuncionesTabla, TFila>()
}

export type ColumnasTabla<TFila extends RowData> = ReturnType<
  ReturnType<typeof ayudanteColumnas<TFila>>['columns']
>

export type PaginacionServidor = {
  page: number
  pageSize: number
  total: number
}

export function useTablaDatos<TFila extends RowData>({
  filas,
  columnas,
  paginacion,
}: {
  filas: TFila[]
  columnas: ColumnasTabla<TFila>
  paginacion?: PaginacionServidor
}) {
  return useTable<FuncionesTabla, TFila>({
    features: funcionesTabla,
    data: filas,
    columns: columnas,
    manualPagination: true,
    rowCount: paginacion?.total ?? filas.length,
    state: {
      pagination: {
        pageIndex: (paginacion?.page ?? 1) - 1,
        pageSize: paginacion?.pageSize ?? Math.max(filas.length, 1),
      },
    },
  })
}

type TablaDatos<TFila extends RowData> = ReturnType<typeof useTablaDatos<TFila>>
type FilaDatos<TFila extends RowData> = ReturnType<
  TablaDatos<TFila>['getRowModel']
>['rows'][number]

export type ClasesColumnas = Partial<
  Record<string, { cabecera?: string; celda?: string }>
>

export function CabeceraDatos<TFila extends RowData>({
  tabla,
  clases = {},
}: {
  tabla: TablaDatos<TFila>
  clases?: ClasesColumnas
}) {
  return (
    <TableHeader>
      {tabla.getHeaderGroups().map((grupo) => (
        <TableRow key={grupo.id}>
          {grupo.headers.map((cabecera) => (
            <TableHead
              key={cabecera.id}
              className={clases[cabecera.column.id]?.cabecera}
            >
              {flexRender(
                cabecera.column.columnDef.header,
                cabecera.getContext(),
              )}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  )
}

export function CeldasDatos<TFila extends RowData>({
  fila,
  clases = {},
}: {
  fila: FilaDatos<TFila>
  clases?: ClasesColumnas
}) {
  return fila.getAllCells().map((celda) => (
    <TableCell key={celda.id} className={clases[celda.column.id]?.celda}>
      {flexRender(celda.column.columnDef.cell, celda.getContext())}
    </TableCell>
  ))
}
