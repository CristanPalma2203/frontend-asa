import { Search } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Encabezado de pantalla: eyebrow, título (con palabra en serif) y acción a la derecha. */
export function EncabezadoPagina({
  eyebrow,
  titulo,
  serif,
  detalle,
  accion,
}: {
  eyebrow: string
  titulo: string
  /** Palabra final del título en Instrument Serif itálica. */
  serif?: string
  detalle?: ReactNode
  accion?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-3">
      <p className="eyebrow">{eyebrow}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-[34px] leading-[1.02] sm:text-[44px]">
            {titulo}
            {serif ? (
              <>
                {' '}
                <span className="titulo-serif">{serif}</span>
              </>
            ) : null}
          </h1>
          {detalle ? <div className="text-texto-3 text-[15px]">{detalle}</div> : null}
        </div>
        {accion}
      </div>
    </header>
  )
}

/** Buscador de una lista (con icono de lupa). */
export function BuscadorLista({ className, ...props }: ComponentProps<'input'>) {
  return (
    <div className={cn('relative w-full max-w-md', className)}>
      <Search
        aria-hidden
        className="text-texto-4 pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2"
        strokeWidth={2}
      />
      <input
        type="search"
        {...props}
        className="border-linea-fuerte bg-card text-texto placeholder:text-texto-4 hover:border-separador focus-visible:border-pino-800 focus-visible:shadow-foco h-11 w-full rounded-full border pr-4 pl-11 text-sm transition-[border-color,box-shadow] outline-none"
      />
    </div>
  )
}
