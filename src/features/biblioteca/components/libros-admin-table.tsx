import { Link, useNavigate } from '@tanstack/react-router'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy'

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
import type { Libro } from '@/features/biblioteca/types/api'

/** Tabla de libros del panel admin: la fila entera navega a la ficha de administración. */
export function LibrosAdminTable({
  libros,
  cargando = false,
  onEdit,
  onBaja,
}: {
  libros: Libro[]
  /** Mientras llega la consulta: cabecera real y filas con un hueco por celda. */
  cargando?: boolean
  onEdit: (libro: Libro) => void
  onBaja: (libro: Libro) => void
}) {
  const navigate = useNavigate()
  const columnas: LegacyColumnDef<Libro>[] = [
    {
      accessorKey: 'isbn',
      header: 'ISBN',
      cell: ({ row }) => (
        <span className="text-texto-2 font-mono text-[13px]">
          {row.original.isbn}
        </span>
      ),
    },
    {
      accessorKey: 'titulo',
      header: 'Título',
      cell: ({ row }) => (
        <Link
          to="/admin/libros/$idLibro"
          params={{ idLibro: String(row.original.idLibro) }}
          search={{ page: 1, pageSize: 12 }}
          className="text-tinta font-semibold underline-offset-4 hover:underline"
        >
          {row.original.titulo}
        </Link>
      ),
    },
    { accessorKey: 'autor', header: 'Autor' },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      cell: ({ row }) => (
        <span className="text-texto-3">{row.original.categoria}</span>
      ),
    },
    {
      accessorKey: 'disponibles',
      header: 'Disponibles',
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-2 font-mono text-[13px]">
          <span
            aria-hidden
            className={
              row.original.disponibles > 0
                ? 'bg-lima-400 size-2 rounded-full'
                : 'bg-texto-5 size-2 rounded-full'
            }
          />
          {row.original.disponibles}
          <span className="text-texto-4">/ {row.original.totalEjemplares}</span>
        </span>
      ),
    },
    {
      id: 'acciones',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
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
            variant="ghost"
            className="text-rojo-700 hover:bg-rojo-50"
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
  const table = useLegacyTable({
    data: libros,
    columns: columnas,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Table className="min-w-[44rem]">
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {cargando ? <FilasFantasma columnas={5} /> : null}
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            className="cursor-pointer"
            onClick={() =>
              void navigate({
                to: '/admin/libros/$idLibro',
                params: { idLibro: String(row.original.idLibro) },
                search: { page: 1, pageSize: 12 },
              })
            }
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
