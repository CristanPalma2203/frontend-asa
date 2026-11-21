import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Search } from 'lucide-react'
import { useRef, useState } from 'react'

import { Brand } from '@/components/layout/brand'
import { PalabrasAnimadas } from '@/components/ui/palabras-animadas'
import { useSesion } from '@/components/layout/use-sesion'
import { HeroBackdrop } from '@/features/biblioteca/components/hero-backdrop'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import type { ResumenHome } from '@/features/biblioteca/hooks/use-libros'
import type { Libro } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn, reveal, titleLines } from '@/lib/motion'
import { cn } from '@/lib/utils'

const catalogoInicial = { page: 1, pageSize: 12 } as const

/**
 * Hero de la Home, sin imagen: fondo animado de Corelux (`HeroBackdrop`).
 * La tira de portadas queda montada sobre el borde inferior.
 */
export function HomeHero({
  resumen,
  cargando,
}: {
  resumen: ResumenHome | undefined
  cargando: boolean
}) {
  const ref = useRef<HTMLElement>(null)

  // Entrada del hero, una vez por montaje (Flito so/co + titleLines). No toca el HeroBackdrop.
  useMotion(ref, (root) => {
    reveal(root.querySelector('[data-m="pill"]'), { y: 8 })
    titleLines(root.querySelector('h1'), 0.05)
    reveal(root.querySelectorAll('[data-m="bloque"]'), {
      y: 14,
      stagger: 0.07,
      delay: 0.2,
    })
  })
  // Chips y portadas llegan con la API: entran cuando están.
  useMotion(
    ref,
    (root) => {
      if (cargando) return
      reveal(root.querySelectorAll('[data-m="chips"]'), { y: 14, delay: 0.2 })
      cardsIn(root.querySelectorAll('[data-m="portada"]'), {
        stagger: 0.06,
        delay: 0.3,
      })
    },
    [cargando],
  )

  return (
    <section ref={ref} className="relative isolate">
      <div className="bg-bosque text-papel relative isolate overflow-clip pb-36 sm:pb-44">
        <HeroBackdrop />
        <HeroNav />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-5 pt-10 text-center sm:pt-16">
          <PildoraHero total={resumen?.totalTitulos} />

          <h1 className="text-papel mt-6 text-[40px] leading-[1.02] font-semibold tracking-[-0.04em] sm:text-[64px]">
            <PalabrasAnimadas texto="Encuentra tu próximo libro" />{' '}
            <span className="titulo-serif text-lima-400 mt-1 block text-[1.08em] tracking-[-0.01em]">
              <PalabrasAnimadas texto="y resérvalo en un clic." cursiva />
            </span>
          </h1>

          <p
            data-m="bloque"
            className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/72 sm:text-base"
          >
            Busca en el catálogo de la biblioteca, mira qué hay disponible y
            reserva. Nosotros te asignamos el ejemplar.
          </p>

          <BuscadorHero />
          <ChipsCategorias
            categorias={resumen?.categorias}
            cargando={cargando}
          />
        </div>
      </div>

      <TiraPortadas libros={resumen?.destacados} cargando={cargando} />
    </section>
  )
}

function HeroNav() {
  const sesion = useSesion()

  return (
    <nav className="relative mx-auto flex h-[76px] w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-10">
      <Brand tono="oscuro" />
      <div className="flex items-center gap-2">
        <Link
          to="/catalogo"
          search={catalogoInicial}
          className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-white/80 transition-colors hover:bg-white/8 hover:text-white sm:flex"
        >
          Catálogo
        </Link>
        {sesion.visible ? (
          <>
            <Link
              to="/mis-reservas"
              className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-white/80 transition-colors hover:bg-white/8 hover:text-white sm:flex"
            >
              Mis reservas
            </Link>
            <button
              type="button"
              onClick={sesion.salir}
              className="flex h-10 cursor-pointer items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:border-white/45"
            >
              Salir
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-lima-400 text-pino-800 hover:bg-lima-500 flex h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </nav>
  )
}

function PildoraHero({ total }: { total: number | undefined }) {
  return (
    <span
      data-m="pill"
      className="inline-flex h-8 items-center gap-2 rounded-full border border-white/15 bg-white/6 px-3.5 text-[13px] font-medium text-white/85 backdrop-blur-sm"
    >
      <span
        aria-hidden
        className="bg-lima-400 size-1.5 rounded-full shadow-[0_0_0_4px_var(--color-lima-glow)]"
      />
      {total === undefined
        ? 'Biblioteca ASA · catálogo en línea'
        : `${total.toLocaleString('es')} ${total === 1 ? 'título' : 'títulos'} en el catálogo`}
    </span>
  )
}

function BuscadorHero() {
  const navigate = useNavigate()
  const [texto, setTexto] = useState('')

  return (
    <form
      role="search"
      data-m="bloque"
      className="mt-9 w-full max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault()
        const buscar = texto.trim()
        void navigate({
          to: '/catalogo',
          search: { ...catalogoInicial, ...(buscar ? { buscar } : {}) },
        })
      }}
    >
      <div className="bg-papel shadow-flotante focus-within:shadow-foco flex items-center gap-2 rounded-full p-2 pl-6 transition-shadow">
        <Search
          aria-hidden
          className="text-texto-4 size-5 flex-none"
          strokeWidth={2}
        />
        <input
          type="search"
          aria-label="Buscar en el catálogo"
          placeholder="Título, autor o ISBN"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          className="text-texto placeholder:text-texto-4 h-12 min-w-0 flex-1 bg-transparent text-base outline-none sm:h-14 sm:text-[17px]"
        />
        <button
          type="submit"
          className="bg-pino-950 text-papel hover:bg-pino-850 active:bg-pino-900 focus-visible:shadow-foco flex h-12 flex-none cursor-pointer items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors outline-none sm:h-14 sm:px-7"
        >
          Buscar
          <ArrowRight
            aria-hidden
            className="hidden size-4 sm:block"
            strokeWidth={2.2}
          />
        </button>
      </div>
    </form>
  )
}

function ChipsCategorias({
  categorias,
  cargando,
}: {
  categorias: string[] | undefined
  cargando: boolean
}) {
  if (cargando) {
    return (
      <div aria-hidden className="mt-6 flex flex-wrap justify-center gap-2">
        {[72, 96, 64, 88].map((ancho) => (
          <span
            key={ancho}
            className="animate-asa-pulse h-9 rounded-full bg-white/8"
            style={{ width: ancho }}
          />
        ))}
      </div>
    )
  }

  if (!categorias?.length) return null

  return (
    <ul
      aria-label="Categorías"
      data-m="chips"
      className="mt-6 flex flex-wrap justify-center gap-2"
    >
      {categorias.map((categoria) => (
        <li key={categoria}>
          <Link
            to="/catalogo"
            search={{ ...catalogoInicial, categoria }}
            className="hover:border-lima-400 hover:text-lima-400 flex h-9 items-center rounded-full border border-white/15 bg-white/4 px-4 text-[13px] font-medium text-white/85 transition-colors"
          >
            {categoria}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function TiraPortadas({
  libros,
  cargando,
}: {
  libros: Libro[] | undefined
  cargando: boolean
}) {
  if (!cargando && !libros?.length) return null

  return (
    <div className="relative z-10 -mt-24 px-5 sm:-mt-32">
      <ul
        aria-label="Libros del catálogo"
        className="tira-sin-barra mx-auto -mt-8 -mb-4 flex max-w-5xl snap-x justify-start gap-4 overflow-x-auto overflow-y-hidden px-1 py-10 sm:justify-center sm:gap-6"
      >
        {cargando
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i} aria-hidden className="flex-none">
                <span className="bg-pino-900 rounded-portada animate-asa-pulse block aspect-[2/3] w-[118px] sm:w-[136px]" />
              </li>
            ))
          : libros?.map((libro, i) => (
              <li
                key={libro.idLibro}
                data-m="portada"
                className="flex-none snap-start"
              >
                <PortadaTira libro={libro} indice={i} />
              </li>
            ))}
      </ul>
    </div>
  )
}

function PortadaTira({ libro, indice }: { libro: Libro; indice: number }) {
  const disponible = libro.disponibles > 0

  return (
    <Link
      to="/libros/$idLibro"
      params={{ idLibro: String(libro.idLibro) }}
      aria-label={`${libro.titulo}, ${disponible ? 'disponible' : 'sin stock'}`}
      className={cn(
        'group relative block rounded-[8px] pb-3 transition-transform duration-300 ease-out hover:-translate-y-1.5',
        indice % 2 === 1 && 'sm:translate-y-3 sm:hover:translate-y-1.5',
      )}
    >
      <PortadaLibro
        isbn={libro.isbn}
        titulo={libro.titulo}
        className="group-hover:shadow-card-hover w-[118px] transition-shadow duration-300 sm:w-[136px]"
      />
      <span
        aria-hidden
        className={cn(
          'absolute bottom-0 left-1/2 inline-flex h-6 -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold whitespace-nowrap shadow-sm',
          disponible
            ? 'bg-lima-400 text-pino-800'
            : 'bg-papel text-texto-3 ring-linea ring-1',
        )}
      >
        <span
          className={cn(
            'size-1.5 rounded-full',
            disponible ? 'bg-pino-800' : 'bg-texto-5',
          )}
        />
        {disponible ? 'Disponible' : 'Sin stock'}
      </span>
    </Link>
  )
}
