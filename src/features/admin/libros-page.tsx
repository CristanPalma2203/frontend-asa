import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  BuscadorLista,
  EncabezadoPagina,
} from '@/components/layout/encabezado-pagina'
import { Button } from '@/components/ui/button'
import { Paginacion } from '@/components/ui/paginacion'
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
    categoria: search.categoria,
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
        search: {
          page: 1,
          pageSize: search.pageSize,
          buscar: next,
          categoria: search.categoria,
        },
      })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [navigate, search.buscar, search.categoria, search.pageSize, texto])

  const items = libros.data?.items ?? []

  return (
    <main className="flex flex-col gap-6 pt-2">
      <EncabezadoPagina
        eyebrow="Gestión"
        titulo="Libros del"
        serif="catálogo"
        detalle={libros.isSuccess ? `${libros.data.totalCount} títulos` : null}
        accion={
          <Button type="button" onClick={() => setModo('crear')}>
            <Plus aria-hidden />
            Crear libro
          </Button>
        }
      />
      <BuscadorLista
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="Buscar título, autor o ISBN"
        aria-label="Buscar libros"
      />
      {libros.isError ? (
        <div className="bg-card border-linea rounded-xl border p-6">
          <ErrorReintentar
            error={libros.error}
            onRetry={() => void libros.refetch()}
          />
        </div>
      ) : null}
      {libros.isSuccess && items.length === 0 ? (
        <p className="bg-card border-linea text-texto-3 rounded-xl border px-6 py-10 text-center text-[15px]">
          No hay libros con esa búsqueda.
        </p>
      ) : null}
      {libros.isPending || (libros.isSuccess && items.length > 0) ? (
        <LibrosAdminTable
          libros={items}
          cargando={libros.isPending}
          onEdit={setModo}
          onBaja={setBaja}
        />
      ) : null}
      {libros.isSuccess ? (
        <Paginacion
          page={search.page}
          totalPages={libros.data.totalPages}
          onPage={(page) => void navigate({ search: { ...search, page } })}
        />
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
    </main>
  )
}
