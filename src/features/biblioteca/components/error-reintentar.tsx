import { Button } from '@/components/ui/button'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { ApiError } from '@/lib/api/client'

/** Mensaje de error de una consulta (traducido por `code`) con botón para reintentar. */
export function ErrorReintentar({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <div className="mt-4">
      <p className="text-sm">
        {error instanceof ApiError
          ? mensajeDeError(error.code, error.detail || error.title)
          : 'Error de red.'}
      </p>
      <Button type="button" className="mt-3" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}
