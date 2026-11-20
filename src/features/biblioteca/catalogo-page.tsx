import { Link } from '@tanstack/react-router'
import { flexRender } from '@tanstack/react-table'
import {
  getCoreRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy'
import { useEffect, useState } from 'react'

import heroBlobs from '@/assets/hero-blobs.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError } from '@/lib/api/client'
import { useLibros } from '@/features/biblioteca/hooks'
import type { Libro } from '@/features/biblioteca/types'
import { Route } from '@/routes/catalogo'

const vistaKey = 'asa-catalogo-vista'

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

export function CatalogoPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [buscar, setBuscar] = useState(search.buscar ?? '')
  const [categoria, setCategoria] = useState(search.categoria ?? '')
  const [urlBuscar, setUrlBuscar] = useState(search.buscar)
  const [urlCategoria, setUrlCategoria] = useState(search.categoria)
  const [vista, setVista] = useState<'tarjetas' | 'tabla'>(leerVista)

  if (search.buscar !== urlBuscar) {
    setUrlBuscar(search.buscar)
    setBuscar(search.buscar ?? '')
  }

  if (search.categoria !== urlCategoria) {
    setUrlCategoria(search.categoria)
    setCategoria(search.categoria ?? '')
  }

  const libros = useLibros({
    page: search.page,
    pageSize: search.pageSize,
    buscar: search.buscar,
    categoria: search.categoria,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextBuscar = buscar.trim() || undefined
      const nextCategoria = categoria.trim() || undefined
      if (nextBuscar === search.buscar && nextCategoria === search.categoria) return

      void navigate({
        replace: true,
        search: {
          page: 1,
          pageSize: search.pageSize,
          buscar: nextBuscar,
          categoria: nextCategoria,
        },
      })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [buscar, categoria, navigate, search.buscar, search.categoria, search.pageSize])

  function cambiarVista(next: 'tarjetas' | 'tabla') {
    setVista(next)
    localStorage.setItem(vistaKey, next)
  }

  const items = libros.data?.items ?? []
  const totalPages = libros.data?.totalPages ?? 0
  const totalCount = libros.data?.totalCount ?? 0

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl text-verde">Catálogo</h1>
          <p className="text-sm text-verde/80">Títulos activos de la biblioteca.</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={vista === 'tarjetas' ? 'secondary' : 'outline'}
            onClick={() => cambiarVista('tarjetas')}
          >
            Tarjetas
          </Button>
          <Button
            type="button"
            size="sm"
            variant={vista === 'tabla' ? 'secondary' : 'outline'}
            onClick={() => cambiarVista('tabla')}
          >
            Tabla
          </Button>
        </div>
      </header>

      <form
        className="grid gap-3 sm:grid-cols-[1fr_14rem]"
        onSubmit={(event) => event.preventDefault()}
      >
        <Input
          value={buscar}
          onChange={(event) => setBuscar(event.target.value)}
          placeholder="Título, autor o ISBN"
          aria-label="Buscar libros"
          className="h-12 rounded-2xl bg-white"
        />
        <Input
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
          placeholder="Categoría"
          aria-label="Filtrar por categoría"
          className="h-12 rounded-2xl bg-white"
        />
      </form>

      {libros.isPending ? <CatalogoSkeleton /> : null}

      {libros.isError ? (
        <section className="rounded-2xl border-2 border-tinta bg-white p-6 shadow-cartoon">
          <h2 className="font-display text-2xl">No se pudo cargar el catálogo</h2>
          <p className="mt-2 text-sm">
            {libros.error instanceof ApiError
              ? libros.error.detail || libros.error.title
              : 'Error de red.'}
          </p>
          <Button type="button" className="mt-4" onClick={() => void libros.refetch()}>
            Reintentar
          </Button>
        </section>
      ) : null}

      {libros.isSuccess && items.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border-2 border-tinta bg-white px-6 py-10 text-center shadow-cartoon">
          <img src={heroBlobs} alt="" className="h-28 w-40 rounded-2xl object-cover" />
          <h2 className="font-display text-2xl">Sin resultados</h2>
          <p className="text-sm">Prueba otro título, autor o categoría.</p>
        </section>
      ) : null}

      {libros.isSuccess && items.length > 0 && vista === 'tarjetas' ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((libro) => (
            <li key={libro.idLibro}>
              <LibroCard libro={libro} />
            </li>
          ))}
        </ul>
      ) : null}

      {libros.isSuccess && items.length > 0 && vista === 'tabla' ? (
        <LibrosTable libros={items} />
      ) : null}

      {libros.isSuccess ? (
        <nav className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm">
            {totalCount} libros · página {search.page} de {Math.max(totalPages, 1)}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={search.page <= 1}
              onClick={() =>
                void navigate({ search: { ...search, page: search.page - 1 } })
              }
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={totalPages === 0 || search.page >= totalPages}
              onClick={() =>
                void navigate({ search: { ...search, page: search.page + 1 } })
              }
            >
              Siguiente
            </Button>
          </div>
        </nav>
      ) : null}
    </main>
  )
}

function LibroCard({ libro }: { libro: Libro }) {
  return (
    <Link
      to="/libros/$idLibro"
      params={{ idLibro: String(libro.idLibro) }}
      className="flex h-full gap-3 rounded-2xl border-2 border-tinta bg-white p-3 shadow-cartoon transition-transform hover:-rotate-1"
    >
      <Portada isbn={libro.isbn} titulo={libro.titulo} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="font-display text-xl leading-tight text-verde">{libro.titulo}</h2>
        <p className="truncate text-sm">{libro.autor}</p>
        <p className="text-xs uppercase tracking-wide text-verde/70">{libro.categoria}</p>
        <div className="mt-auto pt-2">
          <StockBadge libro={libro} />
        </div>
      </div>
    </Link>
  )
}

function StockBadge({ libro }: { libro: Libro }) {
  if (libro.disponibles > 0) {
    return <Badge variant="disponible">Disponible ({libro.disponibles})</Badge>
  }

  return (
    <Badge variant="outline" className="bg-muted text-verde/70">
      Sin stock
    </Badge>
  )
}

function Portada({ isbn, titulo }: { isbn: string; titulo: string }) {
  const [fallo, setFallo] = useState(false)
  const limpio = isbn.replace(/[^0-9Xx]/g, '')

  if (fallo || limpio.length === 0) {
    return <PortadaVacia titulo={titulo} />
  }

  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${limpio}-M.jpg?default=false`}
      alt=""
      className="h-36 w-24 shrink-0 rounded-xl border-2 border-tinta object-cover"
      onError={() => setFallo(true)}
    />
  )
}

function PortadaVacia({ titulo }: { titulo: string }) {
  return (
    <svg
      viewBox="0 0 96 144"
      role="img"
      aria-label={titulo}
      className="h-36 w-24 shrink-0 rounded-xl border-2 border-tinta"
    >
      <rect width="96" height="144" fill="#1E3D2E" />
      <rect x="8" y="8" width="80" height="128" fill="#FEF8EC" stroke="#111111" strokeWidth="2" />
      <text
        x="48"
        y="72"
        textAnchor="middle"
        fill="#1E3D2E"
        fontFamily="Fredoka, sans-serif"
        fontSize="11"
      >
        {titulo.slice(0, 42)}
      </text>
    </svg>
  )
}

function LibrosTable({ libros }: { libros: Libro[] }) {
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

function CatalogoSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-40 rounded-2xl border-2 border-tinta" />
        </li>
      ))}
    </ul>
  )
}

function leerVista(): 'tarjetas' | 'tabla' {
  const guardada = localStorage.getItem(vistaKey)
  return guardada === 'tabla' ? 'tabla' : 'tarjetas'
}
