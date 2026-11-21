import { describe, expect, it } from 'vitest'

import { mensajeDeError, mensajesError } from '@/features/biblioteca/errores'

describe('mensajeDeError', () => {
  it('traduce cada code conocido', () => {
    for (const [code, mensaje] of Object.entries(mensajesError)) {
      expect(mensajeDeError(code, 'genérico')).toBe(mensaje)
    }
  })

  it.each([
    ['libro-inactivo', 'Este libro está inactivo y no se puede reservar.'],
    ['lector-no-encontrado', 'No se encontró el lector.'],
    ['acceso-denegado', 'No tienes permiso para hacer esta acción.'],
    ['registro-duplicado', 'Ya existe un registro con esos datos.'],
  ])('muestra su propio texto para %s', (code, texto) => {
    expect(mensajeDeError(code, 'genérico')).toBe(texto)
  })

  it('usa el genérico si el code no existe', () => {
    expect(mensajeDeError('no-existe', 'Revisa e inténtalo de nuevo.')).toBe(
      'Revisa e inténtalo de nuevo.',
    )
    expect(mensajeDeError(undefined, 'genérico')).toBe('genérico')
  })
})
