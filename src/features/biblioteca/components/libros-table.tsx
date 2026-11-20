import { Link } from '@tanstack/react-router'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy'

import { StockBadge } from '@/features/biblioteca/components/stock-badge'
import type { Libro } from '@/features/biblioteca/types/api'

const columnas: LegacyColumnDef<Libro>[] = [
  {
    accessorKey: 'titulo',
    header: 'Título',
    cell: ({ row }) => (
      <Link
        to="/libros/$idLibro"
        params={{ idLibro: String(row.original.idLibro) }}
        className="font-display text-base text-verde underline-offset-2 hover:underline"
      >
        {row.original.titulo}
      </Link>
    ),
  },
  { accessorKey: 'autor', header: 'Autor' },
  { accessorKey: 'categoria', header: 'Categoría' },
  {
    id: 'stock',
    header: 'Stock',
    cell: ({ row }) => <StockBadge libro={row.original} />,
  },
]

/** Vista de tabla del catálogo público. */
export function LibrosTable({ libros }: { libros: Libro[] }) {
  const table = useLegacyTable({
    data: libros,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-tinta bg-white shadow-cartoon">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b-2 border-tinta bg-lima/40">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th key={header.id} className="px-3 py-3 font-display text-verde">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-tinta/30 last:border-0">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
