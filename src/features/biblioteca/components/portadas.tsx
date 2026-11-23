import { BookOpen } from 'lucide-react'

import { Hueso, PortadaConCarga } from '@/components/ui/hueso'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import { cn } from '@/lib/utils'

const ARTICULOS = new Set([
  'el',
  'la',
  'los',
  'las',
  'un',
  'una',
  'unos',
  'unas',
  'de',
  'del',
  'y',
  'o',
  'a',
  'en',
  'the',
  'an',
  'of',
])

function inicialesTitulo(titulo: string) {
  const palabras = titulo.trim().split(/\s+/).filter(Boolean)
  const utiles = palabras.filter(
    (p) => !ARTICULOS.has(p.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')),
  )
  const base = utiles.length > 0 ? utiles : palabras
  return base
    .slice(0, 2)
    .map((p) => {
      const letra = [...p].find((c) => /\p{L}|\p{N}/u.test(c))
      return letra?.toUpperCase() ?? ''
    })
    .join('')
}

function isbnLimpio(isbn: string) {
  return isbn.replace(/[^0-9Xx]/g, '')
}

export function PortadaLibro({
  isbn,
  titulo,
  tamano = 'M',
  className,
  contener = false,
}: {
  isbn: string
  titulo: string
  tamano?: 'S' | 'M' | 'L'
  className?: string
  contener?: boolean
}) {
  const limpio = isbnLimpio(isbn)
  const base = cn(
    'rounded-portada shadow-portada aspect-[2/3] w-full max-w-full shrink-0 overflow-hidden self-start',
    className,
  )
  const respaldo = <PortadaRespaldo titulo={titulo} className={base} />

  if (limpio.length === 0) return respaldo

  return (
    <PortadaConCarga
      src={`https://covers.openlibrary.org/b/isbn/${limpio}-${tamano}.jpg?default=false`}
      className={cn(base, 'bg-lima-wash')}
      alto={tamano === 'L' ? 252 : 168}
      radio={6}
      respaldo={respaldo}
      contener={contener}
    />
  )
}

function PortadaRespaldo({
  titulo,
  className,
}: {
  titulo: string
  className: string
}) {
  const iniciales = inicialesTitulo(titulo)

  return (
    <div
      role="img"
      aria-label={titulo}
      className={cn(
        className,
        'bg-lima-wash text-pino-800 ring-pino-800/10 @container flex items-center justify-center ring-1 ring-inset',
      )}
    >
      {iniciales ? (
        <span
          aria-hidden
          className="font-serif text-[min(1.75rem,42cqw)] leading-none font-medium tracking-tight"
        >
          {iniciales}
        </span>
      ) : (
        <BookOpen
          aria-hidden
          className="size-[min(1.75rem,40cqw)]"
          strokeWidth={1.6}
        />
      )}
    </div>
  )
}

export function MiniPortada({
  idLibro,
  titulo,
  className,
}: {
  idLibro: number
  titulo: string
  className?: string
}) {
  const libro = useLibro(idLibro)
  if (libro.isPending) {
    return (
      <Hueso
        cargando
        alto={84}
        radio={6}
        llenar
        className={cn('aspect-[2/3] w-14 shrink-0 self-start', className)}
      />
    )
  }
  return (
    <PortadaLibro
      isbn={libro.data?.isbn ?? ''}
      titulo={titulo}
      className={cn('w-14', className)}
    />
  )
}
