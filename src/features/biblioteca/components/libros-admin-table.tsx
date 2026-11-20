import { Link, useNavigate } from '@tanstack/react-router'
import { flexRender } from '@tanstack/react-table'
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from '@tanstack/react-table/legacy'

import { Button } from '@/components/ui/button'
import type { Libro } from '@/features/biblioteca/types/api'

/** Tabla de libros del panel admin: la fila entera navega a la ficha de administración. */
export function LibrosAdminTable({
  libros,
  onEdit,
  onBaja,
}: {
  libros: Libro[]
  onEdit: (libro: Libro) => void
  onBaja: (libro: Libro) => void
}) {
  const navigate = useNavigate()
  const columnas: LegacyColumnDef<Libro>[] = [
    { accessorKey: 'isbn', header: 'ISBN' },
    {
      accessorKey: 'titulo',
      header: 'Título',
      cell: ({ row }) => (
        <Link
          to="/admin/libros/$idLibro"
          params={{ idLibro: String(row.original.idLibro) }}
          search={{ page: 1, pageSize: 12 }}
          className="font-display text-verde underline-offset-2 hover:underline"
        >
          {row.original.titulo}
        </Link>
      ),
    },
    { accessorKey: 'autor', header: 'Autor' },
    { accessorKey: 'categoria', header: 'Categoría' },
    { accessorKey: 'disponibles', header: 'Disponibles' },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(row.original)
            }}
          >
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={(event) => {
              event.stopPropagation()
              onBaja(row.original)
            }}
          >
            Desactivar
          </Button>
        </div>
      ),
    },
  ]
  const table = useLegacyTable({ data: libros, columns: columnas, getCoreRowModel: getCoreRowModel() })

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b-2 border-tinta">
              {group.headers.map((header) => (
                <th key={header.id} className="px-2 py-2 font-display text-verde">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer border-b border-tinta/20 hover:bg-lima/20"
              onClick={() =>
                void navigate({
                  to: '/admin/libros/$idLibro',
                  params: { idLibro: String(row.original.idLibro) },
                  search: { page: 1, pageSize: 12 },
                })
              }
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-2">
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
