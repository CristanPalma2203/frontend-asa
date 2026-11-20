import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mensajeDeError } from '@/features/biblioteca/errores'
import type { Libro } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

export function DesactivarLibroDialog({
  libro,
  onClose,
  onConfirmar,
  pending,
  error,
}: {
  libro: Libro | null
  onClose: () => void
  onConfirmar: (libro: Libro) => void
  pending: boolean
  error: unknown
}) {
  return (
    <Dialog open={libro !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desactivar {libro?.titulo}</DialogTitle>
        </DialogHeader>
        <p className="text-sm">El libro dejará de aparecer en el catálogo.</p>
        {error instanceof ApiError ? (
          <p className="text-sm text-destructive">
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
            disabled={!libro || pending}
            onClick={() => libro && onConfirmar(libro)}
          >
            Desactivar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
