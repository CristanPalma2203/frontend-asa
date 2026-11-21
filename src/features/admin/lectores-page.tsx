import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'

import { BuscadorLista, EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { Button } from '@/components/ui/button'
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
    <main className="flex flex-col gap-6 pt-2">
      <EncabezadoPagina
        eyebrow="Gestión"
        titulo="Lectores"
        serif="registrados"
        detalle={lectores.isSuccess ? `${lectores.data.totalCount} lectores` : null}
        accion={
          <Button type="button" onClick={() => setModo('crear')}>
            <Plus aria-hidden />
            Crear lector
          </Button>
        }
      />
      <BuscadorLista
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        placeholder="Buscar nombre, correo o identificador"
        aria-label="Buscar lectores"
      />
      {lectores.isError ? (
        <div className="bg-card border-linea rounded-xl border p-6">
          <ErrorReintentar error={lectores.error} onRetry={() => void lectores.refetch()} />
        </div>
      ) : null}
      {lectores.isSuccess && items.length === 0 ? (
        <p className="bg-card border-linea text-texto-3 rounded-xl border px-6 py-10 text-center text-[15px]">
          No hay lectores.
        </p>
      ) : null}
      {lectores.isPending || (lectores.isSuccess && items.length > 0) ? (
        <LectoresTable
          lectores={items}
          cargando={lectores.isPending}
          abiertoId={abiertoId}
          detalle={detalle.data}
          cargandoDetalle={detalle.isPending}
          onEdit={setModo}
          onToggle={(lector) => setAbiertoId(abiertoId === lector.idLector ? null : lector.idLector)}
        />
      ) : null}
      <LectorFormDialog lector={modo} onClose={() => setModo(null)} />
    </main>
  )
}
