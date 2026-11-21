import gsap from 'gsap'
import { useLayoutEffect, useRef } from 'react'

import { prefersReducedMotion } from '@/lib/motion'

const formatoPorDefecto = (valor: number) =>
  Math.round(valor).toLocaleString('es')

/**
 * Cifra que cuenta hasta su valor (power3.out, 1.2 s). Con
 * movimiento reducido se escribe el valor final sin animar. Solo toca el texto del span.
 */
export function CountUp({
  value,
  format = formatoPorDefecto,
  duration = 1.2,
  delay = 0,
  className,
}: {
  value: number
  format?: (value: number) => string
  duration?: number
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const proxy = useRef({ v: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const state = proxy.current
    gsap.killTweensOf(state)
    if (prefersReducedMotion() || duration === 0 || state.v === value) {
      state.v = value
      el.textContent = format(value)
      return
    }
    el.textContent = format(state.v)
    const tween = gsap.to(state, {
      v: value,
      duration,
      delay,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = format(state.v)
      },
      onComplete: () => {
        el.textContent = format(value)
      },
    })
    return () => {
      tween.kill()
    }
  }, [value, duration, delay, format])

  return (
    <span ref={ref} className={className}>
      {format(prefersReducedMotion() ? value : 0)}
    </span>
  )
}
