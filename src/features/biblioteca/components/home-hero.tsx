import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronDown, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useSesion } from '@/components/layout/use-sesion'
import { Hueso } from '@/components/ui/hueso'
import { PalabrasAnimadas } from '@/components/ui/palabras-animadas'
import { HeroBackdrop } from '@/features/biblioteca/components/hero-backdrop'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { textoDisponibles } from '@/features/biblioteca/disponibilidad'
import { useCategorias } from '@/features/biblioteca/hooks/use-categorias'
import type { ResumenHome } from '@/features/biblioteca/hooks/use-libros'
import type { Libro } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn, lift, reveal, titleLines } from '@/lib/motion'
import { cn } from '@/lib/utils'

const catalogoInicial = { page: 1, pageSize: 12 } as const

export function HomeHero({
  resumen,
  cargando,
}: {
  resumen: ResumenHome | undefined
  cargando: boolean
}) {
  const sesion = useSesion()
  const ref = useRef<HTMLElement>(null)
  const nombre = sesion.visible ? sesion.nombre?.split(/[\s@]/)[0] : undefined

  useMotion(ref, (root) => {
    reveal(root.querySelectorAll('[data-m="bloque"]'), {
      y: 14,
      stagger: 0.06,
      delay: 0.06,
    })
    titleLines(root.querySelector('h1'), 0.06)
  })

  return (
    <section ref={ref} className="relative mt-3 lg:mt-6">
      <div className="bg-bosque absolute inset-x-0 top-0 bottom-[96px] overflow-hidden rounded-[28px] lg:bottom-[150px] lg:rounded-[32px]">
        <HeroBackdrop />
      </div>

      <div className="relative flex flex-col px-5 pt-7 lg:px-12">
        {nombre ? (
          <p
            data-m="bloque"
            className="mb-4 text-base font-medium text-white/80"
          >
            Hola, {nombre}
          </p>
        ) : null}
        <h1 className="text-papel text-[38px] leading-[1.02] font-semibold tracking-[-0.045em] sm:text-[52px] lg:text-[64px] lg:leading-none">
          <PalabrasAnimadas texto="Descubre tu próxima" />{' '}
          <span className="titulo-serif text-lima-400 text-[1.14em]">
            <PalabrasAnimadas texto="lectura" cursiva />
          </span>
        </h1>

        <div data-m="bloque" className="mt-7 lg:mt-8">
          <BuscadorHome />
        </div>

        <div
          data-m="bloque"
          className="mt-10 flex items-center justify-between lg:mt-11"
        >
          <h2 className="text-papel text-xl font-semibold tracking-[-0.02em] lg:text-[22px]">
            Recomendados
          </h2>
          <Link
            to="/catalogo"
            search={catalogoInicial}
            className="hover:bg-lima-400/14 hover:text-lima-400 text-papel flex h-9 items-center gap-1.5 rounded-full border border-white/14 bg-white/8 px-3.5 text-[13px] font-semibold transition-colors hover:no-underline"
          >
            Ver todos
            <ArrowRight aria-hidden className="size-3.5" strokeWidth={2.2} />
          </Link>
        </div>

        <Recomendados libros={resumen?.destacados} cargando={cargando} />
      </div>
    </section>
  )
}

function BuscadorHome() {
  const navigate = useNavigate()
  const categorias = useCategorias()
  const [texto, setTexto] = useState('')
  const [categoria, setCategoria] = useState('')

  return (
    <form
      role="search"
      aria-label="Buscar en el catálogo"
      onSubmit={(event) => {
        event.preventDefault()
        const buscar = texto.trim()
        void navigate({
          to: '/catalogo',
          search: {
            ...catalogoInicial,
            ...(buscar ? { buscar } : {}),
            ...(categoria ? { categoria } : {}),
          },
        })
      }}
      className="bg-card flex w-full max-w-[720px] flex-col gap-2 rounded-[20px] p-2 shadow-[0_24px_60px_-18px_rgb(0_0_0/0.55)] sm:h-16 sm:flex-row sm:items-center sm:gap-0"
    >
      <div className="relative flex-none">
        <select
          name="categoria"
          aria-label="Categoría"
          value={categoria}
          onChange={(event) => setCategoria(event.target.value)}
          className="bg-hueso text-tinta focus-visible:shadow-foco h-12 w-full cursor-pointer appearance-none rounded-xl pr-9 pl-3.5 text-sm font-medium outline-none sm:w-auto"
        >
          <option value="">Todas las categorías</option>
          {categorias.data?.map(({ nombre }) => (
            <option key={nombre} value={nombre}>
              {nombre}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="text-niebla-fg pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2"
          strokeWidth={2.4}
        />
      </div>
      <span aria-hidden className="bg-linea mx-3.5 hidden h-7 w-px sm:block" />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2.5 pl-2 sm:pl-0">
          <Search
            aria-hidden
            className="text-niebla-fg size-[19px] flex-none"
            strokeWidth={2}
          />
          <span className="sr-only">Buscar por título, autor o categoría</span>
          <input
            type="search"
            name="buscar"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder="Busca por título, autor o categoría"
            className="text-tinta placeholder:text-texto-4 h-12 min-w-0 flex-1 bg-transparent text-base outline-none"
          />
        </label>
        <button
          type="submit"
          className="bg-pino-800 text-papel hover:bg-pino-850 focus-visible:shadow-foco h-12 flex-none cursor-pointer rounded-[14px] px-6 text-[15px] font-semibold transition-colors outline-none"
        >
          Buscar
        </button>
      </div>
    </form>
  )
}

const MIN_PORTADA = 160
const GAP = 24
const EN_MOVIL = 6

function Recomendados({
  libros,
  cargando,
}: {
  libros: Libro[] | undefined
  cargando: boolean
}) {
  const ref = useRef<HTMLUListElement>(null)
  const [porFila, setPorFila] = useState(EN_MOVIL)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(() => {
      if (getComputedStyle(el).display !== 'grid') {
        setPorFila(EN_MOVIL)
        return
      }
      const columnas = Math.floor((el.clientWidth + GAP) / (MIN_PORTADA + GAP))
      setPorFila(Math.max(1, columnas))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [cargando])

  const lista = (libros ?? []).slice(0, porFila)
  useMotion(
    ref,
    (root) => {
      if (!lista.length) return
      cardsIn(root.children, { stagger: 0.05, delay: 0.1 })
      return lift(root)
    },
    [lista.map((libro) => libro.idLibro).join(',')],
  )

  if (!cargando && lista.length === 0) return null

  const claseLista =
    'tira-sin-barra -mx-5 mt-1 flex snap-x gap-4 overflow-x-auto overflow-y-hidden px-5 pt-4 pb-6 sm:mx-0 sm:mt-5 sm:grid sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-6 sm:overflow-visible sm:p-0'

  if (cargando) {
    return (
      <ul
        ref={ref}
        aria-label="Cargando recomendados"
        aria-busy
        className={claseLista}
      >
        {Array.from({ length: porFila }, (_, i) => (
          <li
            key={i}
            className="flex w-[132px] flex-none flex-col gap-2.5 sm:w-auto"
          >
            <Hueso
              cargando
              alto={198}
              radio={8}
              llenar
              className="aspect-[2/3] w-full"
            />
            <Hueso cargando ancho="80%" alto={14} />
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul ref={ref} aria-label="Recomendados" className={claseLista}>
      {lista.map((libro) => (
        <li
          key={libro.idLibro}
          className="w-[132px] flex-none snap-start sm:w-auto"
        >
          <Link
            to="/libros/$idLibro"
            params={{ idLibro: String(libro.idLibro) }}
            data-lift
            aria-label={`${libro.titulo}, ${libro.disponibles > 0 ? textoDisponibles(libro.disponibles) : 'agotado'}`}
            className="group text-tinta focus-visible:shadow-foco flex flex-col gap-3 rounded-lg outline-none hover:no-underline"
          >
            <span className="relative block">
              <PortadaLibro
                isbn={libro.isbn}
                titulo={libro.titulo}
                className="w-full shadow-[0_2px_4px_rgb(0_0_0/0.12),0_30px_44px_-20px_rgb(0_0_0/0.6)]"
              />
              <span
                className={cn(
                  'absolute top-2 left-2 inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold shadow-[0_2px_6px_rgb(0_0_0/0.2)]',
                  libro.disponibles > 0
                    ? 'bg-lima-400 text-pino-800'
                    : 'bg-niebla text-texto-2',
                )}
              >
                {libro.disponibles > 0 ? (
                  <span
                    aria-hidden
                    className="bg-pino-800 size-[5px] rounded-full"
                  />
                ) : null}
                {libro.disponibles > 0
                  ? textoDisponibles(libro.disponibles)
                  : 'Agotado'}
              </span>
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="truncate text-[15px] font-semibold">
                {libro.titulo}
              </span>
              <span className="text-texto-3 truncate text-[13px]">
                {libro.autor}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
