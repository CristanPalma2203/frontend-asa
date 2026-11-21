import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function ReservarDialog({
  abierto,
  onOpenChange,
  titulo,
  deshabilitado,
  pendiente,
  onConfirmar,
}: {
  abierto: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  deshabilitado: boolean
  pendiente: boolean
  onConfirmar: () => void
}) {
  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reservar {titulo}</DialogTitle>
          <DialogDescription>
            Se asignará el primer ejemplar disponible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={deshabilitado}
            cargando={pendiente}
            onClick={onConfirmar}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
