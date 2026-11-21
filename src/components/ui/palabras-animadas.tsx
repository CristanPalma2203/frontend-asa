import { Fragment } from 'react'

import { cn } from '@/lib/utils'

export function PalabrasAnimadas({
  texto,
  cursiva = false,
}: {
  texto: string
  cursiva?: boolean
}) {
  const palabras = texto.split(/\s+/).filter(Boolean)
  return (
    <>
      {palabras.map((palabra, i) => (
        <Fragment key={`${palabra}-${i}`}>
          {i > 0 ? ' ' : null}
          <span
            data-mascara
            className={cn(
              '-my-[0.12em] inline-block overflow-clip py-[0.12em] align-bottom',
              cursiva && 'pe-[0.08em]',
            )}
          >
            <span data-tl className="inline-block">
              {palabra}
            </span>
          </span>
        </Fragment>
      ))}
    </>
  )
}
