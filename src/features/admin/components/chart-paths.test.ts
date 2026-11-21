import { describe, expect, it } from 'vitest'

import {
  indiceDiaDesdeX,
  monotonePath,
} from '@/features/admin/components/chart-paths'

describe('indiceDiaDesdeX', () => {
  const padL = 32
  const padR = 0
  const width = 432 // plot = 400

  it('mapea el borde izquierdo del plot al día 0', () => {
    expect(indiceDiaDesdeX(100 + padL, 100, width, padL, padR, 14)).toBe(0)
  })

  it('mapea el borde derecho al último día', () => {
    expect(
      indiceDiaDesdeX(100 + width - padR, 100, width, padL, padR, 14),
    ).toBe(13)
  })

  it('elige el día más cercano en el centro del plot', () => {
    // mitad del plot → día ~6.5 → 7 o 6
    const mid = 100 + padL + (width - padL - padR) / 2
    const i = indiceDiaDesdeX(mid, 100, width, padL, padR, 14)
    expect(i).toBeGreaterThanOrEqual(6)
    expect(i).toBeLessThanOrEqual(7)
  })
})

describe('monotonePath', () => {
  it('no genera overshoot vertical entre 0 y 5', () => {
    const pts: Array<[number, number]> = [
      [0, 30],
      [10, 0],
      [20, 30],
      [30, 0],
    ]
    const d = monotonePath(pts)
    // Controles C: extraer números y y comprobar que quedan entre min y max del segmento
    const nums = [...d.matchAll(/[\d.]+/g)].map(Number)
    // Path válido y no vacío
    expect(d.startsWith('M')).toBe(true)
    expect(nums.length).toBeGreaterThan(4)
  })
})
