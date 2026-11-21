import gsap from 'gsap'
import { useId, useLayoutEffect, useRef } from 'react'

import { sparkPath } from '@/features/admin/components/chart-paths'
import { dur, prefersReducedMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Mini área+línea estilo KPI Wynlo. Dibuja el trazo con GSAP. */
export function Sparkline({
  values,
  className,
  tone = 'pino',
}: {
  values: number[]
  className?: string
  tone?: 'pino' | 'lima' | 'rojo'
}) {
  const lineRef = useRef<SVGPathElement>(null)
  const uid = useId().replace(/:/g, '')
  const gradId = `spark-lima-${uid}`
  const d = sparkPath(values)

  useLayoutEffect(() => {
    const path = lineRef.current
    if (!path || typeof path.getTotalLength !== 'function') return
    if (prefersReducedMotion()) {
      gsap.set(path, { clearProps: 'strokeDasharray,strokeDashoffset' })
      return
    }
    const length = path.getTotalLength()
    if (!Number.isFinite(length) || length <= 0) return
    const tween = gsap.fromTo(
      path,
      { strokeDasharray: length, strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        duration: dur(1.2),
        delay: dur(0.25),
        ease: 'power2.inOut',
        clearProps: 'strokeDasharray,strokeDashoffset',
      },
    )
    return () => {
      tween.kill()
    }
  }, [d])

  const stroke =
    tone === 'lima'
      ? 'var(--color-lima-400)'
      : tone === 'rojo'
        ? 'var(--color-rojo-600)'
        : 'var(--color-pino-800)'

  return (
    <svg
      className={cn('h-8 w-[92px] overflow-visible', className)}
      viewBox="0 0 92 30"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stopColor="var(--color-lima-400)"
            stopOpacity={tone === 'lima' ? 0.45 : 0.32}
          />
          <stop
            offset="100%"
            stopColor="var(--color-lima-400)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={`${d} L90,30 L2,30 Z`} fill={`url(#${gradId})`} />
      <path
        ref={lineRef}
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
