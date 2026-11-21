import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import { ArrowLeft, RotateCcw } from 'lucide-react'

import { Brand } from '@/components/layout/brand'
import { Button, buttonVariants } from '@/components/ui/button'

/** 404: ruta que no existe. Se pinta dentro del shell. */
export function PaginaNoEncontrada() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col items-center px-5 py-20 text-center">
      <p
        aria-hidden
        className="text-pino-800 font-serif text-[120px] leading-none italic sm:text-[160px]"
      >
        4
        <span className="text-lima-400 [-webkit-text-stroke:2px_var(--color-pino-800)]">
          0
        </span>
        4
      </p>
      <p className="eyebrow mt-6">Error 404</p>
      <h1 className="mt-2 text-[32px] leading-tight sm:text-[40px]">
        Página no <span className="titulo-serif">encontrada</span>
      </h1>
      <p className="text-texto-3 mt-3 max-w-sm text-[15px]">
        Esa ruta no existe o se movió. Vuelve al inicio o busca en el catálogo.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonVariants()}>
          <ArrowLeft aria-hidden />
          Volver al inicio
        </Link>
        <Link
          to="/catalogo"
          search={{ page: 1, pageSize: 12 }}
          className={buttonVariants({ variant: 'outline' })}
        >
          Ir al catálogo
        </Link>
      </div>
    </main>
  )
}

/** Error no controlado de la app: pantalla completa con reintento y vuelta al inicio. */
export function ErrorGeneral({ reset }: ErrorComponentProps) {
  return (
    <div className="bg-pino-950 text-papel relative isolate flex min-h-svh flex-col overflow-hidden px-5 py-8 sm:px-10">
      <div
        aria-hidden
        className="bg-lima-glow pointer-events-none absolute top-1/3 left-1/2 -z-10 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-[120px]"
      />
      <Brand tono="oscuro" />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center text-center">
        <p className="text-[13px] font-semibold tracking-[0.12em] text-white/60 uppercase">
          Algo salió mal
        </p>
        <h1 className="text-papel mt-3 text-[36px] leading-tight sm:text-[48px]">
          No pudimos mostrar
          <span className="titulo-serif text-lima-400 block">esta página.</span>
        </h1>
        <p className="mt-4 text-[15px] text-white/70">
          Fue un error inesperado. Puedes intentarlo de nuevo o volver al
          inicio.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="accent" onClick={reset}>
            <RotateCcw aria-hidden />
            Reintentar
          </Button>
          <a
            href="/"
            className={buttonVariants({
              variant: 'outline',
              className:
                'text-papel border-white/25 bg-transparent hover:border-white/60',
            })}
          >
            <ArrowLeft aria-hidden />
            Volver al inicio
          </a>
        </div>
      </main>
    </div>
  )
}
