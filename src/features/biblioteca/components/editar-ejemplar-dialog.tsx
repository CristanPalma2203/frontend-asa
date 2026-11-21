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
import { useEditarEjemplar } from '@/features/biblioteca/hooks/use-ejemplares'
import {
  editarEjemplarSchema,
  type EjemplarForm,
} from '@/features/biblioteca/schemas/ejemplar.schema'
import type { EjemplarLista } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

/**
 * Edición del código de inventario de un ejemplar. El formulario se monta con `key` por ejemplar,
 * así sus valores por defecto son los de la fila sin sincronizar estado en un efecto.
 */
export function EditarEjemplarDialog({
  idLibro,
  ejemplar,
  onClose,
}: {
  idLibro: number
  ejemplar: EjemplarLista | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={ejemplar !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar ejemplar</DialogTitle>
        </DialogHeader>
        {ejemplar ? (
          <FormularioEdicion
            key={`${ejemplar.idEjemplar}-${ejemplar.rowVersion}`}
            idLibro={idLibro}
            ejemplar={ejemplar}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function FormularioEdicion({
  idLibro,
  ejemplar,
  onClose,
}: {
  idLibro: number
  ejemplar: EjemplarLista
  onClose: () => void
}) {
  const form = useForm<EjemplarForm>({
    resolver: zodResolver(editarEjemplarSchema),
    defaultValues: { codigoInventario: ejemplar.codigoInventario },
  })

  const editar = useEditarEjemplar(idLibro, {
    onSuccess: onClose,
    onError: (error) => {
      if (!(error instanceof ApiError)) return
      if (error.code === 'codigo-inventario-duplicado') {
        form.setError('codigoInventario', {
          message: mensajeDeError(error.code, error.detail ?? error.title),
        })
        return
      }
      const mensaje =
        error.errors?.CodigoInventario?.[0] ??
        error.errors?.codigoInventario?.[0]
      if (error.code === 'validacion-fallida' && mensaje) {
        form.setError('codigoInventario', { message: mensaje })
        return
      }
      form.setError('root', {
        message: mensajeDeError(error.code, error.detail || error.title),
      })
    },
  })

  const errores = form.formState.errors

  return (
    <form
      className="grid gap-1.5"
      onSubmit={form.handleSubmit((values) =>
        editar.mutate({
          ...values,
          idEjemplar: ejemplar.idEjemplar,
          rowVersion: ejemplar.rowVersion,
        }),
      )}
    >
      <Label
        htmlFor="codigo-editar"
        className="text-texto-2 text-[13px] font-semibold"
      >
        Código de inventario
      </Label>
      <Input
        id="codigo-editar"
        maxLength={30}
        className="font-mono"
        aria-invalid={errores.codigoInventario ? true : undefined}
        {...form.register('codigoInventario')}
      />
      {errores.codigoInventario ? (
        <p className="text-rojo-800 text-[13px] font-medium">
          {errores.codigoInventario.message}
        </p>
      ) : null}
      {errores.root ? (
        <p
          role="alert"
          className="border-rojo-600/20 bg-rojo-50 text-rojo-800 mt-2 rounded-xl border px-4 py-3 text-sm font-medium"
        >
          {errores.root.message}
        </p>
      ) : null}
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={editar.isPending}>
          Guardar
        </Button>
      </DialogFooter>
    </form>
  )
}
