import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'

import { cn } from '@/lib/utils'

export function FichaSinopsis({ sinopsis }: { sinopsis?: string | null }) {
  const [abierta, setAbierta] = useState(false)
  const id = useId()
  const texto = sinopsis?.trim()
  if (!texto) return null

  const parrafos = texto.split(/\n{2,}|\r\n\r\n/).filter(Boolean)
  const larga = texto.length > 420

  return (
    <section
      data-m="seccion"
      aria-labelledby={`${id}-titulo`}
      className="grid gap-4 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12"
    >
      <h2
        id={`${id}-titulo`}
        className="text-[24px] leading-[1.05] md:text-[34px]"
      >
        Sinopsis
      </h2>
      <div className="flex max-w-[65ch] flex-col gap-3">
        <div
          id={`${id}-texto`}
          className={cn(
            'relative overflow-hidden',
            larga && !abierta && 'max-h-[13rem]',
          )}
        >
          <div className="text-texto-2 flex flex-col gap-4 text-base leading-[1.75] md:text-[17px]">
            {parrafos.map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
          {larga && !abierta ? (
            <div
              aria-hidden
              className="from-hueso/0 to-hueso absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b"
            />
          ) : null}
        </div>
        {larga ? (
          <button
            type="button"
            aria-expanded={abierta}
            aria-controls={`${id}-texto`}
            onClick={() => setAbierta((v) => !v)}
            className="text-pino-800 focus-visible:shadow-foco inline-flex min-h-11 cursor-pointer items-center gap-1.5 self-start rounded-md text-[15px] font-semibold outline-none hover:underline"
          >
            {abierta ? 'Leer menos' : 'Leer más'}
            <ChevronDown
              aria-hidden
              className={cn(
                'size-4 transition-transform motion-reduce:transition-none',
                abierta && 'rotate-180',
              )}
              strokeWidth={2.2}
            />
          </button>
        ) : null}
      </div>
    </section>
  )
}
