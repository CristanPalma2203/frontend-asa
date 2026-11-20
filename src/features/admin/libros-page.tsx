import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { DesactivarLibroDialog } from '@/features/biblioteca/components/desactivar-libro-dialog'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { LibroFormDialog } from '@/features/biblioteca/components/libro-form-dialog'
import { LibrosAdminTable } from '@/features/biblioteca/components/libros-admin-table'
import {
  useDesactivarLibro,
  useGuardarLibro,
  useLibros,
} from '@/features/biblioteca/hooks/use-libros'
import type { Libro } from '@/features/biblioteca/types/api'

const Route = getRouteApi('/admin/libros')

export function LibrosAdminPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [texto, setTexto] = useState(search.buscar ?? '')
  const [urlBuscar, setUrlBuscar] = useState(search.buscar)
  const [modo, setModo] = useState<'crear' | Libro | null>(null)
  const [baja, setBaja] = useState<Libro | null>(null)
  const libros = useLibros({
    page: search.page,
    pageSize: search.pageSize,
    buscar: search.buscar,
  })
  const editando = typeof modo === 'object' ? modo : null
  const guardar = useGuardarLibro(editando, { onSuccess: () => setModo(null) })
  const desactivar = useDesactivarLibro({ onSuccess: () => setBaja(null) })

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
        <ErrorReintentar
          error={libros.error}
          onRetry={() => void libros.refetch()}
        />
      ) : null}
      {libros.isSuccess && items.length === 0 ? (
        <p className="mt-6 text-sm">No hay libros con esa búsqueda.</p>
      ) : null}
      {libros.isSuccess && items.length > 0 ? (
        <LibrosAdminTable
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
      <LibroFormDialog
        abierto={modo !== null}
        libro={editando}
        onClose={() => {
          setModo(null)
          guardar.reset()
        }}
        pending={guardar.isPending}
        error={guardar.error}
        onSubmit={(values) => guardar.mutate(values)}
      />
      <DesactivarLibroDialog
        libro={baja}
        onClose={() => setBaja(null)}
        pending={desactivar.isPending}
        error={desactivar.error}
        onConfirmar={(libro) => desactivar.mutate(libro.idLibro)}
      />
    </section>
  )
}
