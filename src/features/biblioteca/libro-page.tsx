import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { isSessionActive, selectIsAdmin, selectIsLector, useAuthStore } from '@/features/auth/store'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeEjemplar } from '@/features/biblioteca/components/estado-badge.styles'
import { LibroNoEncontrado } from '@/features/biblioteca/components/libro-no-encontrado'
import { PortadaFicha } from '@/features/biblioteca/components/portadas'
import { ReservaError } from '@/features/biblioteca/components/reserva-error'
import { ReservarDialog } from '@/features/biblioteca/components/reservar-dialog'
import { FichaSkeleton } from '@/features/biblioteca/components/skeletons'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { useLibro } from '@/features/biblioteca/hooks/use-libros'
import { useMisReservas, useReservar } from '@/features/biblioteca/hooks/use-reservas'
import { ApiError } from '@/lib/api/client'

const Route = getRouteApi('/libros/$idLibro')

export function LibroPage() {
  const { idLibro } = Route.useParams()
  const id = Number(idLibro)
  const libro = useLibro(id)
  const reservar = useReservar()
  const activas = useMisReservas('Activa', 1, 50)
  const [abierto, setAbierto] = useState(false)
  const isAdmin = useAuthStore(selectIsAdmin)
  const isLector = useAuthStore(selectIsLector)
  const sesion = useAuthStore(isSessionActive)
  const lectorId = useAuthStore((state) => state.lectorId)

  useEffect(() => {
    if (libro.data) document.title = `${libro.data.titulo} · ASA Biblioteca`
  }, [libro.data])

  if (libro.isPending) {
    return <FichaSkeleton />
  }

  if (libro.isError) {
    const code = libro.error instanceof ApiError ? libro.error.code : undefined
    if (code === 'libro-no-encontrado' || (libro.error instanceof ApiError && libro.error.status === 404)) {
      return <LibroNoEncontrado />
    }
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <section className="rounded-2xl border-2 border-tinta bg-white p-6 shadow-cartoon">
          <h1 className="font-display text-3xl text-verde">No se pudo cargar el libro</h1>
          <p className="mt-2 text-sm">
            {libro.error instanceof ApiError
              ? mensajeDeError(libro.error.code, libro.error.detail || libro.error.title)
              : 'Error de red.'}
          </p>
          <Button type="button" className="mt-4" onClick={() => void libro.refetch()}>
            Reintentar
          </Button>
        </section>
      </main>
    )
  }

  const detalle = libro.data
  const yaReservado =
    isLector &&
    activas.data?.items.some(
      (reserva) => reserva.idLibro === detalle.idLibro && reserva.estado === 'Activa',
    )
  const errorReserva = reservar.error instanceof ApiError ? reservar.error : null
  const sinStock = detalle.disponibles === 0

  function confirmarReserva() {
    if (!lectorId) return
    reservar.mutate(
      { lectorId, libroId: detalle.idLibro },
      { onSuccess: (reserva) => avisar(reserva.codigoInventario, setAbierto) },
    )
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 md:grid-cols-[16rem_1fr]">
      <PortadaFicha isbn={detalle.isbn} titulo={detalle.titulo} />
      <section className="rounded-2xl border-2 border-tinta bg-white p-6 shadow-cartoon">
        <h1 className="font-display text-4xl text-verde">{detalle.titulo}</h1>
        <p className="mt-1 text-lg">{detalle.autor}</p>
        <dl className="mt-4 grid gap-1 text-sm">
          <div>ISBN {detalle.isbn}</div>
          <div>Categoría {detalle.categoria}</div>
          <div>Estado {detalle.estado}</div>
        </dl>
        <div className="mt-5">
          {isAdmin ? null : sinStock ? (
            <Button type="button" disabled>
              Sin stock
            </Button>
          ) : !sesion ? (
            <Button asChild>
              <Link to="/login" search={{ redirect: `/libros/${detalle.idLibro}` }}>
                Reservar
              </Link>
            </Button>
          ) : yaReservado ? (
            <p className="text-sm">
              Ya lo tienes reservado.{' '}
              <Link to="/mis-reservas" className="font-semibold text-verde underline">
                Mis reservas
              </Link>
            </p>
          ) : isLector ? (
            <Button type="button" onClick={() => setAbierto(true)}>
              Reservar
            </Button>
          ) : null}
          {errorReserva ? (
            <ReservaError
              code={errorReserva.code}
              fallback={errorReserva.detail || errorReserva.title}
              onRetry={confirmarReserva}
            />
          ) : null}
        </div>
        <h2 className="mt-8 font-display text-2xl text-verde">Ejemplares</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {detalle.ejemplares.map((ejemplar) => (
            <li
              key={ejemplar.idEjemplar}
              className="flex items-center justify-between gap-3 rounded-xl border-2 border-tinta px-3 py-2"
            >
              <span className="text-sm">{ejemplar.codigoInventario}</span>
              <EstadoBadge estilo={badgeEjemplar[ejemplar.estado]} />
            </li>
          ))}
        </ul>
      </section>
      <ReservarDialog
        abierto={abierto}
        onOpenChange={setAbierto}
        titulo={detalle.titulo}
        deshabilitado={reservar.isPending || !lectorId}
        onConfirmar={confirmarReserva}
      />
    </main>
  )
}

function avisar(codigo: string, cerrar: (open: boolean) => void) {
  cerrar(false)
  toast.success(`Tu ejemplar: ${codigo}`)
}
