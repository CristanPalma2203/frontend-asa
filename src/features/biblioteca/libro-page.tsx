import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'

import heroBlobs from '@/assets/hero-blobs.png'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { isSessionActive, selectIsAdmin, selectIsLector, useAuthStore } from '@/features/auth/store'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { useLibro, useReservar } from '@/features/biblioteca/hooks'
import type { Ejemplar } from '@/features/biblioteca/types'
import { ApiError } from '@/lib/api/client'
import { Route } from '@/routes/libros.$idLibro'

export function LibroPage() {
  const { idLibro } = Route.useParams()
  const id = Number(idLibro)
  const libro = useLibro(id)
  const reservar = useReservar()
  const [abierto, setAbierto] = useState(false)
  const isAdmin = useAuthStore(selectIsAdmin)
  const isLector = useAuthStore(selectIsLector)
  const sesion = useAuthStore(isSessionActive)
  const lectorId = useAuthStore((state) => state.lectorId)

  if (libro.isPending) {
    return (
      <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 md:grid-cols-[16rem_1fr]">
        <Skeleton className="h-80 rounded-2xl border-2 border-tinta" />
        <Skeleton className="h-80 rounded-2xl border-2 border-tinta" />
      </main>
    )
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
  const errorReserva = reservar.error instanceof ApiError ? reservar.error : null
  const sinStock = detalle.disponibles === 0

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8 md:grid-cols-[16rem_1fr]">
      <Portada isbn={detalle.isbn} titulo={detalle.titulo} />
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
          ) : isLector ? (
            <Button type="button" onClick={() => setAbierto(true)}>
              Reservar
            </Button>
          ) : null}
          {errorReserva ? (
            <ReservaError
              code={errorReserva.code}
              fallback={errorReserva.detail || errorReserva.title}
              onRetry={() => {
                if (!lectorId) return
                reservar.mutate(
                  { lectorId, libroId: detalle.idLibro },
                  { onSuccess: (reserva) => avisar(reserva.codigoInventario, setAbierto) },
                )
              }}
            />
          ) : null}
        </div>
        <h2 className="mt-8 font-display text-2xl text-verde">Ejemplares</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {detalle.ejemplares.map((ejemplar) => (
            <li
              key={ejemplar.id}
              className="flex items-center justify-between gap-3 rounded-xl border-2 border-tinta px-3 py-2"
            >
              <span className="text-sm">{ejemplar.codigoInventario}</span>
              <EstadoBadge ejemplar={ejemplar} />
            </li>
          ))}
        </ul>
      </section>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservar {detalle.titulo}</DialogTitle>
            <DialogDescription>
              Se asignará el primer ejemplar disponible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={reservar.isPending || !lectorId}
              onClick={() => {
                if (!lectorId) return
                reservar.mutate(
                  { lectorId, libroId: detalle.idLibro },
                  {
                    onSuccess: (reserva) => avisar(reserva.codigoInventario, setAbierto),
                  },
                )
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function avisar(codigo: string, cerrar: (open: boolean) => void) {
  cerrar(false)
  toast.success(`Ejemplar asignado: ${codigo}`)
}

function ReservaError({
  code,
  fallback,
  onRetry,
}: {
  code: string | undefined
  fallback: string
  onRetry: () => void
}) {
  return (
    <div className="mt-3 text-sm">
      <p>{mensajeDeError(code, fallback)}</p>
      {code === 'reserva-duplicada' ? (
        <Link to="/mis-reservas" className="mt-1 inline-block font-semibold text-verde underline">
          Mis reservas
        </Link>
      ) : null}
      {code === 'ejemplar-ya-reservado' ? (
        <Button type="button" size="sm" className="mt-2" onClick={onRetry}>
          Reintentar
        </Button>
      ) : null}
    </div>
  )
}

function EstadoBadge({ ejemplar }: { ejemplar: Ejemplar }) {
  if (ejemplar.estado === 'Disponible') return <Badge variant="disponible">Disponible</Badge>
  if (ejemplar.estado === 'Reservado') return <Badge>Reservado</Badge>
  if (ejemplar.estado === 'Prestado') return <Badge variant="outline">Prestado</Badge>
  return (
    <Badge variant="outline" className="bg-muted text-verde/70">
      Inactivo
    </Badge>
  )
}

function LibroNoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-4 py-10 text-center">
      <img src={heroBlobs} alt="" className="h-36 w-52 rounded-2xl border-2 border-tinta object-cover shadow-cartoon" />
      <h1 className="font-display text-4xl text-verde">Libro no encontrado</h1>
      <p className="text-sm">Ese título no está en la biblioteca.</p>
    </main>
  )
}

function Portada({ isbn, titulo }: { isbn: string; titulo: string }) {
  const [fallo, setFallo] = useState(false)
  const limpio = isbn.replace(/[^0-9Xx]/g, '')
  if (fallo || limpio.length === 0) {
    return (
      <svg viewBox="0 0 160 240" role="img" aria-label={titulo} className="w-full rounded-2xl border-2 border-tinta shadow-cartoon">
        <rect width="160" height="240" fill="#1E3D2E" />
        <text x="80" y="120" textAnchor="middle" fill="#FEF8EC" fontFamily="Fredoka, sans-serif" fontSize="14">
          {titulo.slice(0, 48)}
        </text>
      </svg>
    )
  }
  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${limpio}-L.jpg?default=false`}
      alt=""
      className="w-full rounded-2xl border-2 border-tinta object-cover shadow-cartoon"
      onError={() => setFallo(true)}
    />
  )
}
