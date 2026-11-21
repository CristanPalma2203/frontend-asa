import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'

import { AlertaError } from '@/components/ui/alerta-error'
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
import { mensajeDeError, mensajeGeneral } from '@/features/biblioteca/errores'
import {
  libroSchema,
  type LibroForm,
} from '@/features/biblioteca/schemas/libro.schema'
import type { Libro } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

const CODIGOS_CON_CAMPO = ['isbn-duplicado'] as const

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

  const errorGeneral =
    error instanceof ApiError && tieneErroresDeCampo(error)
      ? null
      : mensajeGeneral(error, CODIGOS_CON_CAMPO)

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
          <AlertaError mensaje={errorGeneral} />
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
            <Button type="submit" cargando={pending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const CAMPOS_LIBRO = ['isbn', 'titulo', 'autor', 'categoria'] as const

function erroresDeCampo(error: ApiError) {
  if (error.code !== 'validacion-fallida' || !error.errors) return []
  return Object.entries(error.errors).flatMap(([key, messages]) => {
    const campo = key.charAt(0).toLowerCase() + key.slice(1)
    const message = messages[0]
    return message && (CAMPOS_LIBRO as readonly string[]).includes(campo)
      ? [{ campo: campo as keyof LibroForm, message }]
      : []
  })
}

function tieneErroresDeCampo(error: ApiError) {
  return erroresDeCampo(error).length > 0
}

function aplicarValidacion(form: UseFormReturn<LibroForm>, error: ApiError) {
  for (const { campo, message } of erroresDeCampo(error)) {
    form.setError(campo, { message })
  }
}
