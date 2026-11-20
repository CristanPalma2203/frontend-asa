import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { Skeleton } from '@/components/ui/skeleton'
import { cambiarEstadoEjemplar, crearEjemplar, listarEjemplares } from '@/features/biblioteca/api'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { useLibro } from '@/features/biblioteca/hooks'
import { queryKeys } from '@/features/biblioteca/queryKeys'
import { ejemplarSchema, type EjemplarForm } from '@/features/biblioteca/schemas'
import type { EjemplarLista } from '@/features/biblioteca/types'
import { ApiError } from '@/lib/api/client'
import { Route } from '@/routes/admin/libros.$idLibro'

export function LibroAdminPage() {
  const { idLibro } = Route.useParams()
  const id = Number(idLibro)
  const libro = useLibro(id)
  const ejemplares = useQuery({
    queryKey: queryKeys.ejemplares(id),
    queryFn: () => listarEjemplares(id),
    enabled: id > 0,
  })
  const queryClient = useQueryClient()
  const [abierto, setAbierto] = useState(false)
  const form = useForm<EjemplarForm>({
    resolver: zodResolver(ejemplarSchema),
    defaultValues: { codigoInventario: '' },
  })

  const crear = useMutation({
    mutationFn: (values: EjemplarForm) => crearEjemplar(id, values),
    onSuccess: async () => {
      setAbierto(false)
      form.reset()
      await queryClient.invalidateQueries({ queryKey: queryKeys.ejemplares(id) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.libros.detail(id) })
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return
      if (error.code === 'codigo-inventario-duplicado') {
        form.setError('codigoInventario', {
          message: mensajeDeError(error.code, error.detail ?? error.title),
        })
      }
      const mensaje = error.errors?.CodigoInventario?.[0] ?? error.errors?.codigoInventario?.[0]
      if (error.code === 'validacion-fallida' && mensaje) {
        form.setError('codigoInventario', { message: mensaje })
      }
    },
  })

  const estado = useMutation({
    mutationFn: (item: EjemplarLista & { siguiente: 'Disponible' | 'Inactivo' }) =>
      cambiarEstadoEjemplar(id, item.idEjemplar, item.siguiente, item.rowVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.ejemplares(id) })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === 'conflicto-concurrencia') {
        toast.error('Otro usuario cambió este ejemplar')
        await ejemplares.refetch()
      }
    },
  })

  if (libro.isPending || ejemplares.isPending) {
    return <Skeleton className="h-64 rounded-2xl border-2 border-tinta" />
  }
  if (libro.isError || ejemplares.isError) {
    const error = libro.error ?? ejemplares.error
    return (
      <section className="rounded-2xl border-2 border-tinta bg-white p-6 shadow-cartoon">
        <p className="text-sm">
          {error instanceof ApiError ? mensajeDeError(error.code, error.detail || error.title) : 'Error de red.'}
        </p>
        <Button type="button" className="mt-3" onClick={() => void Promise.all([libro.refetch(), ejemplares.refetch()])}>
          Reintentar
        </Button>
      </section>
    )
  }

  const detalle = libro.data
  const filas = ejemplares.data ?? []

  return (
    <section className="rounded-2xl border-2 border-tinta bg-white p-4 shadow-cartoon">
      <h1 className="font-display text-3xl text-verde">{detalle.titulo}</h1>
      <p className="mt-1 text-sm">
        {detalle.autor} · {detalle.isbn} · {detalle.categoria} · {detalle.estado}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-display text-2xl text-verde">Ejemplares</h2>
        <Button type="button" onClick={() => setAbierto(true)}>
          Agregar
        </Button>
      </div>
      {filas.length === 0 ? <p className="mt-4 text-sm">Este libro no tiene ejemplares.</p> : null}
      {filas.length > 0 ? (
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-tinta">
              <th className="py-2">Código</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filas.map((item) => (
              <tr key={item.idEjemplar} className="border-b border-tinta/20">
                <td className="py-2">{item.codigoInventario}</td>
                <td>{item.estado}</td>
                <td className="py-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={estado.isPending}
                    onClick={() =>
                      estado.mutate({
                        ...item,
                        siguiente: item.estado === 'Inactivo' ? 'Disponible' : 'Inactivo',
                      })
                    }
                  >
                    {item.estado === 'Inactivo' ? 'Activar' : 'Inactivar'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {estado.error instanceof ApiError && estado.error.code !== 'conflicto-concurrencia' ? (
        <p className="mt-3 text-sm text-destructive">
          {mensajeDeError(estado.error.code, estado.error.detail || estado.error.title)}
        </p>
      ) : null}
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar ejemplar</DialogTitle>
          </DialogHeader>
          <form className="grid gap-2" onSubmit={form.handleSubmit((values) => crear.mutate(values))}>
            <Label htmlFor="codigo">Código de inventario</Label>
            <Input id="codigo" maxLength={30} {...form.register('codigoInventario')} />
            {form.formState.errors.codigoInventario ? (
              <p className="text-sm text-destructive">{form.formState.errors.codigoInventario.message}</p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={crear.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}
