import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Hueso } from '@/components/ui/hueso'
import { PalabrasAnimadas } from '@/components/ui/palabras-animadas'
import {
  isSessionActive,
  selectIsAdmin,
  selectIsLector,
  useAuthStore,
} from '@/features/auth/store'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { LibroNoEncontrado } from '@/features/biblioteca/components/libro-no-encontrado'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { ReservaError } from '@/features/biblioteca/components/reserva-error'
import { ReservarDialog } from '@/features/biblioteca/components/reservar-dialog'
import {
  textoDisponibles,
  totalActivos,
} from '@/features/biblioteca/disponibilidad'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import {
  useMisReservas,
  useReservar,
} from '@/features/biblioteca/hooks/use-reservas'
import type { LibroDetalle } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { ApiError } from '@/lib/api/client'
import { cardsIn, magnetic, pop, reveal, titleLines } from '@/lib/motion'
import { cn } from '@/lib/utils'

const Route = getRouteApi('/libros/$idLibro')

export function LibroPage() {
  const { idLibro } = Route.useParams()
  const id = Number(idLibro)
  const libro = useLibro(id)

  useEffect(() => {
    if (libro.data) document.title = `${libro.data.titulo} · ASA Biblioteca`
  }, [libro.data])

  // Mientras carga se pinta la ficha entera; solo los huecos de los datos hacen shimmer.
  if (libro.isPending) {
    return <Ficha />
  }

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

function Ficha({ detalle }: { detalle?: LibroDetalle }) {
  const cargando = !detalle
  const ref = useRef<HTMLDivElement>(null)

  // Al llegar el libro: portada (cardsIn), título por palabras y metadatos + bloque Reservar
  // (reveal, y 14, stagger 0.07, t 0.12). «Reservar» magnético.
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
      return magnetic(root)
    },
    [cargando],
  )

  return (
    <main className="px-5 pt-4 pb-14 lg:px-14">
      <Link
        to="/catalogo"
        search={{ page: 1, pageSize: 12 }}
        className="text-texto-3 hover:text-tinta mb-5 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2.2} />
        Catálogo
      </Link>

      <article className="bg-arena relative overflow-hidden rounded-2xl">
        <div className="bg-lima-glow pointer-events-none absolute -top-40 -left-40 size-[420px] rounded-full opacity-40 blur-[110px]" />

        <div
          ref={ref}
          className="relative grid gap-10 p-6 sm:p-10 md:grid-cols-[minmax(0,300px)_1fr] md:gap-14 lg:p-14"
        >
          <div data-m="portada" className="flex justify-center md:block">
            {detalle ? (
              <PortadaLibro
                isbn={detalle.isbn}
                titulo={detalle.titulo}
                tamano="L"
                className="w-[220px] shadow-[0_2px_4px_rgb(4_44_36/0.1),0_32px_56px_-20px_rgb(4_44_36/0.55)] md:w-full"
              />
            ) : (
              <Hueso
                cargando
                alto={330}
                radio={6}
                llenar
                className="aspect-[2/3] w-[220px] md:w-full"
              />
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            {detalle ? (
              <>
                <p className="eyebrow">{detalle.categoria}</p>
                <h1 className="mt-3 text-[34px] leading-[1.04] sm:text-[48px]">
                  <PalabrasAnimadas texto={detalle.titulo} />
                </h1>
                <p className="text-texto-2 mt-3 text-lg">
                  <span className="text-texto-3">de </span>
                  {detalle.autor}
                </p>
              </>
            ) : (
              <div
                aria-busy
                aria-label="Cargando libro"
                className="flex flex-col"
              >
                <Hueso cargando ancho={96} alto={11} />
                <div className="mt-4 flex flex-col gap-2.5">
                  <Hueso cargando ancho="85%" alto={40} radio={6} />
                  <Hueso cargando ancho="55%" alto={40} radio={6} />
                </div>
                <Hueso cargando ancho="40%" alto={18} className="mt-4" />
              </div>
            )}

            <dl
              data-m="meta"
              className="border-linea-fuerte/70 mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-y py-5 sm:grid-cols-3"
            >
              <Dato etiqueta="ISBN" mono cargando={cargando}>
                {detalle?.isbn}
              </Dato>
              <Dato etiqueta="Categoría" cargando={cargando}>
                {detalle?.categoria}
              </Dato>
              <Dato etiqueta="Ejemplares" mono cargando={cargando}>
                {detalle
                  ? `${detalle.disponibles} de ${totalActivos(detalle.ejemplares)}`
                  : null}
              </Dato>
            </dl>

            <div data-m="meta">
              {detalle ? (
                <AccionReserva detalle={detalle} />
              ) : (
                <AccionReservaCargando />
              )}
            </div>
          </div>
        </div>
      </article>
    </main>
  )
}

function Dato({
  etiqueta,
  mono = false,
  cargando = false,
  children,
}: {
  etiqueta: string
  mono?: boolean
  cargando?: boolean
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-texto-3 text-xs font-medium">{etiqueta}</dt>
      <dd
        className={cn(
          'text-texto mt-1 truncate',
          mono ? 'font-mono text-[13px]' : 'text-[15px]',
        )}
      >
        {cargando ? (
          <Hueso cargando ancho="70%" alto={16} className="mt-0.5" />
        ) : (
          children
        )}
      </dd>
    </div>
  )
}

/** «Reservar» visible desde el inicio, deshabilitado hasta que llega el libro. */
function AccionReservaCargando() {
  return (
    <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
      <Button type="button" size="lg" disabled>
        Reservar
      </Button>
      <Hueso cargando ancho={128} alto={16} />
    </div>
  )
}

/**
 * Un solo botón «Reservar»: el backend asigna el ejemplar con `{ lectorId, libroId }`.
 * Sin sesión lleva a /login y vuelve a la ficha.
 */
function AccionReserva({ detalle }: { detalle: LibroDetalle }) {
  const reservar = useReservar()
  const activas = useMisReservas('Activa', 1, 50)
  const [abierto, setAbierto] = useState(false)
  const [codigo, setCodigo] = useState<string | null>(null)
  const isAdmin = useAuthStore(selectIsAdmin)
  const isLector = useAuthStore(selectIsLector)
  const sesion = useAuthStore(isSessionActive)
  const lectorId = useAuthStore((state) => state.lectorId)

  if (isAdmin) return null

  const yaReservado =
    isLector &&
    activas.data?.items.some(
      (reserva) =>
        reserva.idLibro === detalle.idLibro && reserva.estado === 'Activa',
    )
  const errorReserva =
    reservar.error instanceof ApiError ? reservar.error : null
  const sinStock = detalle.disponibles === 0
  const idDisponibilidad = `disponibilidad-${detalle.idLibro}`

  function confirmarReserva() {
    if (!lectorId) return
    reservar.mutate(
      { lectorId, libroId: detalle.idLibro },
      {
        onSuccess: (reserva) => {
          setAbierto(false)
          setCodigo(reserva.codigoInventario)
        },
        // Sin stock no hay nada que confirmar: cierro el diálogo y queda a la vista el mensaje.
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'sin-stock')
            setAbierto(false)
        },
      },
    )
  }

  const disponibilidad = (
    <p
      id={idDisponibilidad}
      className={cn(
        'flex items-center gap-2 text-sm font-medium',
        sinStock ? 'text-texto-3' : 'text-pino-800',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2 rounded-full',
          sinStock
            ? 'bg-texto-5'
            : 'bg-lima-400 shadow-[0_0_0_3px_var(--color-lima-glow)]',
        )}
      />
      {sinStock
        ? 'Sin ejemplares disponibles'
        : textoDisponibles(detalle.disponibles)}
    </p>
  )

  return (
    <div className="mt-8 flex flex-col gap-4">
      {codigo ? <ExitoReserva codigo={codigo} /> : null}

      {codigo ? null : yaReservado ? (
        <p className="text-texto-2 text-[15px]">
          Ya lo tienes reservado.{' '}
          <Link
            to="/mis-reservas"
            className="text-pino-800 font-semibold underline-offset-4 hover:underline"
          >
            Mis reservas
          </Link>
        </p>
      ) : (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
          {sinStock ? (
            <Button
              type="button"
              size="lg"
              disabled
              aria-describedby={idDisponibilidad}
            >
              Reservar
            </Button>
          ) : !sesion ? (
            <Link
              to="/login"
              search={{ redirect: `/libros/${detalle.idLibro}` }}
              aria-describedby={idDisponibilidad}
              data-magnetic
              className={buttonVariants({ size: 'lg' })}
            >
              Reservar
            </Link>
          ) : isLector ? (
            <Button
              type="button"
              size="lg"
              data-magnetic
              aria-describedby={idDisponibilidad}
              onClick={() => setAbierto(true)}
            >
              Reservar
            </Button>
          ) : null}
          {disponibilidad}
        </div>
      )}

      {errorReserva && !codigo ? (
        <ReservaError
          code={errorReserva.code}
          fallback={errorReserva.detail || errorReserva.title}
          onRetry={confirmarReserva}
        />
      ) : null}

      <ReservarDialog
        abierto={abierto}
        onOpenChange={setAbierto}
        titulo={detalle.titulo}
        deshabilitado={reservar.isPending || !lectorId}
        onConfirmar={confirmarReserva}
      />
    </div>
  )
}

/** «Tu ejemplar: …» con el código real de la API; entra con pop. */
function ExitoReserva({ codigo }: { codigo: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useMotion(ref, (root) => pop(root))
  return (
    <div
      ref={ref}
      role="status"
      className="bg-card border-linea shadow-card flex items-start gap-3 rounded-xl border p-4"
    >
      <CheckCircle2
        aria-hidden
        className="text-exito-600 mt-0.5 size-5 flex-none"
      />
      <div className="flex flex-col gap-1">
        <p className="text-tinta font-semibold">Tu ejemplar: {codigo}</p>
        <p className="text-texto-3 text-sm">
          Lo encontrarás en{' '}
          <Link
            to="/mis-reservas"
            className="text-pino-800 font-semibold underline-offset-4 hover:underline"
          >
            Mis reservas
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
