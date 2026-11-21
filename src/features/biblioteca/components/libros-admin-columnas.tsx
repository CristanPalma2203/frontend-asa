import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { ayudanteColumnas } from '@/components/ui/tabla-datos'
import type { Libro } from '@/features/biblioteca/types/api'

const columna = ayudanteColumnas<Libro>()

export function columnasLibrosAdmin({
  onEdit,
  onBaja,
}: {
  onEdit: (libro: Libro) => void
  onBaja: (libro: Libro) => void
}) {
  return columna.columns([
    columna.accessor('isbn', {
      header: 'ISBN',
      cell: ({ getValue }) => (
        <span className="text-texto-2 font-mono text-[13px]">{getValue()}</span>
      ),
    }),
    columna.accessor('titulo', {
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
    }),
    columna.accessor('autor', {
      header: 'Autor',
      cell: ({ getValue }) => getValue(),
    }),
    columna.accessor('categoria', {
      header: 'Categoría',
      cell: ({ getValue }) => (
        <span className="text-texto-3">{getValue()}</span>
      ),
    }),
    columna.accessor('disponibles', {
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
    }),
    columna.display({
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
    }),
  ])
}
