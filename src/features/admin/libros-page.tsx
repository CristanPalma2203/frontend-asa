import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { flexRender } from '@tanstack/react-table'
import { getCoreRowModel, useLegacyTable, type LegacyColumnDef } from '@tanstack/react-table/legacy'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { crearLibro, desactivarLibro, editarLibro } from '@/features/biblioteca/api'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { useLibros } from '@/features/biblioteca/hooks'
import { libroSchema, type LibroForm } from '@/features/biblioteca/schemas'
import type { Libro } from '@/features/biblioteca/types'
import { ApiError } from '@/lib/api/client'
import { Route } from '@/routes/admin/libros'

export function LibrosAdminPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [texto, setTexto] = useState(search.buscar ?? '')
  const [urlBuscar, setUrlBuscar] = useState(search.buscar)
  const [modo, setModo] = useState<'crear' | Libro | null>(null)
  const [baja, setBaja] = useState<Libro | null>(null)
  const queryClient = useQueryClient()
  const libros = useLibros({
    page: search.page,
    pageSize: search.pageSize,
    buscar: search.buscar,
  })

  if (search.buscar !== urlBuscar) {
    setUrlBuscar(search.buscar)
    setTexto(search.buscar ?? '')
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = texto.trim() || undefined
      if (next === search.buscar) return
      void navigate({
        replace: true,
        search: { page: 1, pageSize: search.pageSize, buscar: next },
      })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [navigate, search.buscar, search.pageSize, texto])

  const guardar = useMutation({
    mutationFn: async (values: LibroForm) => {
      if (typeof modo === 'object' && modo) await editarLibro(modo.idLibro, values)
      else await crearLibro(values)
    },
    onSuccess: async () => {
      setModo(null)
      await queryClient.invalidateQueries({ queryKey: ['libros'] })
    },
  })
  const desactivar = useMutation({
    mutationFn: (id: number) => desactivarLibro(id),
    onSuccess: async () => {
      setBaja(null)
      await queryClient.invalidateQueries({ queryKey: ['libros'] })
    },
  })

  const items = libros.data?.items ?? []

  return (
    <section className="rounded-2xl border-2 border-tinta bg-white p-4 shadow-cartoon">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl text-verde">Libros</h1>
        <Button type="button" onClick={() => setModo('crear')}>
          Crear libro
        </Button>
      </div>
      <Input
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="Buscar título, autor o ISBN"
        aria-label="Buscar libros"
        className="mt-4 bg-crema"
      />
      {libros.isPending ? <Skeleton className="mt-4 h-40 rounded-2xl border-2 border-tinta" /> : null}
      {libros.isError ? (
        <ErrorBox
          error={libros.error}
          onRetry={() => void libros.refetch()}
        />
      ) : null}
      {libros.isSuccess && items.length === 0 ? (
        <p className="mt-6 text-sm">No hay libros con esa búsqueda.</p>
      ) : null}
      {libros.isSuccess && items.length > 0 ? (
        <TablaLibros
          libros={items}
          onEdit={setModo}
          onBaja={setBaja}
        />
      ) : null}
      {libros.isSuccess ? (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={search.page <= 1}
            onClick={() => void navigate({ search: { ...search, page: search.page - 1 } })}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={search.page >= (libros.data.totalPages || 1)}
            onClick={() => void navigate({ search: { ...search, page: search.page + 1 } })}
          >
            Siguiente
          </Button>
        </div>
      ) : null}
      <LibroDialog
        abierto={modo !== null}
        libro={typeof modo === 'object' ? modo : null}
        onClose={() => {
          setModo(null)
          guardar.reset()
        }}
        pending={guardar.isPending}
        error={guardar.error}
        onSubmit={(values) => guardar.mutate(values)}
      />
      <Dialog open={baja !== null} onOpenChange={(open) => !open && setBaja(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar {baja?.titulo}</DialogTitle>
          </DialogHeader>
          <p className="text-sm">El libro dejará de aparecer en el catálogo.</p>
          {desactivar.error instanceof ApiError ? (
            <p className="text-sm text-destructive">
              {mensajeDeError(desactivar.error.code, desactivar.error.detail || desactivar.error.title)}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBaja(null)}>
              Volver
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!baja || desactivar.isPending}
              onClick={() => baja && desactivar.mutate(baja.idLibro)}
            >
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function TablaLibros({
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

function LibroDialog({
  abierto,
  libro,
  onClose,
  onSubmit,
  pending,
  error,
}: {
  abierto: boolean
  libro: Libro | null
  onClose: () => void
  onSubmit: (values: LibroForm) => void
  pending: boolean
  error: unknown
}) {
  const form = useForm<LibroForm>({
    resolver: zodResolver(libroSchema),
    defaultValues: libro ?? { isbn: '', titulo: '', autor: '', categoria: '' },
  })

  useEffect(() => {
    form.reset(libro ?? { isbn: '', titulo: '', autor: '', categoria: '' })
  }, [form, libro, abierto])

  useEffect(() => {
    if (!(error instanceof ApiError)) return
    if (error.code === 'isbn-duplicado') {
      form.setError('isbn', { message: mensajeDeError(error.code, error.detail ?? error.title) })
    }
    aplicarValidacion(form, error)
  }, [error, form])

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{libro ? 'Editar libro' : 'Crear libro'}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          <Campo label="ISBN" error={form.formState.errors.isbn?.message}>
            <Input {...form.register('isbn')} />
          </Campo>
          <Campo label="Título" error={form.formState.errors.titulo?.message}>
            <Input {...form.register('titulo')} />
          </Campo>
          <Campo label="Autor" error={form.formState.errors.autor?.message}>
            <Input {...form.register('autor')} />
          </Campo>
          <Campo label="Categoría" error={form.formState.errors.categoria?.message}>
            <Input {...form.register('categoria')} />
          </Campo>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function aplicarValidacion(form: UseFormReturn<LibroForm>, error: ApiError) {
  if (error.code !== 'validacion-fallida' || !error.errors) return
  for (const [key, messages] of Object.entries(error.errors)) {
    const campo = key.charAt(0).toLowerCase() + key.slice(1)
    const message = messages[0]
    if (message && campo in form.getValues()) {
      form.setError(campo as keyof LibroForm, { message })
    }
  }
}

function Campo({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1 text-sm">
      <Label>{label}</Label>
      {children}
      {error ? <span className="text-destructive">{error}</span> : null}
    </label>
  )
}

function ErrorBox({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="mt-4">
      <p className="text-sm">
        {error instanceof ApiError ? mensajeDeError(error.code, error.detail || error.title) : 'Error de red.'}
      </p>
      <Button type="button" className="mt-3" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
