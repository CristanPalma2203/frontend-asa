import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { Component, useRef, type ReactNode } from 'react'

import { Brand } from '@/components/layout/brand'
import { LibroError } from '@/components/layout/libro-error'
import { HeroBackdrop } from '@/features/biblioteca/components/hero-backdrop'
import { Button, buttonVariants } from '@/components/ui/button'
import { PalabrasAnimadas } from '@/components/ui/palabras-animadas'
import { useMotion } from '@/hooks/use-motion'
import { reveal, titleLines } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Tono = 'oscuro' | 'claro'

/**
 * Estructura común de las pantallas de error: pantalla completa (sin sidebar ni LuxIA), logo
 * arriba, texto y botones a la izquierda, libro a la derecha (arriba en móvil) y pie.
 */
function PantallaError({
  tono,
  etiqueta,
  linea1,
  linea2,
  texto,
  acciones,
  libro,
  detalle,
  logo,
  encima = false,
}: {
  tono: Tono
  etiqueta: string
  linea1: string
  linea2: string
  texto: string
  acciones: ReactNode
  libro: { titulo: string; subtitulo: string }
  detalle?: ReactNode
  logo: ReactNode
  /** Cubre toda la ventana aunque se pinte dentro del layout (ficha de un libro inexistente). */
  encima?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  useMotion(ref, (root) => {
    titleLines(root.querySelector('h1'), 0.05)
    reveal(root.querySelectorAll('[data-m]'), {
      y: 14,
      stagger: 0.07,
      delay: 0.2,
    })
  })

  const oscuro = tono === 'oscuro'
  return (
    <div
      data-pantalla-error
      className={cn(
        'pantalla-error relative isolate flex min-h-svh flex-col overflow-hidden px-6 py-7 sm:px-12 sm:py-9',
        oscuro
          ? 'pantalla-error--oscuro text-papel'
          : 'pantalla-error--claro text-tinta',
        encima && 'fixed inset-0 z-[1100] overflow-y-auto',
      )}
    >
      {/* El mismo fondo animado del hero; con movimiento reducido queda estático. */}
      <HeroBackdrop variante={oscuro ? 'oscuro' : 'celeste'} />
      <div className="relative z-10 mx-auto w-full max-w-[72rem] origin-left [&>a]:origin-left [&>a]:scale-[1.15]">
        {logo}
      </div>
      <main
        ref={ref}
        className="relative z-10 mx-auto grid w-full max-w-[72rem] flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-20"
      >
        <div className="order-2 flex flex-col items-start lg:order-1">
          <p
            data-m
            className={cn(
              'rounded-full border px-4 py-1.5 font-mono text-[0.8rem] font-medium tracking-[0.14em]',
              oscuro
                ? 'border-lima-400/40 bg-lima-400/10 text-lima-400'
                : 'border-rojo-600/25 bg-rojo-50 text-rojo-800',
            )}
          >
            {etiqueta}
          </p>
          <h1
            className={cn(
              'mt-6 text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.02] font-semibold tracking-[-0.035em]',
              oscuro ? 'text-papel' : 'text-tinta',
            )}
          >
            <PalabrasAnimadas texto={linea1} />{' '}
            <span
              className={cn(
                'titulo-serif block',
                oscuro ? 'text-lima-400' : 'text-pino-800',
              )}
            >
              <PalabrasAnimadas texto={linea2} cursiva />
            </span>
          </h1>
          <p
            data-m
            className={cn(
              'mt-6 max-w-[32rem] text-lg leading-relaxed lg:text-xl',
              oscuro ? 'text-white/80' : 'text-texto-2',
            )}
          >
            {texto}
          </p>
          <div data-m className="mt-8 flex flex-wrap gap-3">
            {acciones}
          </div>
          {detalle}
        </div>
        <div className="order-1 flex justify-center lg:order-2">
          <LibroError
            titulo={libro.titulo}
            subtitulo={libro.subtitulo}
            tono={oscuro ? 'oscuro' : 'celeste'}
          />
        </div>
      </main>
      <footer
        className={cn(
          'relative z-10 mx-auto w-full max-w-[72rem] text-sm',
          oscuro ? 'text-white/70' : 'text-texto-3',
        )}
      >
        Desarrollado por Alex Palma
      </footer>
    </div>
  )
}

/** 404: ruta que no existe (y ficha de un libro inexistente, con `encima`). */
export function PaginaNoEncontrada({ encima = false }: { encima?: boolean }) {
  return (
    <PantallaError
      tono="oscuro"
      encima={encima}
      logo={<Brand tono="oscuro" />}
      etiqueta="ERROR 404"
      linea1="Esta página se"
      linea2="perdió entre estantes"
      texto="Puede que el enlace esté mal escrito o que la página ya no exista."
      libro={{ titulo: 'Capítulo 404', subtitulo: 'Página no encontrada' }}
      acciones={
        <>
          <Link
            to="/"
            className={buttonVariants({ variant: 'accent', size: 'lg' })}
          >
            <ArrowLeft aria-hidden />
            Volver al inicio
          </Link>
          <Link
            to="/catalogo"
            search={{ page: 1, pageSize: 12 }}
            className={buttonVariants({
              variant: 'outline',
              size: 'lg',
              className:
                'border-white/80 bg-transparent text-white hover:border-white hover:bg-white/12 hover:text-white',
            })}
          >
            Ir al catálogo
          </Link>
        </>
      }
    />
  )
}

/** Cuerpo de la 500, sin depender del router (lo usa también LimiteError, fuera de él). */
function PaginaError({
  error,
  onReintentar,
  logo,
  inicio,
}: {
  error: unknown
  onReintentar: () => void
  logo: ReactNode
  inicio: ReactNode
}) {
  return (
    <PantallaError
      tono="claro"
      logo={logo}
      etiqueta="ERROR 500"
      linea1="Algo"
      linea2="salió mal"
      texto="No pudimos cargar esta página. Tus reservas están a salvo; inténtalo de nuevo en unos segundos."
      libro={{ titulo: 'Fe de erratas', subtitulo: 'Error del servidor' }}
      acciones={
        <>
          <Button type="button" size="lg" onClick={onReintentar}>
            <RotateCcw aria-hidden />
            Reintentar
          </Button>
          {inicio}
        </>
      }
      detalle={
        // Solo en desarrollo: el usuario nunca ve el mensaje técnico ni el stack.
        import.meta.env.DEV && error instanceof Error ? (
          <details className="text-texto-3 mt-8 max-w-md text-xs">
            <summary className="cursor-pointer">Detalle técnico</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap">
              {error.stack ?? error.message}
            </pre>
          </details>
        ) : null
      }
    />
  )
}

const claseInicio = buttonVariants({ variant: 'outline', size: 'lg' })

/** 500 dentro del router (errorComponent de la raíz): reintenta reseteando y recargando la ruta. */
export function ErrorGeneral({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  return (
    <PaginaError
      error={error}
      onReintentar={() => {
        reset()
        void router.invalidate()
      }}
      logo={<Brand tono="claro" />}
      inicio={
        <Link to="/" className={claseInicio}>
          <ArrowLeft aria-hidden />
          Volver al inicio
        </Link>
      }
    />
  )
}

/**
 * Límite de errores fuera del router (lo que falle por encima de las rutas): la misma 500,
 * con enlaces normales porque aquí no hay router. «Reintentar» llama a `onReset` (por
 * defecto recarga la página) y vuelve a pintar los hijos.
 */
export class LimiteError extends Component<
  { children: ReactNode; onReset?: () => void },
  { error: unknown }
> {
  state: { error: unknown } = { error: null }

  static getDerivedStateFromError(error: unknown) {
    return { error }
  }

  reintentar = () => {
    const onReset = this.props.onReset ?? (() => window.location.reload())
    onReset()
    this.setState({ error: null })
  }

  render() {
    if (this.state.error === null) return this.props.children
    return (
      <PaginaError
        error={this.state.error}
        onReintentar={this.reintentar}
        logo={<Brand tono="claro" nativo />}
        inicio={
          <a href="/" className={claseInicio}>
            <ArrowLeft aria-hidden />
            Volver al inicio
          </a>
        }
      />
    )
  }
}
