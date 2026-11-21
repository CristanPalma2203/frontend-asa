export const RESERVAS_PAD = { l: 32, r: 0, t: 12, b: 28 } as const

export function monotonePath(points: Array<[number, number]>) {
  const n = points.length
  if (n < 2) return ''
  const first = points[0]!
  if (n === 2) {
    const last = points[1]!
    return `M${first[0]},${first[1]} L${last[0]},${last[1]}`
  }

  const dx: number[] = []
  const dy: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const a = points[i]!
    const b = points[i + 1]!
    dx[i] = b[0] - a[0]
    dy[i] = b[1] - a[1]
    m[i] = dx[i] !== 0 ? dy[i]! / dx[i]! : 0
  }

  const t: number[] = Array.from({ length: n }, () => 0)
  t[0] = m[0]!
  t[n - 1] = m[n - 2]!
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1]! * m[i]! <= 0) t[i] = 0
    else t[i] = (m[i - 1]! + m[i]!) / 2
  }

  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(m[i]!) < 1e-12) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i]! / m[i]!
    const b = t[i + 1]! / m[i]!
    const s = a * a + b * b
    if (s > 9) {
      const tau = 3 / Math.sqrt(s)
      t[i] = tau * a * m[i]!
      t[i + 1] = tau * b * m[i]!
    }
  }

  let d = `M${first[0]},${first[1]}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i]!
    const p1 = points[i + 1]!
    const h = dx[i]!
    const cp1x = p0[0] + h / 3
    const cp1y = p0[1] + (t[i]! * h) / 3
    const cp2x = p1[0] - h / 3
    const cp2y = p1[1] - (t[i + 1]! * h) / 3
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p1[0]},${p1[1]}`
  }
  return d
}

export const smoothPath = monotonePath

export function indiceDiaDesdeX(
  clientX: number,
  rectLeft: number,
  width: number,
  padL: number,
  padR: number,
  n: number,
) {
  if (n <= 1) return 0
  const x = clientX - rectLeft
  const plotW = Math.max(1, width - padL - padR)
  const t = (x - padL) / plotW
  return Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))))
}

export function sparkPath(values: number[], width = 92, height = 30) {
  if (values.length === 0) return 'M2,28 L90,28'
  const max = Math.max(1, ...values)
  const min = Math.min(0, ...values)
  const span = Math.max(1, max - min)
  const n = values.length
  const pts = values.map((v, i) => {
    const x = n === 1 ? width / 2 : 2 + (i / (n - 1)) * (width - 4)
    const y = height - 2 - ((v - min) / span) * (height - 6)
    return [x, y] as [number, number]
  })
  return monotonePath(pts) || `M2,${height - 2} L${width - 2},${height - 2}`
}
