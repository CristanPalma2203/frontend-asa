import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Campo } from '@/components/ui/campo'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { mensajeDeError } from '@/features/biblioteca/errores'
import {
  libroSchema,
  type LibroForm,
} from '@/features/biblioteca/schemas/libro.schema'
import type { Libro } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

/** Alta o edición de un libro. Pinta en cada campo los errores de la API (isbn-duplicado, validación). */
export function LibroFormDialog({
  abierto,
  libro,
  onClose,
  onSubmit,
  pending,
  error,
}: {
  abierto: boolean
  libro: Libro | null
  onClose: () => void
  onSubmit: (values: LibroForm) => void
  pending: boolean
  error: unknown
}) {
  const form = useForm<LibroForm>({
    resolver: zodResolver(libroSchema),
    defaultValues: libro ?? { isbn: '', titulo: '', autor: '', categoria: '' },
  })

  useEffect(() => {
    form.reset(libro ?? { isbn: '', titulo: '', autor: '', categoria: '' })
  }, [form, libro, abierto])

  useEffect(() => {
    if (!(error instanceof ApiError)) return
    if (error.code === 'isbn-duplicado') {
      form.setError('isbn', {
        message: mensajeDeError(error.code, error.detail ?? error.title),
      })
    }
    aplicarValidacion(form, error)
  }, [error, form])

  return (
    <Dialog open={abierto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{libro ? 'Editar libro' : 'Crear libro'}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
          <Campo label="ISBN" error={form.formState.errors.isbn?.message}>
            <Input {...form.register('isbn')} />
          </Campo>
          <Campo label="Título" error={form.formState.errors.titulo?.message}>
            <Input {...form.register('titulo')} />
          </Campo>
          <Campo label="Autor" error={form.formState.errors.autor?.message}>
            <Input {...form.register('autor')} />
          </Campo>
          <Campo
            label="Categoría"
            error={form.formState.errors.categoria?.message}
          >
            <Input {...form.register('categoria')} />
          </Campo>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function aplicarValidacion(form: UseFormReturn<LibroForm>, error: ApiError) {
  if (error.code !== 'validacion-fallida' || !error.errors) return
  for (const [key, messages] of Object.entries(error.errors)) {
    const campo = key.charAt(0).toLowerCase() + key.slice(1)
    const message = messages[0]
    if (message && campo in form.getValues()) {
      form.setError(campo as keyof LibroForm, { message })
    }
  }
}
