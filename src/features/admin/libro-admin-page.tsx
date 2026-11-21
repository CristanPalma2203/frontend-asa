import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeft, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { EncabezadoPagina } from '@/components/layout/encabezado-pagina'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Hueso } from '@/components/ui/hueso'
import { DesactivarEjemplarDialog } from '@/features/biblioteca/components/desactivar-ejemplar-dialog'
import { EditarEjemplarDialog } from '@/features/biblioteca/components/editar-ejemplar-dialog'
import { EjemplarFormDialog } from '@/features/biblioteca/components/ejemplar-form-dialog'
import { EjemplaresAdminTable } from '@/features/biblioteca/components/ejemplares-admin-table'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeLibro } from '@/features/biblioteca/components/estado-badge.styles'
import { totalActivos } from '@/features/biblioteca/disponibilidad'
import { mensajeDeError } from '@/features/biblioteca/errores'
import {
  useCambiarEstadoEjemplar,
  useDesactivarEjemplar,
  useEjemplares,
} from '@/features/biblioteca/hooks/use-ejemplares'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import type { EjemplarLista } from '@/features/biblioteca/types/api'
import { ApiError } from '@/lib/api/client'

const Route = getRouteApi('/admin/libros/$idLibro')

export function LibroAdminPage() {
  const { idLibro } = Route.useParams()
  const id = Number(idLibro)
  const libro = useLibro(id)
  const ejemplares = useEjemplares(id)
  const [abierto, setAbierto] = useState(false)
  const [aInactivar, setAInactivar] = useState<EjemplarLista | null>(null)
  const [aEditar, setAEditar] = useState<EjemplarLista | null>(null)
  const [aDesactivar, setADesactivar] = useState<EjemplarLista | null>(null)
  const desactivar = useDesactivarEjemplar(id, {
    onSuccess: () => {
      setADesactivar(null)
      toast.success('Ejemplar desactivado')
    },
  })
  const estado = useCambiarEstadoEjemplar(id, {
    onConflicto: () => toast.error('Otro usuario cambió este ejemplar'),
  })

  // Mientras carga: cabecera y tabla ya pintadas, huecos en el título, los datos y las filas.
  if (libro.isPending || ejemplares.isPending) {
    return (
      <main
        aria-busy
        aria-label="Cargando libro"
        className="flex flex-col gap-6 pt-2"
      >
        <Link
          to="/admin/libros"
          search={{ page: 1, pageSize: 12 }}
          className="text-texto-3 hover:text-tinta inline-flex items-center gap-1.5 self-start text-sm font-medium transition-colors"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={2.2} />
          Libros
        </Link>
        <div className="flex flex-col gap-3">
          <Hueso cargando ancho={96} alto={11} />
          <Hueso cargando ancho="min(420px,80%)" alto={40} radio={6} />
          <Hueso cargando ancho={260} alto={16} />
        </div>
        <section className="flex flex-col gap-3">
          <h2 className="text-xl">Ejemplares</h2>
          <EjemplaresAdminTable
            ejemplares={[]}
            cargando
            deshabilitado
            onCambiarEstado={() => undefined}
          />
        </section>
      </main>
    )
  }
  if (libro.isError || ejemplares.isError) {
    return (
      <section className="bg-card border-linea shadow-card mt-2 rounded-xl border p-8">
        <h1 className="text-xl">No se pudo cargar el libro</h1>
        <ErrorReintentar
          error={libro.error ?? ejemplares.error}
          onRetry={() =>
            void Promise.all([libro.refetch(), ejemplares.refetch()])
          }
        />
      </section>
    )
  }

  const detalle = libro.data
  const filas = ejemplares.data ?? []

  function cambiarEstado(item: EjemplarLista) {
    estado.mutate({
      ...item,
      siguiente: item.estado === 'Inactivo' ? 'Disponible' : 'Inactivo',
    })
  }

  return (
    <main className="flex flex-col gap-6 pt-2">
      <Link
        to="/admin/libros"
        search={{ page: 1, pageSize: 12 }}
        className="text-texto-3 hover:text-tinta inline-flex items-center gap-1.5 self-start text-sm font-medium transition-colors"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2.2} />
        Libros
      </Link>

      <EncabezadoPagina
        eyebrow={detalle.categoria}
        titulo={detalle.titulo}
        detalle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{detalle.autor}</span>
            <span aria-hidden className="text-separador">
              ·
            </span>
            <span className="font-mono text-[13px]">{detalle.isbn}</span>
            <EstadoBadge estilo={badgeLibro[detalle.estado]} />
          </span>
        }
        accion={
          <Button type="button" onClick={() => setAbierto(true)}>
            <Plus aria-hidden />
            Agregar ejemplar
          </Button>
        }
      />

      <section
        aria-labelledby="ejemplares-titulo"
        className="flex flex-col gap-3"
      >
        <div className="flex items-baseline justify-between">
          <h2 id="ejemplares-titulo" className="text-xl">
            Ejemplares
          </h2>
          <p className="text-texto-3 font-mono text-[13px]">
            {detalle.disponibles} de {totalActivos(filas)} disponibles
          </p>
        </div>
        {filas.length === 0 ? (
          <p className="bg-card border-linea text-texto-3 rounded-xl border px-6 py-10 text-center text-[15px]">
            Este libro no tiene ejemplares.
          </p>
        ) : (
          <EjemplaresAdminTable
            ejemplares={filas}
            deshabilitado={estado.isPending || desactivar.isPending}
            onEditar={setAEditar}
            onDesactivar={(item) => {
              desactivar.reset()
              setADesactivar(item)
            }}
            onCambiarEstado={(item) =>
              item.estado === 'Inactivo'
                ? cambiarEstado(item)
                : setAInactivar(item)
            }
          />
        )}
        {estado.error instanceof ApiError &&
        estado.error.code !== 'conflicto-concurrencia' ? (
          <p
            role="alert"
            className="border-rojo-600/20 bg-rojo-50 text-rojo-800 rounded-xl border px-4 py-3 text-sm font-medium"
          >
            {mensajeDeError(
              estado.error.code,
              estado.error.detail || estado.error.title,
            )}
          </p>
        ) : null}
      </section>

      <EjemplarFormDialog
        idLibro={id}
        abierto={abierto}
        onOpenChange={setAbierto}
      />
      <EditarEjemplarDialog
        idLibro={id}
        ejemplar={aEditar}
        onClose={() => setAEditar(null)}
      />
      <DesactivarEjemplarDialog
        ejemplar={aDesactivar}
        onClose={() => setADesactivar(null)}
        onConfirmar={(item) => desactivar.mutate(item.idEjemplar)}
        pending={desactivar.isPending}
        error={desactivar.error}
      />

      <Dialog
        open={aInactivar !== null}
        onOpenChange={(open) => !open && setAInactivar(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inactivar ejemplar</DialogTitle>
            <DialogDescription>
              <span className="font-mono text-[13px]">
                {aInactivar?.codigoInventario}
              </span>{' '}
              dejará de estar disponible para reservar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAInactivar(null)}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!aInactivar || estado.isPending}
              onClick={() => {
                if (aInactivar) cambiarEstado(aInactivar)
                setAInactivar(null)
              }}
            >
              Inactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
