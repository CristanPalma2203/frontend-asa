import {
  BookCheck,
  BookMarked,
  BookOpen,
  CalendarCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useRef } from 'react'

import { Sparkline } from '@/features/admin/components/sparkline'
import type { Resumen, ResumenDia } from '@/features/admin/types/resumen'
import { CountUp } from '@/components/ui/count-up'
import { Hueso } from '@/components/ui/hueso'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn } from '@/lib/motion'
import { cn } from '@/lib/utils'

function serieDe(
  dias: ResumenDia[],
  campo: 'reservas' | 'cancelaciones',
): number[] {
  return dias.map((d) => d[campo])
}

export function ResumenKpis({
  resumen,
  cargando,
}: {
  resumen: Resumen | undefined
  cargando: boolean
}) {
  const ref = useRef<HTMLUListElement>(null)
  useMotion(
    ref,
    (root) => cardsIn(root.children, { delay: 0.08, stagger: 0.05 }),
    [resumen?.kpis.librosActivos],
  )

  const k = resumen?.kpis
  const serie = resumen?.serieDiaria ?? []
  const pct = Math.round((k?.ocupacion ?? 0) * 100)

  return (
    <ul
      ref={ref}
      aria-label="Indicadores"
      className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <Kpi
        icono={BookOpen}
        etiqueta="Libros"
        valor={k?.librosActivos}
        detalle="títulos activos"
        spark={serieDe(serie, 'reservas')}
        cargando={cargando}
      />
      <Kpi
        icono={BookCheck}
        etiqueta="Disponibles"
        valor={k?.ejemplaresDisponibles}
        detalle={k ? `de ${k.ejemplaresActivos} ejemplares activos` : undefined}
        spark={serieDe(serie, 'reservas')}
        tone="lima"
        destacada
        cargando={cargando}
      />
      <Kpi
        icono={BookMarked}
        etiqueta="Reservados"
        valor={k?.ejemplaresReservados}
        detalle="apartados por lectores"
        spark={serieDe(serie, 'reservas')}
        cargando={cargando}
      />
      <Kpi
        icono={Users}
        etiqueta="Lectores"
        valor={k?.lectoresActivos}
        detalle="cuentas activas"
        spark={serieDe(serie, 'reservas')}
        cargando={cargando}
      />
      <Kpi
        icono={CalendarCheck}
        etiqueta="Reservas activas"
        valor={k?.reservasActivas}
        detalle="en curso"
        spark={serieDe(serie, 'reservas')}
        cargando={cargando}
      />
      <li className="bg-card border-linea shadow-card flex h-full flex-col gap-3 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-texto-3 text-[13px] font-semibold">Ocupación</p>
          <span className="text-tinta font-mono text-sm font-semibold">
            {cargando || k === undefined ? (
              <Hueso cargando ancho={36} alto={14} />
            ) : (
              `${pct}%`
            )}
          </span>
        </div>
        {cargando || k === undefined ? (
          <Hueso cargando alto={8} radio={999} llenar className="w-full" />
        ) : (
          <span
            className="bg-niebla block h-2 overflow-hidden rounded-full"
            role="meter"
            aria-label="Ocupación de ejemplares"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i
              className="bg-lima-400 block h-full origin-left rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </span>
        )}
        <p className="text-texto-3 mt-auto text-[13px]">
          {k
            ? `${k.ejemplaresReservados} de ${k.ejemplaresActivos} ejemplares reservados`
            : ' '}
        </p>
      </li>
    </ul>
  )
}

function Kpi({
  icono: Icono,
  etiqueta,
  valor,
  detalle,
  spark,
  tone = 'pino',
  destacada = false,
  cargando,
}: {
  icono: LucideIcon
  etiqueta: string
  valor: number | undefined
  detalle?: string
  spark: number[]
  tone?: 'pino' | 'lima' | 'rojo'
  destacada?: boolean
  cargando: boolean
}) {
  return (
    <li
      className={cn(
        'shadow-card flex h-full flex-col gap-3 rounded-xl p-5',
        destacada ? 'bg-pino-950 text-papel' : 'bg-card border-linea border',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            'text-[13px] font-semibold',
            destacada ? 'text-white/75' : 'text-texto-3',
          )}
        >
          {etiqueta}
        </p>
        <span
          className={cn(
            'grid size-9 place-items-center rounded-full',
            destacada
              ? 'bg-lima-400 text-pino-800'
              : 'bg-lima-wash text-pino-800',
          )}
        >
          <Icono aria-hidden className="size-[18px]" strokeWidth={2} />
        </span>
      </div>
      {cargando || valor === undefined ? (
        <Hueso cargando ancho="55%" alto={28} radio={6} />
      ) : (
        <p
          className={cn(
            'font-mono text-[36px] leading-none font-medium tracking-[-0.04em]',
            destacada ? 'text-lima-400' : 'text-tinta',
          )}
        >
          <CountUp value={valor} duration={1.2} />
        </p>
      )}
      <div className="mt-auto flex items-end justify-between gap-2">
        <p
          className={cn(
            'text-[12px]',
            destacada ? 'text-white/65' : 'text-texto-3',
          )}
        >
          {detalle ?? ' '}
        </p>
        {!cargando && spark.length > 0 ? (
          <Sparkline
            values={spark}
            tone={destacada ? 'lima' : tone}
            className="opacity-90"
          />
        ) : null}
      </div>
    </li>
  )
}
