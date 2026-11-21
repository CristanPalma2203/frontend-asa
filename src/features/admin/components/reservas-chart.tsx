import gsap from 'gsap'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import {
  indiceDiaDesdeX,
  monotonePath,
  RESERVAS_PAD,
} from '@/features/admin/components/chart-paths'
import type { ResumenDia } from '@/features/admin/types/resumen'
import { dur, prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Chart de área (reservas) + línea (cancelaciones).
 * SVG a tamaño real del contenedor; monotoneX; pointer → día exacto.
 */
export function ReservasChart({
  serie,
  dias,
  onDias,
  cargando = false,
  className,
}: {
  serie: ResumenDia[]
  dias: 14 | 30
  onDias: (dias: 14 | 30) => void
  cargando?: boolean
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 640, h: 260 })
  const [hover, setHover] = useState<number | null>(null)
  const uid = useId().replace(/:/g, '')
  const gradId = `resumen-area-${uid}`
  const clipId = `resumen-clip-${uid}`

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const medir = () => {
      // jsdom suele reportar 0: no pisar el ancho por defecto.
      const cw = Math.floor(el.clientWidth)
      const ch = Math.floor(el.clientHeight)
      setSize((prev) => {
        const w = cw > 0 ? cw : prev.w
        const h = ch > 0 ? ch : prev.h
        return prev.w === w && prev.h === h ? prev : { w, h }
      })
    }
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cargando, serie.length])

  const { w: width, h: height } = size
  const labels = serie.map((d) => {
    const [, m, day] = d.fecha.split('-')
    return `${Number(day)}/${Number(m)}`
  })
  const reservas = serie.map((d) => d.reservas)
  const cancelaciones = serie.map((d) => d.cancelaciones)
  const maxRaw = Math.max(0, ...reservas, ...cancelaciones)
  const maxY = Math.max(1, maxRaw)
  const yTicks = Array.from({ length: maxY + 1 }, (_, i) => i)
  const xStep = dias === 30 ? 5 : 2

  const xAt = (i: number) =>
    RESERVAS_PAD.l +
    (serie.length < 2
      ? 0
      : (i / (serie.length - 1)) *
        (width - RESERVAS_PAD.l - RESERVAS_PAD.r))
  const yAt = (v: number) =>
    RESERVAS_PAD.t +
    (1 - v / maxY) * (height - RESERVAS_PAD.t - RESERVAS_PAD.b)

  const ptsR = useMemo(
    () => reservas.map((v, i) => [xAt(i), yAt(v)] as [number, number]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height, serie],
  )
  const ptsC = useMemo(
    () =>
      cancelaciones.map((v, i) => [xAt(i), yAt(v)] as [number, number]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height, serie],
  )
  const pathR = useMemo(() => monotonePath(ptsR), [ptsR])
  const pathC = useMemo(() => monotonePath(ptsC), [ptsC])
  const area =
    pathR && ptsR.length
      ? `${pathR} L${xAt(ptsR.length - 1)},${height - RESERVAS_PAD.b} L${xAt(0)},${height - RESERVAS_PAD.b} Z`
      : ''

  const clipRef = useRef<SVGRectElement>(null)
  useEffect(() => {
    const rect = clipRef.current
    if (!rect) return
    const full = Math.max(0, width - RESERVAS_PAD.l + 2)
    if (prefersReducedMotion()) {
      gsap.set(rect, { attr: { width: full } })
      return
    }
    gsap.fromTo(
      rect,
      { attr: { width: 0 } },
      { attr: { width: full }, duration: dur(1.4), ease: 'power2.inOut' },
    )
  }, [pathR, width, dias])

  const vacio =
    !cargando &&
    serie.every((d) => d.reservas === 0 && d.cancelaciones === 0)
  const tip = hover !== null ? serie[hover] : null

  function diaDesdeEvento(clientX: number) {
    const box = wrapRef.current?.getBoundingClientRect()
    if (!box) return 0
    // Ancho lógico del SVG (= size.w), no box.width: evita desfase si el
    // layout CSS escala el SVG respecto al viewBox.
    return indiceDiaDesdeX(
      clientX,
      box.left,
      width,
      RESERVAS_PAD.l,
      RESERVAS_PAD.r,
      serie.length,
    )
  }

  const tipW = 148
  const tipH = 64
  let tipLeft = 8
  let tipTop = 8
  if (hover !== null) {
    const cx = xAt(hover)
    tipLeft =
      cx + tipW + 12 > width ? Math.max(8, cx - tipW - 12) : cx + 12
    const cy = yAt(
      Math.max(reservas[hover] ?? 0, cancelaciones[hover] ?? 0),
    )
    tipTop = Math.max(8, Math.min(height - tipH - 8, cy - tipH / 2))
  }

  return (
    <section
      className={cn(
        'bg-card border-linea shadow-card flex h-full min-h-0 min-w-0 flex-col gap-3 rounded-2xl border p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg tracking-[-0.02em]">
            Reservas por <span className="titulo-serif">día</span>
          </h2>
          <p className="text-texto-3 text-sm">
            Reservas y cancelaciones · últimos {dias} días
          </p>
        </div>
        <div
          role="group"
          aria-label="Periodo"
          className="bg-niebla flex gap-1 rounded-full p-1"
        >
          {([14, 30] as const).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={dias === n}
              onClick={() => onDias(n)}
              className={cn(
                'focus-visible:shadow-foco h-8 cursor-pointer rounded-full px-3 text-sm outline-none',
                dias === n
                  ? 'bg-card text-tinta shadow-sm font-semibold'
                  : 'text-texto-3 hover:text-tinta font-medium',
              )}
            >
              {n}D
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div
          className="bg-niebla min-h-[220px] w-full flex-1 animate-pulse rounded-xl"
          aria-hidden
        />
      ) : vacio ? (
        <p className="text-texto-3 flex flex-1 items-center justify-center py-16 text-center text-sm">
          Sin reservas en este periodo
        </p>
      ) : (
        <div
          ref={wrapRef}
          data-testid="reservas-chart-plot"
          className="relative min-h-[220px] w-full flex-1 outline-none"
          tabIndex={0}
          onPointerMove={(e) => setHover(diaDesdeEvento(e.clientX))}
          onPointerLeave={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
            e.preventDefault()
            setHover((h) => {
              const base = h ?? serie.length - 1
              return Math.max(
                0,
                Math.min(
                  serie.length - 1,
                  base + (e.key === 'ArrowRight' ? 1 : -1),
                ),
              )
            })
          }}
        >
          <svg
            role="img"
            aria-label={`Reservas y cancelaciones de los últimos ${dias} días`}
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            className="block h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-lima-400)"
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-lima-400)"
                  stopOpacity="0"
                />
              </linearGradient>
              <clipPath id={clipId}>
                <rect
                  ref={clipRef}
                  x={RESERVAS_PAD.l}
                  y={0}
                  width={0}
                  height={height}
                />
              </clipPath>
            </defs>
            {yTicks.map((tick) => {
              const y = yAt(tick)
              return (
                <g key={tick}>
                  <line
                    x1={RESERVAS_PAD.l}
                    x2={width}
                    y1={y}
                    y2={y}
                    stroke="var(--color-linea)"
                    strokeWidth={1}
                    opacity={0.7}
                  />
                  <text
                    x={RESERVAS_PAD.l - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--color-texto-5)"
                    fontSize={11}
                  >
                    {tick}
                  </text>
                </g>
              )
            })}
            <g clipPath={`url(#${clipId})`}>
              <path d={area} fill={`url(#${gradId})`} />
              <path
                d={pathR}
                fill="none"
                stroke="var(--color-pino-800)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <path
                d={pathC}
                fill="none"
                stroke="var(--color-rojo-600)"
                strokeWidth={1.6}
                strokeDasharray="4 3"
                strokeLinecap="round"
                opacity={0.85}
              />
            </g>
            {labels.map((lab, i) => {
              const last = labels.length - 1
              if (!(i === 0 || i === last || i % xStep === 0)) return null
              return (
                <text
                  key={lab + i}
                  x={xAt(i)}
                  y={height - 6}
                  textAnchor={
                    i === last ? 'end' : i === 0 ? 'start' : 'middle'
                  }
                  fill="var(--color-texto-5)"
                  fontSize={11}
                >
                  {lab}
                </text>
              )
            })}
            {hover !== null ? (
              <>
                <line
                  x1={xAt(hover)}
                  x2={xAt(hover)}
                  y1={RESERVAS_PAD.t}
                  y2={height - RESERVAS_PAD.b}
                  stroke="var(--color-texto-5)"
                  strokeWidth={1}
                />
                <circle
                  cx={xAt(hover)}
                  cy={yAt(reservas[hover] ?? 0)}
                  r={4.5}
                  fill="var(--color-pino-800)"
                />
                <circle
                  cx={xAt(hover)}
                  cy={yAt(cancelaciones[hover] ?? 0)}
                  r={4.5}
                  fill="var(--color-rojo-600)"
                />
              </>
            ) : null}
          </svg>
          {tip && hover !== null ? (
            <div
              role="status"
              aria-live="polite"
              data-testid="reservas-chart-tooltip"
              data-dia={hover}
              className="bg-papel border-linea text-tinta pointer-events-none absolute z-10 rounded-xl border px-3 py-2 text-xs shadow-card"
              style={{ left: tipLeft, top: tipTop, width: tipW }}
            >
              <b className="block">{labels[hover]}</b>
              <span className="text-texto-3 mt-1 flex flex-col gap-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <i className="bg-pino-800 size-1.5 rounded-full" />
                  Reservas <strong className="text-tinta">{tip.reservas}</strong>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="bg-rojo-600 size-1.5 rounded-full" />
                  Cancelaciones{' '}
                  <strong className="text-tinta">{tip.cancelaciones}</strong>
                </span>
              </span>
            </div>
          ) : null}
          <table className="sr-only">
            <caption>Reservas y cancelaciones por día</caption>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Reservas</th>
                <th>Cancelaciones</th>
              </tr>
            </thead>
            <tbody>
              {serie.map((d) => (
                <tr key={d.fecha}>
                  <td>{d.fecha}</td>
                  <td>{d.reservas}</td>
                  <td>{d.cancelaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-texto-3 flex shrink-0 gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <i className="bg-pino-800 size-2 rounded-full" /> Reservas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="bg-rojo-600 size-2 rounded-full" /> Cancelaciones
        </span>
      </div>
    </section>
  )
}
