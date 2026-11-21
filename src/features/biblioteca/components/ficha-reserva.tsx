import { Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Hueso } from '@/components/ui/hueso'
import {
  isSessionActive,
  selectIsAdmin,
  selectIsLector,
  useAuthStore,
} from '@/features/auth/store'
import { ReservaError } from '@/features/biblioteca/components/reserva-error'
import { ReservarDialog } from '@/features/biblioteca/components/reservar-dialog'
import {
  estadoFicha,
  textoDisponibles,
  type EstadoFicha,
} from '@/features/biblioteca/disponibilidad'
import {
  useMisReservas,
  useReservar,
} from '@/features/biblioteca/hooks/use-reservas'
import type { LibroDetalle } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { ApiError } from '@/lib/api/client'
import { pop } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function FichaReserva({
  detalle,
  total,
}: {
  detalle: LibroDetalle
  total: number
}) {
  const reservar = useReservar()
  const activas = useMisReservas('Activa', 1, 50)
  const [abierto, setAbierto] = useState(false)
  const [codigoNuevo, setCodigoNuevo] = useState<string | null>(null)
  const isAdmin = useAuthStore(selectIsAdmin)
  const isLector = useAuthStore(selectIsLector)
  const sesion = useAuthStore(isSessionActive)
  const lectorId = useAuthStore((state) => state.lectorId)

  const reservaPrevia = isLector
    ? activas.data?.items.find(
        (reserva) =>
          reserva.idLibro === detalle.idLibro && reserva.estado === 'Activa',
      )
    : undefined
  const codigo = codigoNuevo ?? reservaPrevia?.codigoInventario ?? null
  const estado: EstadoFicha = codigo
    ? 'reservado'
    : detalle.disponibles === 0
      ? 'sinstock'
      : 'disponible'
  const textos = estadoFicha(estado, detalle.disponibles, total)
  const errorReserva =
    reservar.error instanceof ApiError ? reservar.error : null
  const idEstado = `disponibilidad-${detalle.idLibro}`

  function confirmarReserva() {
    if (!lectorId) return
    reservar.mutate(
      { lectorId, libroId: detalle.idLibro },
      {
        onSuccess: (reserva) => {
          setAbierto(false)
          setCodigoNuevo(reserva.codigoInventario)
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'sin-stock')
            setAbierto(false)
        },
      },
    )
  }

  const contenidoReservar = (
    <>
      Reservar
      {estado === 'disponible' ? (
        <span
          aria-hidden
          className="bg-lima-400 text-pino-800 flex h-[38px] items-center rounded-full px-3.5 text-[13px] font-semibold"
        >
          {textoDisponibles(detalle.disponibles)}
        </span>
      ) : null}
    </>
  )
  const claseReservar =
    'h-14 w-full justify-between gap-4 rounded-full pr-2.5 pl-7 text-base md:w-auto'

  let accion: ReactNode = null
  if (isAdmin)
    accion = (
      <Link
        to="/admin/libros/$idLibro"
        params={{ idLibro: String(detalle.idLibro) }}
        search={{ page: 1, pageSize: 12 }}
        className={buttonVariants({
          variant: 'outline',
          size: 'lg',
          className:
            'border-pino-800 text-pino-800 hover:bg-pino-800 hover:text-papel h-12 w-full rounded-full px-5 md:w-auto',
        })}
      >
        Gestionar ejemplares
        <ArrowRight aria-hidden className="size-3.5" strokeWidth={2.2} />
      </Link>
    )
  else if (codigo)
    accion = <TuEjemplar codigo={codigo} animar={codigoNuevo !== null} />
  else if (estado === 'sinstock')
    accion = (
      <Button
        type="button"
        size="lg"
        disabled
        aria-describedby={idEstado}
        className="h-14 w-full rounded-full px-7 md:w-auto"
      >
        Reservar
      </Button>
    )
  else if (!sesion)
    accion = (
      <Link
        to="/login"
        search={{ redirect: `/libros/${detalle.idLibro}` }}
        aria-describedby={idEstado}
        data-magnetic
        className={buttonVariants({ size: 'lg', className: claseReservar })}
      >
        {contenidoReservar}
      </Link>
    )
  else if (isLector)
    accion = (
      <Button
        type="button"
        size="lg"
        data-magnetic
        aria-describedby={idEstado}
        onClick={() => setAbierto(true)}
        className={claseReservar}
      >
        {contenidoReservar}
      </Button>
    )

  return (
    <div data-m="meta" className="flex flex-col gap-4">
      <TarjetaReserva
        estado={
          <>
            <EtiquetaEstado estado={estado} id={idEstado}>
              {textos.etiqueta}
            </EtiquetaEstado>
            <span className="text-texto-3 text-[13px]">{textos.detalle}</span>
          </>
        }
        segmentos={textos.segmentos}
        accion={accion}
        ayuda={
          isAdmin
            ? 'En la vista Biblioteca, el admin ve la ficha sin «Reservar».'
            : textos.ayuda
        }
      />

      {errorReserva && !codigo ? (
        <ReservaError
          code={errorReserva.code}
          fallback={errorReserva.detail || errorReserva.title}
          onRetry={confirmarReserva}
        />
      ) : null}

      <ReservarDialog
        abierto={abierto}
        onOpenChange={setAbierto}
        titulo={detalle.titulo}
        deshabilitado={reservar.isPending || !lectorId}
        onConfirmar={confirmarReserva}
      />
    </div>
  )
}

export function FichaReservaCargando() {
  return (
    <div data-m="meta">
      <TarjetaReserva
        estado={
          <>
            <Hueso cargando ancho={120} alto={30} radio={999} />
            <Hueso cargando ancho={150} alto={14} />
          </>
        }
        segmentos={[]}
        accion={
          <Button
            type="button"
            size="lg"
            disabled
            className="h-14 w-full rounded-full px-7 md:w-auto"
          >
            Reservar
          </Button>
        }
        ayuda={<Hueso cargando ancho="60%" alto={13} />}
      />
    </div>
  )
}

function TarjetaReserva({
  estado,
  segmentos,
  accion,
  ayuda,
}: {
  estado: ReactNode
  segmentos: ('tuyo' | 'libre' | 'ocupado')[]
  accion: ReactNode
  ayuda: ReactNode
}) {
  return (
    <div className="bg-card shadow-card grid items-center gap-6 rounded-[22px] p-5 md:grid-cols-[minmax(0,1fr)_auto] md:pl-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">{estado}</div>
        {segmentos.length ? (
          <div aria-hidden className="flex max-w-[360px] gap-1">
            {segmentos.map((segmento, i) => (
              <span
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-full',
                  segmento === 'ocupado' ? 'bg-pino-800' : 'bg-lima-400',
                  segmento === 'tuyo' && 'ring-pino-950 ring-2',
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
      {accion ? (
        <div
          data-barra-reserva
          className="max-md:border-pino-800/5 max-md:bg-hueso/85 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:border-t max-md:px-4 max-md:pt-3 max-md:pb-[calc(1.25rem+env(safe-area-inset-bottom))] max-md:backdrop-blur-md"
        >
          {accion}
        </div>
      ) : null}
      {ayuda ? (
        <p className="border-niebla text-texto-3 border-t pt-3.5 text-[13px] md:col-span-2">
          {ayuda}
        </p>
      ) : null}
    </div>
  )
}

function EtiquetaEstado({
  estado,
  id,
  children,
}: {
  estado: EstadoFicha
  id: string
  children: ReactNode
}) {
  return (
    <span
      id={id}
      data-testid="estado-disponibilidad"
      className={cn(
        'inline-flex h-[30px] items-center gap-2 rounded-full px-3 text-[13px] font-semibold',
        estado === 'disponible' && 'bg-lima-400 text-pino-800',
        estado === 'sinstock' && 'bg-niebla text-texto-2',
        estado === 'reservado' && 'bg-pino-950 text-lima-400',
      )}
    >
      {estado === 'reservado' ? (
        <Check aria-hidden className="size-3.5" strokeWidth={2.6} />
      ) : (
        <span
          aria-hidden
          className={cn(
            'size-[7px] rounded-full',
            estado === 'disponible'
              ? 'bg-pino-800 shadow-[0_0_0_3px_rgb(4_44_36/0.15)]'
              : 'border-texto-3 border-[1.5px]',
          )}
        />
      )}
      {children}
    </span>
  )
}

function TuEjemplar({ codigo, animar }: { codigo: string; animar: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useMotion(ref, (root) => {
    if (animar) pop(root)
  })
  return (
    <div
      ref={ref}
      role="status"
      data-testid="tu-ejemplar"
      className="bg-pino-950 text-papel flex h-14 items-center gap-3 rounded-full pr-2 pl-5"
    >
      <span className="text-sm font-medium text-white/75">Tu ejemplar:</span>{' '}
      <span className="bg-lima-400 text-pino-800 rounded-lg px-2.5 py-1 font-mono text-[15px] font-semibold tracking-[0.02em]">
        {codigo}
      </span>
      <Link
        to="/mis-reservas"
        aria-label="Ver en Mis reservas"
        className="text-papel hover:text-papel focus-visible:shadow-foco ml-auto flex h-10 items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-semibold outline-none hover:bg-white/15 hover:no-underline"
      >
        <span className="md:hidden">Mis reservas</span>
        <span className="hidden md:inline">Ver en Mis reservas</span>
        <ArrowRight aria-hidden className="size-3.5" strokeWidth={2.2} />
      </Link>
    </div>
  )
}
