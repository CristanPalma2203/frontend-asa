import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  crearLector,
  desactivarLector,
  editarLector,
  listarLectores,
  obtenerLector,
} from '@/features/biblioteca/api'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { EstadoBadge } from '@/features/biblioteca/estado-badge'
import { badgeLector } from '@/features/biblioteca/estados'
import { queryKeys } from '@/features/biblioteca/queryKeys'
import { lectorSchema, type LectorForm } from '@/features/biblioteca/schemas'
import type { LectorLista } from '@/features/biblioteca/types'
import { ApiError } from '@/lib/api/client'
import { Route } from '@/routes/admin/lectores'

export function LectoresAdminPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [texto, setTexto] = useState(search.buscar ?? '')
  const [urlBuscar, setUrlBuscar] = useState(search.buscar)
  const [modo, setModo] = useState<'crear' | LectorLista | null>(null)
  const [abiertoId, setAbiertoId] = useState<number | null>(null)
  const lectores = useQuery({
    queryKey: queryKeys.lectores.list({
      buscar: search.buscar,
      page: search.page,
      pageSize: search.pageSize,
    }),
    queryFn: () =>
      listarLectores({ buscar: search.buscar, page: search.page, pageSize: search.pageSize }),
  })
  const detalle = useQuery({
    queryKey: queryKeys.lectores.detail(abiertoId ?? 0),
    queryFn: () => obtenerLector(abiertoId ?? 0),
    enabled: abiertoId != null,
  })

  if (search.buscar !== urlBuscar) {
    setUrlBuscar(search.buscar)
    setTexto(search.buscar ?? '')
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = texto.trim() || undefined
      if (next === search.buscar) return
      void navigate({
        replace: true,
        search: { page: 1, pageSize: search.pageSize, buscar: next },
      })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [navigate, search.buscar, search.pageSize, texto])

  const items = lectores.data?.items ?? []

  return (
    <section className="rounded-2xl border-2 border-tinta bg-white p-4 shadow-cartoon">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl text-verde">Lectores</h1>
        <Button type="button" onClick={() => setModo('crear')}>
          Crear lector
        </Button>
      </div>
      <Input
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="Buscar nombre, correo o identificador"
        aria-label="Buscar lectores"
        className="mt-4 bg-crema"
      />
      {lectores.isPending ? <Skeleton className="mt-4 h-40 rounded-2xl border-2 border-tinta" /> : null}
      {lectores.isError ? (
        <div className="mt-4">
          <p className="text-sm">
            {lectores.error instanceof ApiError
              ? mensajeDeError(lectores.error.code, lectores.error.detail || lectores.error.title)
              : 'Error de red.'}
          </p>
          <Button type="button" className="mt-3" onClick={() => void lectores.refetch()}>
            Reintentar
          </Button>
        </div>
      ) : null}
      {lectores.isSuccess && items.length === 0 ? <p className="mt-6 text-sm">No hay lectores.</p> : null}
      {lectores.isSuccess && items.length > 0 ? (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-tinta">
              <th className="py-2">Identificador</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((lector) => (
              <LectorFilas
                key={lector.idLector}
                lector={lector}
                abierto={abiertoId === lector.idLector}
                detalle={abiertoId === lector.idLector ? detalle.data : undefined}
                cargando={abiertoId === lector.idLector && detalle.isPending}
                onEdit={() => setModo(lector)}
                onToggle={() => setAbiertoId(abiertoId === lector.idLector ? null : lector.idLector)}
              />
            ))}
          </tbody>
        </table>
      ) : null}
      <LectorDialog lector={modo} onClose={() => setModo(null)} />
    </section>
  )
}

function LectorFilas({
  lector,
  abierto,
  detalle,
  cargando,
  onEdit,
  onToggle,
}: {
  lector: LectorLista
  abierto: boolean
  detalle: { reservasActivas: number } | undefined
  cargando: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  return (
    <>
      <tr className="border-b border-tinta/20">
        <td className="py-2">{lector.identificador}</td>
        <td>{lector.nombre}</td>
        <td>{lector.correo}</td>
        <td>
          <EstadoBadge estilo={badgeLector[lector.estado]} />
        </td>
        <td className="space-x-2 py-2 text-right">
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            Editar
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onToggle}>
            Reservas
          </Button>
        </td>
      </tr>
      {abierto ? (
        <tr className="border-b border-tinta/20 bg-crema">
          <td colSpan={5} className="px-2 py-3 text-sm">
            {cargando ? 'Cargando…' : null}
            {detalle ? `Reservas activas: ${detalle.reservasActivas}` : null}
          </td>
        </tr>
      ) : null}
    </>
  )
}

function LectorDialog({
  lector,
  onClose,
}: {
  lector: 'crear' | LectorLista | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
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
  const guardar = useMutation({
    mutationFn: async (values: LectorForm) => {
      if (!editando) {
        await crearLector({
          identificador: values.identificador,
          nombre: values.nombre,
          correo: values.correo,
          password: values.password || undefined,
        })
        return
      }
      await editarLector(editando.idLector, {
        identificador: values.identificador,
        nombre: values.nombre,
        correo: values.correo,
      })
      if (values.estado === 'Inactivo' && editando.estado !== 'Inactivo') {
        await desactivarLector(editando.idLector)
      }
    },
    onSuccess: async () => {
      onClose()
      await queryClient.invalidateQueries({ queryKey: ['lectores'] })
    },
  })

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
