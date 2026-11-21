import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookCheck,
  BookMarked,
  BookOpen,
  CalendarCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useRef, type ReactNode } from 'react'

import { CountUp } from '@/components/ui/count-up'
import { Hueso } from '@/components/ui/hueso'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'
import { useResumenAdmin } from '@/features/biblioteca/hooks/use-resumen-admin'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn } from '@/lib/motion'

const lista = { page: 1, pageSize: 12 } as const

export function ResumenAdminPage() {
  const resumen = useResumenAdmin()
  const datos = resumen.data
  const metricasRef = useRef<HTMLUListElement>(null)
  // Tarjetas de métricas: co() de Flito con delay 0.1 (las cifras cuentan con CountUp).
  useMotion(metricasRef, (root) => cardsIn(root.children, { delay: 0.1 }))

  return (
    <main className="flex flex-col gap-8 pt-2">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Panel de administración</p>
        <h1 className="text-[36px] leading-[1.02] sm:text-[44px]">
          Resumen de la <span className="titulo-serif">biblioteca</span>
        </h1>
      </header>

      {resumen.isError ? (
        <section className="bg-card border-linea shadow-card rounded-xl border p-8">
          <h2 className="text-xl">No se pudieron cargar las métricas</h2>
          <ErrorReintentar error={resumen.error} onRetry={() => void resumen.refetch()} />
        </section>
      ) : (
        <ul ref={metricasRef} aria-label="Métricas" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metrica
            icono={BookOpen}
            etiqueta="Libros"
            valor={datos?.libros}
            detalle="títulos activos en el catálogo"
          />
          <Metrica
            icono={BookCheck}
            etiqueta="Ejemplares disponibles"
            valor={datos?.disponibles}
            detalle={datos ? `de ${datos.ejemplares} ejemplares en total` : undefined}
            destacada
          />
          <Metrica
            icono={BookMarked}
            etiqueta="Ejemplares reservados"
            valor={datos?.reservados}
            detalle="apartados por lectores"
          />
          <Metrica
            icono={Users}
            etiqueta="Lectores"
            valor={datos?.lectores}
            detalle={datos ? `${datos.lectoresActivos} activos` : undefined}
          />
          <Metrica
            icono={CalendarCheck}
            etiqueta="Reservas activas"
            valor={datos?.reservasActivas}
            detalle="de todos los lectores"
          />
        </ul>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <Acceso
          titulo="Libros y ejemplares"
          texto="Crea, edita o desactiva títulos y gestiona sus ejemplares."
        >
          <Link to="/admin/libros" search={lista}>
            Gestionar libros
            <ArrowRight aria-hidden className="size-4" strokeWidth={2.2} />
          </Link>
        </Acceso>
        <Acceso titulo="Lectores" texto="Da de alta lectores, edita sus datos y revisa sus reservas.">
          <Link to="/admin/lectores" search={lista}>
            Gestionar lectores
            <ArrowRight aria-hidden className="size-4" strokeWidth={2.2} />
          </Link>
        </Acceso>
      </section>
    </main>
  )
}

function Metrica({
  icono: Icono,
  etiqueta,
  valor,
  detalle,
  destacada = false,
}: {
  icono: LucideIcon
  etiqueta: string
  valor: number | undefined
  detalle?: string
  destacada?: boolean
}) {
  return (
    <li
      className={
        destacada
          ? 'bg-pino-950 text-papel shadow-card flex flex-col gap-4 rounded-xl p-5'
          : 'bg-card border-linea shadow-card flex flex-col gap-4 rounded-xl border p-5'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className={destacada ? 'text-[13px] font-semibold text-white/75' : 'text-texto-3 text-[13px] font-semibold'}>
          {etiqueta}
        </p>
        <span
          className={
            destacada
              ? 'bg-lima-400 text-pino-800 grid size-9 place-items-center rounded-full'
              : 'bg-lima-wash text-pino-800 grid size-9 place-items-center rounded-full'
          }
        >
          <Icono aria-hidden className="size-[18px]" strokeWidth={2} />
        </span>
      </div>
      {valor === undefined ? (
        // Solo el hueco de la cifra (≈ KpiRowSkeleton de Corelux: 62 % × 26, r6); la etiqueta ya se ve.
        <div className="flex h-10 items-center">
          <Hueso cargando ancho="62%" alto={26} radio={6} className="w-full" />
        </div>
      ) : (
        <p
          className={
            destacada
              ? 'text-lima-400 font-mono text-[40px] leading-none font-medium tracking-[-0.04em]'
              : 'text-tinta font-mono text-[40px] leading-none font-medium tracking-[-0.04em]'
          }
        >
          <CountUp value={valor} duration={1.2} />
        </p>
      )}
      <p className={destacada ? 'text-[13px] text-white/65' : 'text-texto-3 text-[13px]'}>
        {detalle ?? ' '}
      </p>
    </li>
  )
}

function Acceso({
  titulo,
  texto,
  children,
}: {
  titulo: string
  texto: string
  children: ReactNode
}) {
  return (
    <div className="bg-card border-linea flex flex-col gap-2 rounded-xl border p-6">
      <h2 className="text-lg">{titulo}</h2>
      <p className="text-texto-3 text-[15px]">{texto}</p>
      <div className="text-pino-800 mt-3 [&>a]:inline-flex [&>a]:items-center [&>a]:gap-1.5 [&>a]:text-sm [&>a]:font-semibold [&>a:hover]:underline [&>a]:underline-offset-4">
        {children}
      </div>
    </div>
  )
}
