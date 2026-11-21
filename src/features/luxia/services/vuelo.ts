export const FLIGHT_MS = 750
export const APPEAR_WAIT_MS = 1500

function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (t: number) =>
    3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3
  const by = (t: number) =>
    3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3
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

export type Pose = { x: number; y: number; scale: number; opacity: number }

export type Vuelo =
  | { tipo: 'arco'; poses: Pose[]; duration: number }
  | { tipo: 'quieto'; destino: Omit<Pose, 'opacity'> }

export function flightKeyframes(
  from: Pt,
  ctrl: Pt,
  to: Pt,
  ms = FLIGHT_MS,
): Vuelo {
  const poses: Pose[] = []
  for (let i = 0; i <= STEPS; i++) {
    const p = easeInOut(i / STEPS)
    const q = (k: keyof Pt) =>
      (1 - p) ** 2 * from[k] + 2 * (1 - p) * p * ctrl[k] + p * p * to[k]
    poses.push({
      x: q('x'),
      y: q('y'),
      scale: q('s'),
      opacity: Math.min(1, Math.max(0, q('o'))),
    })
  }
  return { tipo: 'arco', poses, duration: ms / 1000 }
}

export function dockAnim(
  dock: Dock | null,
  from: Dock,
  reduced: boolean,
): Vuelo {
  const to = dock || ESQUINA
  if (reduced) {
    return { tipo: 'quieto', destino: { x: to.x, y: to.y, scale: to.s } }
  }
  const a = { ...from, o: 1 }
  const b = { ...to, o: 1 }
  const ctrl = {
    x: a.x + (b.x - a.x) * (dock ? 0.15 : 0.85),
    y: Math.min(a.y, b.y) - 60,
    s: (a.s + b.s) / 2,
    o: 1,
  }
  return flightKeyframes(a, ctrl, b)
}

export function claveDock(d: Dock) {
  return `${d.x.toFixed(1)},${d.y.toFixed(1)},${d.s.toFixed(3)}`
}
