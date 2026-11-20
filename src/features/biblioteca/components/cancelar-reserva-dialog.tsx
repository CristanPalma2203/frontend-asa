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
import type { Reserva } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

export function CancelarReservaDialog({
  reserva,
  onClose,
  onConfirmar,
  pending,
  error,
}: {
  reserva: Reserva | null
  onClose: () => void
  onConfirmar: (reserva: Reserva) => void
  pending: boolean
  error: unknown
}) {
  return (
    <Dialog open={reserva !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar reserva</DialogTitle>
          <DialogDescription>
            Se libera {reserva?.titulo} ({reserva?.codigoInventario}).
          </DialogDescription>
        </DialogHeader>
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
            disabled={pending || !reserva}
            onClick={() => {
              if (!reserva) return
              onConfirmar(reserva)
            }}
          >
            Cancelar reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
