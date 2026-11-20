import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, type ReactNode } from 'react'
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
import { mensajeDeError } from '@/features/biblioteca/errores'
import { useGuardarLector } from '@/features/biblioteca/hooks/use-lectores'
import { lectorSchema, type LectorForm } from '@/features/biblioteca/schemas/lector.schema'
import type { LectorLista } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

/**
 * Alta o edición de un lector. Al crear, la contraseña es opcional: si viene, la API crea también
 * su usuario. Los conflictos de la API (correo, identificador, reservas activas) van a su campo.
 */
export function LectorFormDialog({
  lector,
  onClose,
}: {
  lector: 'crear' | LectorLista | null
  onClose: () => void
}) {
  const editando = typeof lector === 'object' && lector ? lector : null
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
        : { identificador: '', nombre: '', correo: '', password: '', estado: 'Activo' },
    )
  }, [editando, form, lector])

  useEffect(() => {
    const error = guardar.error
    if (!(error instanceof ApiError)) return
    if (error.code === 'correo-duplicado') {
      form.setError('correo', { message: mensajeDeError(error.code, error.detail ?? error.title) })
    }
    if (error.code === 'identificador-duplicado') {
      form.setError('identificador', { message: mensajeDeError(error.code, error.detail ?? error.title) })
    }
    if (error.code === 'lector-con-reservas-activas') {
      form.setError('estado', { message: mensajeDeError(error.code, error.detail ?? error.title) })
    }
  }, [form, guardar.error])

  return (
    <Dialog open={lector !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar lector' : 'Crear lector'}</DialogTitle>
        </DialogHeader>
        <form className="grid gap-3" onSubmit={form.handleSubmit((values) => guardar.mutate(values))}>
          <Campo label="Identificador" error={form.formState.errors.identificador?.message}>
            <Input {...form.register('identificador')} />
          </Campo>
          <Campo label="Nombre" error={form.formState.errors.nombre?.message}>
            <Input {...form.register('nombre')} />
          </Campo>
          <Campo label="Correo" error={form.formState.errors.correo?.message}>
            <Input type="email" {...form.register('correo')} />
          </Campo>
          <Campo label="Estado" error={form.formState.errors.estado?.message}>
            <select className="h-10 rounded-lg border-2 border-tinta bg-white px-2" {...form.register('estado')}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </Campo>
          {editando ? null : (
            <Campo label="Contraseña (opcional)" error={form.formState.errors.password?.message}>
              <Input type="password" autoComplete="new-password" {...form.register('password')} />
            </Campo>
          )}
          <DialogFooter>
            <Button type="submit" disabled={guardar.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Campo({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      {children}
      {error ? <span className="text-destructive">{error}</span> : null}
    </label>
  )
}
