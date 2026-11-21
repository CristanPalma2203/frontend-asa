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
        <p className="text-texto-2 text-[15px] leading-relaxed">
          El libro dejará de aparecer en el catálogo.
        </p>
        {error instanceof ApiError ? (
          <p role="alert" className="border-rojo-600/20 bg-rojo-50 text-rojo-800 rounded-xl border px-4 py-3 text-sm font-medium">
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
