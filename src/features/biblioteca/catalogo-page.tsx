import { getRouteApi, Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Search, SearchX, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { LibroCard, LibroCardFantasma } from '@/features/biblioteca/components/libro-card'
import { LibroResumenPanel } from '@/features/biblioteca/components/libro-resumen-panel'
import { useLibros, useResumenHome } from '@/features/biblioteca/hooks/use-libros'
import type { CatalogoSearch } from '@/features/biblioteca/schemas/catalogo-search.schema'
import type { Libro } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn, lift, reveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

const Route = getRouteApi('/catalogo')

type Filtros = { buscar: string; categoria: string; autor: string }

function filtrosDeUrl(search: CatalogoSearch): Filtros {
  return {
    buscar: search.buscar ?? '',
    categoria: search.categoria ?? '',
    autor: search.autor ?? '',
  }
}

export function CatalogoPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [filtros, setFiltros] = useState<Filtros>(() => filtrosDeUrl(search))
  const [filtrosUrl, setFiltrosUrl] = useState<Filtros>(() => filtrosDeUrl(search))
  const [abierto, setAbierto] = useState<Libro | null>(null)

  // Si la URL cambia desde fuera (atrás/adelante, chips, buscador global), los inputs la siguen.
  const actualesUrl = filtrosDeUrl(search)
  if (
    actualesUrl.buscar !== filtrosUrl.buscar ||
    actualesUrl.categoria !== filtrosUrl.categoria ||
    actualesUrl.autor !== filtrosUrl.autor
  ) {
    setFiltrosUrl(actualesUrl)
    setFiltros(actualesUrl)
  }

  const libros = useLibros({
    page: search.page,
    pageSize: search.pageSize,
    buscar: search.buscar,
    autor: search.autor,
    categoria: search.categoria,
  })
  // Muestra del catálogo (misma consulta que la Home) para sugerir categorías.
  const categorias = useResumenHome().data?.categorias ?? []

  // Lo escrito pasa a la URL con 300 ms de espera; la URL es la que dispara la consulta.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const buscar = filtros.buscar.trim() || undefined
      const categoria = filtros.categoria.trim() || undefined
      const autor = filtros.autor.trim() || undefined
      if (
        buscar === search.buscar &&
        categoria === search.categoria &&
        autor === search.autor
      ) {
        return
      }
      void navigate({
        replace: true,
        search: {
          page: 1,
          pageSize: search.pageSize,
          ...(buscar ? { buscar } : {}),
          ...(categoria ? { categoria } : {}),
          ...(autor ? { autor } : {}),
        },
      })
    }, 300)

    return () => window.clearTimeout(timer)
  }, [filtros, navigate, search.autor, search.buscar, search.categoria, search.pageSize])

  const items = libros.data?.items ?? []
  const gridRef = useRef<HTMLUListElement>(null)
  const chipsRef = useRef<HTMLUListElement>(null)
  // Clave de los resultados: cada búsqueda, filtro o página nueva vuelve a hacer cardsIn.
  const claveResultados = libros.isSuccess
    ? `${search.page}|${search.buscar ?? ''}|${search.categoria ?? ''}|${search.autor ?? ''}|${items.map((l) => l.idLibro).join(',')}`
    : ''

  // Tarjetas: co() de Flito (stagger 0.05) y [data-lift] de Wynlo.
  useMotion(
    gridRef,
    (root) => {
      cardsIn(root.children, { stagger: 0.05 })
      return lift(root)
    },
    [claveResultados],
  )
  // Chips de categoría: so() de Flito en horizontal.
  useMotion(chipsRef, (root) => reveal(root.children, { x: 10, y: 0, stagger: 0.05 }), [categorias.length])
  const totalPages = libros.data?.totalPages ?? 0
  const totalCount = libros.data?.totalCount ?? 0
  const hayFiltros = Boolean(search.buscar || search.categoria || search.autor)

  function irAPagina(page: number) {
    void navigate({ search: { ...search, page } })
  }

  function elegirCategoria(categoria: string) {
    setFiltros((actual) => ({
      ...actual,
      categoria: actual.categoria === categoria ? '' : categoria,
    }))
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pt-6 pb-14 lg:px-14">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Biblioteca</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-[36px] leading-[1.02] sm:text-[48px]">
            Nuestro <span className="titulo-serif">catálogo</span>
          </h1>
          {libros.isSuccess ? (
            <p className="text-texto-3 text-sm">
              {totalCount.toLocaleString('es')} {totalCount === 1 ? 'título' : 'títulos'}
              {hayFiltros ? ' con estos filtros' : ''}
            </p>
          ) : null}
        </div>
      </header>

      <section aria-label="Filtros" className="flex flex-col gap-4">
        <form
          role="search"
          className="grid gap-3 md:grid-cols-[1fr_13rem_13rem]"
          onSubmit={(event) => event.preventDefault()}
        >
          <Campo id="buscar-libros" etiqueta="Buscar" icono>
            <input
              id="buscar-libros"
              type="search"
              value={filtros.buscar}
              onChange={(event) => setFiltros({ ...filtros, buscar: event.target.value })}
              placeholder="Título, autor o ISBN"
              className={claseInput('pl-11')}
            />
          </Campo>
          <Campo id="filtro-categoria" etiqueta="Categoría">
            <input
              id="filtro-categoria"
              value={filtros.categoria}
              onChange={(event) => setFiltros({ ...filtros, categoria: event.target.value })}
              placeholder="Todas"
              className={claseInput()}
            />
          </Campo>
          <Campo id="filtro-autor" etiqueta="Autor">
            <input
              id="filtro-autor"
              value={filtros.autor}
              onChange={(event) => setFiltros({ ...filtros, autor: event.target.value })}
              placeholder="Todos"
              className={claseInput()}
            />
          </Campo>
        </form>

        {categorias.length > 0 ? (
          <ul ref={chipsRef} aria-label="Categorías sugeridas" className="flex flex-wrap gap-2">
            {categorias.map((categoria) => {
              const activa = search.categoria?.toLowerCase() === categoria.toLowerCase()
              return (
                <li key={categoria}>
                  <button
                    type="button"
                    aria-pressed={activa}
                    onClick={() => elegirCategoria(categoria)}
                    className={cn(
                      'focus-visible:shadow-foco flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-[13px] font-medium transition-colors outline-none',
                      activa
                        ? 'bg-pino-950 text-papel border-pino-950'
                        : 'border-linea-fuerte bg-card text-texto-2 hover:border-separador hover:text-tinta',
                    )}
                  >
                    {categoria}
                    {activa ? <X aria-hidden className="size-3.5" /> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>

      {libros.isPending ? (
        <ul aria-label="Cargando libros" aria-busy className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: search.pageSize }, (_, i) => (
            <li key={i}>
              <LibroCardFantasma />
            </li>
          ))}
        </ul>
      ) : null}

      {libros.isError ? (
        <section className="bg-card border-linea shadow-card rounded-xl border p-8">
          <h2 className="text-xl">No se pudo cargar el catálogo</h2>
          <ErrorReintentar error={libros.error} onRetry={() => void libros.refetch()} />
        </section>
      ) : null}

      {libros.isSuccess && items.length === 0 ? (
        <section className="bg-card border-linea flex flex-col items-center gap-3 rounded-xl border px-6 py-14 text-center">
          <span className="bg-lima-wash text-pino-800 grid size-14 place-items-center rounded-full">
            <SearchX aria-hidden className="size-6" strokeWidth={2} />
          </span>
          <h2 className="mt-2 text-xl">Sin resultados</h2>
          <p className="text-texto-3 max-w-sm text-[15px]">
            Prueba otro título, autor o categoría.
          </p>
          {hayFiltros ? (
            <Link
              to="/catalogo"
              search={{ page: 1, pageSize: search.pageSize }}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'mt-3' })}
            >
              Limpiar filtros
            </Link>
          ) : null}
        </section>
      ) : null}

      {libros.isSuccess && items.length > 0 ? (
        <ul ref={gridRef} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((libro) => (
            <li key={libro.idLibro}>
              <LibroCard libro={libro} onAbrir={setAbierto} />
            </li>
          ))}
        </ul>
      ) : null}

      {libros.isSuccess && totalCount > 0 ? (
        <nav
          aria-label="Paginación"
          className="border-linea flex flex-col items-center justify-between gap-3 border-t pt-6 sm:flex-row"
        >
          <p className="text-texto-3 text-sm">
            {totalCount} libros · página {search.page} de {Math.max(totalPages, 1)}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={search.page <= 1}
              onClick={() => irAPagina(search.page - 1)}
            >
              <ChevronLeft aria-hidden />
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={totalPages === 0 || search.page >= totalPages}
              onClick={() => irAPagina(search.page + 1)}
            >
              Siguiente
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </nav>
      ) : null}

      <LibroResumenPanel libro={abierto} onCerrar={() => setAbierto(null)} />
    </main>
  )
}

function claseInput(extra?: string) {
  return cn(
    'border-linea-fuerte bg-card text-texto placeholder:text-texto-4 hover:border-separador focus-visible:border-pino-800 focus-visible:shadow-foco h-12 w-full rounded-[12px] border px-4 text-[15px] transition-[border-color,box-shadow] outline-none',
    extra,
  )
}

function Campo({
  id,
  etiqueta,
  icono = false,
  children,
}: {
  id: string
  etiqueta: string
  icono?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-texto-2 text-[13px] font-semibold">
        {etiqueta}
      </label>
      <div className="relative">
        {icono ? (
          <Search
            aria-hidden
            className="text-texto-4 pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2"
            strokeWidth={2}
          />
        ) : null}
        {children}
      </div>
    </div>
  )
}
