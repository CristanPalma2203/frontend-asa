import type { TargetAndTransition } from 'framer-motion'

// Vuelo de LuxIA entre su esquina y el hueco del header. Portado de Corelux LuxiaFab.tsx sin
// cambios de lógica ni de tiempos.

/** Curva suave ease-in-out (cubic-bezier(0.65,0,0.35,1)) aplicada UNA vez a todo el vuelo. */
export const FLIGHT_MS = 750
/** Espera máxima a que el .riv diga si trae aparecer/desaparecer; luego fundido CSS de respaldo. */
export const APPEAR_WAIT_MS = 1500

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (t: number) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3
  const by = (t: number) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3
  return (x: number) => {
    let lo = 0
    let hi = 1
    for (let i = 0; i < 30; i++) {
      const m = (lo + hi) / 2
      if (bx(m) < x) lo = m
      else hi = m
    }
    return by((lo + hi) / 2)
  }
}
const easeInOut = cubicBezier(0.65, 0, 0.35, 1)

type Pt = { x: number; y: number; s: number; o: number }
export type Dock = { x: number; y: number; s: number }
export const ESQUINA: Dock = { x: 0, y: 0, s: 1 }
const STEPS = 24

/**
 * Vuelo en curva (Bézier cuadrática from→ctrl→to) muestreado en STEPS keyframes con tiempos
 * uniformes, interpolación lineal entre ellos y el easing aplicado una sola vez al progreso global.
 */
export function flightKeyframes(from: Pt, ctrl: Pt, to: Pt, ms = FLIGHT_MS) {
  const x: number[] = []
  const y: number[] = []
  const scale: number[] = []
  const opacity: number[] = []
  const times: number[] = []
  for (let i = 0; i <= STEPS; i++) {
    const p = easeInOut(i / STEPS)
    const q = (k: keyof Pt) => (1 - p) ** 2 * from[k] + 2 * (1 - p) * p * ctrl[k] + p * p * to[k]
    x.push(q('x'))
    y.push(q('y'))
    scale.push(q('s'))
    opacity.push(Math.min(1, Math.max(0, q('o'))))
    times.push(i / STEPS)
  }
  return { x, y, scale, opacity, transition: { duration: ms / 1000, ease: 'linear' as const, times } }
}

/**
 * Animación del muelle: de la esquina al header (y vuelta) en arco.
 * El punto de control sube 60 px → curva, nunca línea recta ni «suelo».
 */
export function dockAnim(dock: Dock | null, from: Dock, reduced: boolean): TargetAndTransition {
  const to = dock || ESQUINA
  if (reduced) {
    // Sin vuelo: aparece/desaparece en su nuevo sitio con un fundido.
    return { x: to.x, y: to.y, scale: to.s, opacity: [0, 1], transition: { duration: 0.3 } }
  }
  const a = { ...from, o: 1 }
  const b = { ...to, o: 1 }
  const ctrl = dock
    ? { x: a.x + (b.x - a.x) * 0.15, y: Math.min(a.y, b.y) - 60, s: (a.s + b.s) / 2, o: 1 }
    : { x: a.x + (b.x - a.x) * 0.85, y: Math.min(a.y, b.y) - 60, s: (a.s + b.s) / 2, o: 1 }
  return flightKeyframes(a, ctrl, b) as unknown as TargetAndTransition
}

export function claveDock(d: Dock) {
  return `${d.x.toFixed(1)},${d.y.toFixed(1)},${d.s.toFixed(3)}`
}
