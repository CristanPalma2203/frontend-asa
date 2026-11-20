import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { mensajeDeError } from '@/features/biblioteca/errores'

/**
 * Error al reservar, traducido por `code`. Con `reserva-duplicada` enlaza a Mis reservas y con
 * `ejemplar-ya-reservado` (otra persona tomó la copia) ofrece reintentar.
 */
export function ReservaError({
  code,
  fallback,
  onRetry,
}: {
  code: string | undefined
  fallback: string
  onRetry: () => void
}) {
  return (
    <div className="mt-3 text-sm">
      <p>{mensajeDeError(code, fallback)}</p>
      {code === 'reserva-duplicada' ? (
        <Link to="/mis-reservas" className="mt-1 inline-block font-semibold text-verde underline">
          Mis reservas
        </Link>
      ) : null}
      {code === 'ejemplar-ya-reservado' ? (
        <Button type="button" size="sm" className="mt-2" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}
