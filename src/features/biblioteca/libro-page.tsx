import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { Hueso } from '@/components/ui/hueso'
import { PalabrasAnimadas } from '@/components/ui/palabras-animadas'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { FichaDatos } from '@/features/biblioteca/components/ficha-datos'
import {
  FichaReserva,
  FichaReservaCargando,
} from '@/features/biblioteca/components/ficha-reserva'
import { FichaSinopsis } from '@/features/biblioteca/components/ficha-sinopsis'
import { LibroNoEncontrado } from '@/features/biblioteca/components/libro-no-encontrado'
import { MasDeCategoria } from '@/features/biblioteca/components/mas-de-categoria'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { totalActivos } from '@/features/biblioteca/disponibilidad'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import type { LibroDetalle } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { ApiError } from '@/lib/api/client'
import { cardsIn, magnetic, reveal, titleLines } from '@/lib/motion'

const Route = getRouteApi('/libros/$idLibro')

export function LibroPage() {
  const { idLibro } = Route.useParams()
  const id = Number(idLibro)
  const libro = useLibro(id)

  useEffect(() => {
    if (libro.data) document.title = `${libro.data.titulo} · ASA Biblioteca`
  }, [libro.data])

  // Mientras carga se pinta la ficha entera; solo los huecos de los datos hacen shimmer.
  if (libro.isPending) return <Ficha />

  if (libro.isError) {
    const error = libro.error
    if (
      error instanceof ApiError &&
      (error.code === 'libro-no-encontrado' || error.status === 404)
    ) {
      return <LibroNoEncontrado />
    }
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-10 lg:px-14">
        <section className="bg-card border-linea shadow-card rounded-xl border p-8">
          <h1 className="text-2xl">No se pudo cargar el libro</h1>
          <ErrorReintentar error={error} onRetry={() => void libro.refetch()} />
        </section>
      </main>
    )
  }

  return <Ficha detalle={libro.data} />
}

/**
 * Ficha editorial: tarjeta con portada, categoría, título, autor, datos y reserva; debajo la
 * sinopsis (solo si llega) y «Más de esta categoría». En móvil todo va centrado y en una
 * columna, con «Reservar» fijo abajo.
 */
function Ficha({ detalle }: { detalle?: LibroDetalle }) {
  const cargando = !detalle
  const ref = useRef<HTMLElement>(null)
  const total = detalle ? totalActivos(detalle.ejemplares) : 0

  // Al llegar el libro: portada (cardsIn), título por palabras, datos y reserva (reveal) y las
  // secciones de abajo. «Reservar» magnético. Con movimiento reducido todo aparece al instante.
  useMotion(
    ref,
    (root) => {
      if (cargando) return
      cardsIn(root.querySelector('[data-m="portada"]'))
      titleLines(root.querySelector('h1'))
      reveal(root.querySelectorAll('[data-m="meta"]'), {
        y: 14,
        stagger: 0.07,
        delay: 0.12,
      })
      reveal(root.querySelectorAll('[data-m="seccion"]'), {
        y: 14,
        stagger: 0.12,
        delay: 0.24,
      })
      return magnetic(root)
    },
    [cargando],
  )

  return (
    <main
      ref={ref}
      // Móvil: hueco abajo para la barra fija de «Reservar».
      className="flex flex-col gap-16 px-0 pt-0 pb-32 md:gap-20 md:px-5 md:pt-4 md:pb-14 lg:px-12"
    >
      {detalle ? (
        <nav
          aria-label="Ruta"
          className="text-texto-3 hidden items-center gap-2 text-sm font-medium md:flex"
        >
          <Link
            to="/catalogo"
            search={{ page: 1, pageSize: 12 }}
            className="text-pino-800"
          >
            Catálogo
          </Link>
          <span aria-hidden className="text-separador">
            /
          </span>
          <Link
            to="/catalogo"
            search={{ page: 1, pageSize: 12, categoria: detalle.categoria }}
            className="text-pino-800"
          >
            {detalle.categoria}
          </Link>
          <span aria-hidden className="text-separador">
            /
          </span>
          <span aria-current="page" className="text-tinta truncate">
            {detalle.titulo}
          </span>
        </nav>
      ) : null}

      <article className="bg-arena relative overflow-hidden rounded-b-[28px] md:mt-0 md:rounded-[32px] md:shadow-[0_1px_2px_rgb(4_44_36/0.04),0_20px_50px_-30px_rgb(4_44_36/0.25)]">
        <div
          aria-hidden
          className="bg-lima-glow pointer-events-none absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full opacity-40 blur-[90px] md:-top-20 md:-left-20 md:size-[640px] md:translate-x-0"
        />

        <div className="relative grid items-start gap-8 px-5 pt-8 pb-7 text-center md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] md:gap-14 md:p-12 md:text-left lg:gap-16 lg:p-14">
          <div data-m="portada" className="flex justify-center md:block">
            {detalle ? (
              <PortadaLibro
                isbn={detalle.isbn}
                titulo={detalle.titulo}
                tamano="L"
                className="w-[184px] shadow-[0_2px_4px_rgb(4_44_36/0.12),0_46px_70px_-28px_rgb(4_44_36/0.6)] transition-transform duration-500 ease-out hover:[transform:perspective(1200px)_translateY(-8px)_rotateY(-6deg)] motion-reduce:transition-none motion-reduce:hover:transform-none md:w-full"
              />
            ) : (
              <Hueso
                cargando
                alto={330}
                radio={6}
                llenar
                className="aspect-[2/3] w-[184px] md:w-full"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-7 md:pt-2">
            {detalle ? (
              <div className="flex flex-col items-center gap-3 md:items-start md:gap-4">
                <Link
                  to="/catalogo"
                  search={{
                    page: 1,
                    pageSize: 12,
                    categoria: detalle.categoria,
                  }}
                  className="bg-pino-800/8 text-pino-800 hover:bg-pino-800/14 inline-flex h-7 items-center rounded-full px-3 text-[11px] font-semibold tracking-[0.12em] uppercase hover:no-underline"
                >
                  {detalle.categoria}
                </Link>
                <h1 className="text-[32px] leading-[1.02] font-semibold tracking-[-0.04em] text-balance md:text-[48px] lg:text-[64px] lg:leading-none">
                  <PalabrasAnimadas texto={detalle.titulo} />
                </h1>
                <p className="flex items-baseline justify-center gap-2.5 md:justify-start">
                  <span className="text-texto-3 text-[13px] font-medium md:text-[15px]">
                    de
                  </span>
                  <Link
                    to="/catalogo"
                    search={{ page: 1, pageSize: 12, autor: detalle.autor }}
                    className="titulo-serif text-[23px] decoration-1 underline-offset-[6px] hover:underline md:text-[34px]"
                  >
                    {detalle.autor}
                  </Link>
                </p>
              </div>
            ) : (
              <div
                aria-busy
                aria-label="Cargando libro"
                className="flex flex-col items-center gap-3 md:items-start"
              >
                <Hueso cargando ancho={96} alto={26} radio={999} />
                <Hueso cargando ancho="80%" alto={44} radio={8} />
                <Hueso cargando ancho="45%" alto={24} radio={6} />
              </div>
            )}

            <div className="text-left max-md:-mx-1">
              <FichaDatos detalle={detalle} totalActivos={total} />
            </div>

            <div className="text-left">
              {detalle ? (
                <FichaReserva detalle={detalle} total={total} />
              ) : (
                <FichaReservaCargando />
              )}
            </div>
          </div>
        </div>
      </article>

      {detalle ? (
        <div className="flex flex-col gap-16 px-5 md:gap-20 md:px-0">
          <FichaSinopsis sinopsis={detalle.sinopsis} />
          <MasDeCategoria
            categoria={detalle.categoria}
            idActual={detalle.idLibro}
          />
        </div>
      ) : null}
    </main>
  )
}
