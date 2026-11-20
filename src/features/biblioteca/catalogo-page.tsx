import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import heroBlobs from '@/assets/hero-blobs.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LibroCard } from '@/features/biblioteca/components/libro-card'
import { LibrosTable } from '@/features/biblioteca/components/libros-table'
import { CatalogoSkeleton } from '@/features/biblioteca/components/skeletons'
import { useLibros } from '@/features/biblioteca/hooks/use-libros'
import { ApiError } from '@/lib/api/client'

const Route = getRouteApi('/catalogo')

const vistaKey = 'asa-catalogo-vista'


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
    autor: search.autor,
    categoria: search.categoria,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextBuscar = buscar.trim() || undefined
      const nextCategoria = categoria.trim() || undefined
      if (nextBuscar === search.buscar && nextCategoria === search.categoria) return

      const searchNext: {
        page: number
        pageSize: number
        buscar?: string
        autor?: string
        categoria?: string
      } = { page: 1, pageSize: search.pageSize }
      if (nextBuscar) searchNext.buscar = nextBuscar
      // autor no tiene input propio: se conserva el de la URL al cambiar búsqueda o categoría.
      if (search.autor) searchNext.autor = search.autor
      if (nextCategoria) searchNext.categoria = nextCategoria
      void navigate({ replace: true, search: searchNext })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [buscar, categoria, navigate, search.autor, search.buscar, search.categoria, search.pageSize])

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
        <div className="flex flex-col gap-1">
          <Label htmlFor="buscar-libros">Buscar</Label>
          <Input
            id="buscar-libros"
            value={buscar}
            onChange={(event) => setBuscar(event.target.value)}
            placeholder="Título, autor o ISBN"
            className="h-12 rounded-2xl bg-white"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="filtro-categoria">Categoría</Label>
          <Input
            id="filtro-categoria"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            placeholder="Categoría"
            className="h-12 rounded-2xl bg-white"
          />
        </div>
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

function leerVista(): 'tarjetas' | 'tabla' {
  const guardada = localStorage.getItem(vistaKey)
  return guardada === 'tabla' ? 'tabla' : 'tarjetas'
}
