import { getRouteApi } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { LectorFormDialog } from '@/features/biblioteca/components/lector-form-dialog'
import { LectoresTable } from '@/features/biblioteca/components/lectores-table'
import { useLector, useLectores } from '@/features/biblioteca/hooks/use-lectores'
import type { LectorLista } from '@/features/biblioteca/types/api'

const Route = getRouteApi('/admin/lectores')

export function LectoresAdminPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const [texto, setTexto] = useState(search.buscar ?? '')
  const [urlBuscar, setUrlBuscar] = useState(search.buscar)
  const [modo, setModo] = useState<'crear' | LectorLista | null>(null)
  const [abiertoId, setAbiertoId] = useState<number | null>(null)
  const lectores = useLectores({
    buscar: search.buscar,
    page: search.page,
    pageSize: search.pageSize,
  })
  const detalle = useLector(abiertoId)

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
        <ErrorReintentar error={lectores.error} onRetry={() => void lectores.refetch()} />
      ) : null}
      {lectores.isSuccess && items.length === 0 ? <p className="mt-6 text-sm">No hay lectores.</p> : null}
      {lectores.isSuccess && items.length > 0 ? (
        <LectoresTable
          lectores={items}
          abiertoId={abiertoId}
          detalle={detalle.data}
          cargandoDetalle={detalle.isPending}
          onEdit={setModo}
          onToggle={(lector) => setAbiertoId(abiertoId === lector.idLector ? null : lector.idLector)}
        />
      ) : null}
      <LectorFormDialog lector={modo} onClose={() => setModo(null)} />
    </section>
  )
}
