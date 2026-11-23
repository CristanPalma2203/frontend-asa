import { getRouteApi, Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, SearchX, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { aplicarVistaCatalogo } from '@/features/biblioteca/catalogo-vista'
import {
  BarraCatalogo,
  ChipsCategorias,
} from '@/features/biblioteca/components/catalogo-filtros'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import {
  LibroCard,
  LibroCardFantasma,
} from '@/features/biblioteca/components/libro-card'
import { useCategorias } from '@/features/biblioteca/hooks/use-categorias'
import { useLibros } from '@/features/biblioteca/hooks/use-libros'
import type { CatalogoSearch } from '@/features/biblioteca/schemas/catalogo-search.schema'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn, lift } from '@/lib/motion'

const Route = getRouteApi('/catalogo')

const claseRejillaLibros =
  'grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:gap-5'
const claseCeldaLibro = 'w-full max-w-[18rem] justify-self-center'

export function CatalogoPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [texto, setTexto] = useState(search.buscar ?? '')
  const [textoUrl, setTextoUrl] = useState(search.buscar)

  if (search.buscar !== textoUrl) {
    setTextoUrl(search.buscar)
    setTexto(search.buscar ?? '')
  }

  const libros = useLibros({
    page: search.page,
    pageSize: search.pageSize,
    buscar: search.buscar,
    autor: search.autor,
    categoria: search.categoria,
  })
  const categorias = useCategorias()

  function irCon(cambios: Partial<CatalogoSearch>, reemplazar = false) {
    const siguiente: CatalogoSearch = { ...search, ...cambios, page: 1 }
    for (const clave of Object.keys(siguiente) as (keyof CatalogoSearch)[])
      if (siguiente[clave] === undefined) delete siguiente[clave]
    void navigate({ replace: reemplazar, search: siguiente })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const buscar = texto.trim() || undefined
      if (buscar === search.buscar) return
      const siguiente: CatalogoSearch = { ...search, buscar, page: 1 }
      if (!buscar) delete siguiente.buscar
      void navigate({ replace: true, search: siguiente })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [texto, navigate, search])

  const recibidos = libros.data?.items ?? []
  const items = aplicarVistaCatalogo(recibidos, {
    disponibilidad: search.disponibilidad,
    orden: search.orden,
  })
  const gridRef = useRef<HTMLUListElement>(null)
  const claveResultados = libros.isSuccess
    ? items.map((l) => l.idLibro).join(',') + `|${search.page}`
    : ''

  useMotion(
    gridRef,
    (root) => {
      cardsIn(root.children, { stagger: 0.05 })
      return lift(root)
    },
    [claveResultados],
  )
  const totalPages = libros.data?.totalPages ?? 0
  const totalCount = libros.data?.totalCount ?? 0
  const hayFiltros = Boolean(
    search.buscar || search.categoria || search.autor || search.disponibilidad,
  )

  function irAPagina(page: number) {
    void navigate({ search: { ...search, page } })
  }

  return (
    <main className="flex w-full flex-col gap-6 px-4 pt-6 pb-14 md:px-6 xl:px-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-[36px] leading-[1.02] sm:text-[48px]">
          Todo el <span className="titulo-serif">catálogo</span>
        </h1>
      </header>

      <section
        aria-label="Filtros"
        className="relative z-20 flex flex-col gap-4"
      >
        <ChipsCategorias
          categorias={categorias.data}
          activa={search.categoria}
          onElegir={(categoria) => irCon({ categoria })}
        />
        <BarraCatalogo
          texto={texto}
          onTexto={setTexto}
          disponibilidad={search.disponibilidad}
          onDisponibilidad={(disponibilidad) => irCon({ disponibilidad })}
          orden={search.orden}
          onOrden={(orden) => irCon({ orden })}
          totalLibros={libros.isSuccess ? totalCount : undefined}
          onCategoria={(categoria, conservarTexto) => {
            const buscar = conservarTexto
              ? texto.trim() || undefined
              : undefined
            if (!conservarTexto) setTexto('')
            irCon({ categoria, buscar })
          }}
        />
        {search.autor ? (
          <p className="flex">
            <button
              type="button"
              onClick={() => irCon({ autor: undefined })}
              className="border-pino-800 bg-pino-800/8 text-pino-800 focus-visible:shadow-foco flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium outline-none"
            >
              Autor: {search.autor}
              <X aria-hidden className="size-3.5" />
              <span className="sr-only">(quitar filtro)</span>
            </button>
          </p>
        ) : null}
        {search.disponibilidad && libros.isSuccess ? (
          <p className="text-texto-3 text-[13px]">
            Mostrando {items.length} de los {recibidos.length} libros de esta
            página ({search.disponibilidad === 'disponibles' ? 'con' : 'sin'}{' '}
            ejemplares disponibles).
          </p>
        ) : null}
      </section>

      {libros.isPending ? (
        <ul
          aria-label="Cargando libros"
          aria-busy
          className={claseRejillaLibros}
        >
          {Array.from({ length: search.pageSize }, (_, i) => (
            <li key={i} className={claseCeldaLibro}>
              <LibroCardFantasma />
            </li>
          ))}
        </ul>
      ) : null}

      {libros.isError ? (
        <section className="bg-card border-linea shadow-card rounded-xl border p-8">
          <h2 className="text-xl">No se pudo cargar el catálogo</h2>
          <ErrorReintentar
            error={libros.error}
            onRetry={() => void libros.refetch()}
          />
        </section>
      ) : null}

      {libros.isSuccess && items.length === 0 ? (
        <section className="bg-card border-linea flex flex-col items-center gap-3 rounded-xl border px-6 py-14 text-center">
          <span className="bg-lima-wash text-pino-800 grid size-14 place-items-center rounded-full">
            <SearchX aria-hidden className="size-6" strokeWidth={2} />
          </span>
          <h2 className="mt-2 text-xl">Sin resultados</h2>
          <p className="text-texto-3 max-w-sm text-[15px]">
            {mensajeSinResultados(search)}
          </p>
          {hayFiltros ? (
            <Link
              to="/catalogo"
              search={{ page: 1, pageSize: search.pageSize }}
              className={buttonVariants({
                variant: 'outline',
                size: 'sm',
                className: 'mt-3',
              })}
            >
              Limpiar filtros
            </Link>
          ) : null}
        </section>
      ) : null}

      {libros.isSuccess && items.length > 0 ? (
        <ul ref={gridRef} className={claseRejillaLibros}>
          {items.map((libro) => (
            <li key={libro.idLibro} className={claseCeldaLibro}>
              <LibroCard libro={libro} />
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
            {totalCount} libros · página {search.page} de{' '}
            {Math.max(totalPages, 1)}
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
    </main>
  )
}

function mensajeSinResultados({ buscar, categoria, autor }: CatalogoSearch) {
  const criterios = [
    buscar ? `para «${buscar}»` : null,
    autor ? `de «${autor}»` : null,
    categoria ? `en la categoría «${categoria}»` : null,
  ].filter(Boolean)
  return criterios.length > 0
    ? `No encontramos libros ${criterios.join(' ')}.`
    : 'Prueba otro título, autor o categoría.'
}
