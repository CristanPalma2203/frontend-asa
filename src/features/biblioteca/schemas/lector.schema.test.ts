import { describe, expect, it } from 'vitest'

import { lectorSchema } from '@/features/biblioteca/schemas/lector.schema'

const base = {
  identificador: 'LEC-001',
  nombre: 'Ana López',
  correo: 'ana@demo.local',
}

describe('lectorSchema', () => {
  it('acepta lector sin contraseña o con contraseña vacía', () => {
    expect(lectorSchema.safeParse(base).success).toBe(true)
    expect(lectorSchema.safeParse({ ...base, password: '' }).success).toBe(true)
  })

  it('exige al menos 8 caracteres si viene contraseña', () => {
    const corta = lectorSchema.safeParse({ ...base, password: '1234567' })
    expect(corta.success).toBe(false)
    expect(corta.error?.issues[0]?.message).toBe('La contraseña debe tener al menos 8 caracteres.')
    expect(lectorSchema.safeParse({ ...base, password: '12345678' }).success).toBe(true)
  })
})
