import { Link } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

type Tono = 'oscuro' | 'claro'

export function Brand({
  tono = 'oscuro',
  className,
  onClick,
  nativo = false,
}: {
  tono?: Tono
  className?: string
  onClick?: () => void
  nativo?: boolean
}) {
  const clases = cn(
    'inline-flex items-center gap-2.5 rounded-lg no-underline hover:no-underline',
    tono === 'oscuro' ? 'text-papel' : 'text-tinta',
    className,
  )
  const contenido = (
    <>
      <span
        aria-hidden
        className={cn(
          'grid size-7 place-items-center rounded-lg text-sm font-bold',
          tono === 'oscuro'
            ? 'bg-lima-400 text-pino-800'
            : 'bg-pino-950 text-lima-400',
        )}
      >
        A
      </span>
      <span className="text-lg font-semibold tracking-[-0.02em]">
        ASA{' '}
        <span
          className={cn(
            'font-serif text-xl font-normal tracking-normal italic',
            tono === 'oscuro' ? 'text-lima-400' : 'text-pino-800',
          )}
        >
          Biblioteca
        </span>
      </span>
    </>
  )
  if (nativo)
    return (
      <a href="/" onClick={onClick} className={clases}>
        {contenido}
      </a>
    )
  return (
    <Link to="/" onClick={onClick} className={clases}>
      {contenido}
    </Link>
  )
}
