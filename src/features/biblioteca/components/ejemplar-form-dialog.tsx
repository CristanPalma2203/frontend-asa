import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { useCrearEjemplar } from '@/features/biblioteca/hooks/use-ejemplares'
import {
  ejemplarSchema,
  type EjemplarForm,
} from '@/features/biblioteca/schemas/ejemplar.schema'
import { ApiError } from '@/lib/api/client'

/** Alta de un ejemplar. Muestra en el campo `codigo-inventario-duplicado` y los errores de validación. */
export function EjemplarFormDialog({
  idLibro,
  abierto,
  onOpenChange,
}: {
  idLibro: number
  abierto: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<EjemplarForm>({
    resolver: zodResolver(ejemplarSchema),
    defaultValues: { codigoInventario: '' },
  })

  const crear = useCrearEjemplar(idLibro, {
    onSuccess: () => {
      onOpenChange(false)
      form.reset()
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return
      if (error.code === 'codigo-inventario-duplicado') {
        form.setError('codigoInventario', {
          message: mensajeDeError(error.code, error.detail ?? error.title),
        })
      }
      const mensaje =
        error.errors?.CodigoInventario?.[0] ??
        error.errors?.codigoInventario?.[0]
      if (error.code === 'validacion-fallida' && mensaje) {
        form.setError('codigoInventario', { message: mensaje })
      }
    },
  })

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar ejemplar</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-1.5"
          onSubmit={form.handleSubmit((values) => crear.mutate(values))}
        >
          <Label
            htmlFor="codigo"
            className="text-texto-2 text-[13px] font-semibold"
          >
            Código de inventario
          </Label>
          <Input
            id="codigo"
            maxLength={30}
            placeholder="BIB-001"
            className="font-mono"
            aria-invalid={
              form.formState.errors.codigoInventario ? true : undefined
            }
            {...form.register('codigoInventario')}
          />
          {form.formState.errors.codigoInventario ? (
            <p className="text-rojo-800 text-[13px] font-medium">
              {form.formState.errors.codigoInventario.message}
            </p>
          ) : null}
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={crear.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
