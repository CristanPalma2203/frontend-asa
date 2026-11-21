import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mensajeDeError } from '@/features/biblioteca/errores'
import type { EjemplarLista } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

/** Confirmación antes de desactivar un ejemplar (DELETE /api/ejemplares/{id}). */
export function DesactivarEjemplarDialog({
  ejemplar,
  onClose,
  onConfirmar,
  pending,
  error,
}: {
  ejemplar: EjemplarLista | null
  onClose: () => void
  onConfirmar: (ejemplar: EjemplarLista) => void
  pending: boolean
  error: unknown
}) {
  return (
    <Dialog
      open={ejemplar !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desactivar ejemplar</DialogTitle>
          <DialogDescription>
            El ejemplar{' '}
            <span className="text-tinta font-mono">
              {ejemplar?.codigoInventario}
            </span>{' '}
            dejará de estar disponible para reservas.
          </DialogDescription>
        </DialogHeader>
        {error instanceof ApiError ? (
          <p
            role="alert"
            className="border-rojo-600/20 bg-rojo-50 text-rojo-800 rounded-xl border px-4 py-3 text-sm font-medium"
          >
            {mensajeDeError(error.code, error.detail || error.title)}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!ejemplar || pending}
            onClick={() => ejemplar && onConfirmar(ejemplar)}
          >
            Desactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
