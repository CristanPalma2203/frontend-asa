import { describe, expect, it } from 'vitest'

import { formatearFecha } from '@/lib/fechas'

describe('formatearFecha', () => {
  it('trata el ISO sin zona como UTC y lo muestra en El Salvador', () => {
    expect(formatearFecha('2026-11-20T14:00:00')).toBe(
      formatearFecha('2026-11-20T14:00:00Z'),
    )
    expect(formatearFecha('2026-11-20T14:00:00')).toMatch(/20 nov 2026/)
    expect(formatearFecha('2026-11-20T14:00:00')).toMatch(/8:00/)
  })

  it('respeta Z y un offset', () => {
    expect(formatearFecha('2026-11-20T14:00:00Z')).toMatch(/8:00/)
    expect(formatearFecha('2026-11-20T14:00:00-06:00')).toMatch(/14:00|2:00/)
  })
})
