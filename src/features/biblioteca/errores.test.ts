import { describe, expect, it } from 'vitest'

import { mensajeDeError, mensajesError } from '@/features/biblioteca/errores'

describe('mensajeDeError', () => {
  it('traduce cada code conocido', () => {
    for (const [code, mensaje] of Object.entries(mensajesError)) {
      expect(mensajeDeError(code, 'genérico')).toBe(mensaje)
    }
  })

  it('usa el genérico si el code no existe', () => {
    expect(mensajeDeError('no-existe', 'Revisa e inténtalo de nuevo.')).toBe(
      'Revisa e inténtalo de nuevo.',
    )
    expect(mensajeDeError(undefined, 'genérico')).toBe('genérico')
  })
})
