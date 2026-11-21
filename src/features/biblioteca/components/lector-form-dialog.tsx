import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

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
import { useGuardarLector } from '@/features/biblioteca/hooks/use-lectores'
import {
  lectorSchema,
  type LectorForm,
} from '@/features/biblioteca/schemas/lector.schema'
import type { LectorLista } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

const CODIGOS_CON_CAMPO = [
  'correo-duplicado',
  'identificador-duplicado',
  'lector-con-reservas-activas',
] as const

export function LectorFormDialog({
  lector,
  onClose,
}: {
  lector: 'crear' | LectorLista | null
  onClose: () => void
}) {
  const editando = lector === 'crear' ? null : lector
  const form = useForm<LectorForm>({
    resolver: zodResolver(lectorSchema),
    defaultValues: {
      identificador: '',
      nombre: '',
      correo: '',
      password: '',
      estado: 'Activo',
    },
  })
  const guardar = useGuardarLector(editando, { onSuccess: onClose })
  const errorGeneral = mensajeGeneral(guardar.error, CODIGOS_CON_CAMPO)

  function cerrar() {
    guardar.reset()
    onClose()
  }

  useEffect(() => {
    form.reset(
      editando
        ? {
            identificador: editando.identificador,
            nombre: editando.nombre,
            correo: editando.correo,
            password: '',
            estado: editando.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
          }
        : {
            identificador: '',
            nombre: '',
            correo: '',
            password: '',
            estado: 'Activo',
          },
    )
  }, [editando, form, lector])

  useEffect(() => {
    const error = guardar.error
    if (!(error instanceof ApiError)) return
    if (error.code === 'correo-duplicado') {
      form.setError('correo', {
        message: mensajeDeError(error.code, error.detail ?? error.title),
      })
    }
    if (error.code === 'identificador-duplicado') {
      form.setError('identificador', {
        message: mensajeDeError(error.code, error.detail ?? error.title),
      })
    }
    if (error.code === 'lector-con-reservas-activas') {
      form.setError('estado', {
        message: mensajeDeError(error.code, error.detail ?? error.title),
      })
    }
  }, [form, guardar.error])

  return (
    <Dialog open={lector !== null} onOpenChange={(open) => !open && cerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editando ? 'Editar lector' : 'Crear lector'}
          </DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) => guardar.mutate(values))}
        >
          <AlertaError mensaje={errorGeneral} />
          <Campo
            label="Identificador"
            error={form.formState.errors.identificador?.message}
          >
            <Input {...form.register('identificador')} />
          </Campo>
          <Campo label="Nombre" error={form.formState.errors.nombre?.message}>
            <Input {...form.register('nombre')} />
          </Campo>
          <Campo label="Correo" error={form.formState.errors.correo?.message}>
            <Input type="email" {...form.register('correo')} />
          </Campo>
          <Campo label="Estado" error={form.formState.errors.estado?.message}>
            <select
              className="border-linea-fuerte bg-card text-texto hover:border-separador focus-visible:border-pino-800 focus-visible:shadow-foco h-12 w-full cursor-pointer rounded-[12px] border px-4 text-[15px] transition-[border-color,box-shadow] outline-none"
              {...form.register('estado')}
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </Campo>
          {editando ? null : (
            <Campo
              label="Contraseña (opcional)"
              error={form.formState.errors.password?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                {...form.register('password')}
              />
            </Campo>
          )}
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit" cargando={guardar.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
