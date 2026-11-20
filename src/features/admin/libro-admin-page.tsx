import { getRouteApi } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EjemplarFormDialog } from '@/features/biblioteca/components/ejemplar-form-dialog'
import { EjemplaresAdminTable } from '@/features/biblioteca/components/ejemplares-admin-table'
import { mensajeDeError } from '@/features/biblioteca/errores'
import {
  useCambiarEstadoEjemplar,
  useEjemplares,
} from '@/features/biblioteca/hooks/use-ejemplares'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import { ApiError } from '@/lib/api/client'

const Route = getRouteApi('/admin/libros/$idLibro')

export function LibroAdminPage() {
  const { idLibro } = Route.useParams()
  const id = Number(idLibro)
  const libro = useLibro(id)
  const ejemplares = useEjemplares(id)
  const [abierto, setAbierto] = useState(false)
  const estado = useCambiarEstadoEjemplar(id, {
    onConflicto: () => toast.error('Otro usuario cambió este ejemplar'),
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
        <EjemplaresAdminTable
          ejemplares={filas}
          deshabilitado={estado.isPending}
          onCambiarEstado={(item) =>
            estado.mutate({
              ...item,
              siguiente: item.estado === 'Inactivo' ? 'Disponible' : 'Inactivo',
            })
          }
        />
      ) : null}
      {estado.error instanceof ApiError && estado.error.code !== 'conflicto-concurrencia' ? (
        <p className="mt-3 text-sm text-destructive">
          {mensajeDeError(estado.error.code, estado.error.detail || estado.error.title)}
        </p>
      ) : null}
      <EjemplarFormDialog idLibro={id} abierto={abierto} onOpenChange={setAbierto} />
    </section>
  )
}
