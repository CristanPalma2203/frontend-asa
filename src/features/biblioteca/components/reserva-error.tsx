import { Link } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'

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
    <div
      role="alert"
      className="border-rojo-600/20 bg-rojo-50 text-rojo-800 flex items-start gap-3 rounded-xl border p-4 text-sm"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-[18px] flex-none" strokeWidth={2} />
      <div className="flex flex-col items-start gap-2">
        <p className="font-medium">{mensajeDeError(code, fallback)}</p>
        {code === 'reserva-duplicada' ? (
          <Link to="/mis-reservas" className="font-semibold underline underline-offset-4">
            Mis reservas
          </Link>
        ) : null}
        {code === 'ejemplar-ya-reservado' ? (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
