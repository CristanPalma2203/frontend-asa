import { Fragment } from 'react'

import { cn } from '@/lib/utils'

/**
 * Texto partido por palabras para titleLines (lib/motion.ts): cada palabra va en una máscara
 * inline-block con overflow clip (no hidden: no crea contenedor de scroll) y su interior ([data-tl])
 * es lo que sube. El padding-block de 0.12em compensado con margin-block −0.12em deja sitio a
 * ascendentes y descendentes sin cambiar el alto de la línea; en cursiva se añade 0.08em al final
 * para no cortar la inclinación. Los espacios quedan como texto: el nombre accesible no cambia.
 */
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
