import { Hueso, PortadaConCarga } from '@/components/ui/hueso'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import { cn } from '@/lib/utils'

// Portadas desde Open Library por ISBN. `?default=false` hace que responda 404 si no hay
// portada, y en ese caso se muestra el respaldo con el título.

function isbnLimpio(isbn: string) {
  return isbn.replace(/[^0-9Xx]/g, '')
}

/**
 * Portada con el estilo Corelux. El tamaño lo pone `className` (ancho; el alto sale de la
 * proporción 2:3). Mientras la imagen carga, shimmer de boneyard en el hueco (PortadaConCarga).
 * Sin ISBN o sin portada en Open Library muestra el título sobre pino.
 */
export function PortadaLibro({
  isbn,
  titulo,
  tamano = 'M',
  className,
}: {
  isbn: string
  titulo: string
  tamano?: 'S' | 'M' | 'L'
  className?: string
}) {
  const limpio = isbnLimpio(isbn)
  const base = cn('rounded-portada shadow-portada aspect-[2/3] shrink-0', className)
  const respaldo = <PortadaRespaldo titulo={titulo} className={base} />

  if (limpio.length === 0) return respaldo

  return (
    <PortadaConCarga
      src={`https://covers.openlibrary.org/b/isbn/${limpio}-${tamano}.jpg?default=false`}
      className={cn(base, 'bg-pino-900')}
      alto={tamano === 'L' ? 252 : 168}
      radio={6}
      respaldo={respaldo}
    />
  )
}

function PortadaRespaldo({ titulo, className }: { titulo: string; className: string }) {
  return (
    <div
      role="img"
      aria-label={titulo}
      className={cn(
        className,
        'bg-pino-900 @container flex items-end overflow-hidden p-[8%] ring-1 ring-white/10 ring-inset',
      )}
    >
      <span className="text-papel line-clamp-4 font-serif text-[min(15px,14cqw)] leading-[1.1] italic">
        {titulo}
      </span>
    </div>
  )
}

/**
 * Portada pequeña de una reserva. La reserva no trae ISBN: lo toma del detalle del libro y,
 * mientras llega, deja el hueco con shimmer.
 */
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
    return <Hueso cargando ancho={56} alto={84} radio={6} className={cn('w-14 shrink-0', className)} />
  }
  return (
    <PortadaLibro isbn={libro.data?.isbn ?? ''} titulo={titulo} className={cn('w-14', className)} />
  )
}
