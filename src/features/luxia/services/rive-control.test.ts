import { describe, expect, it, vi } from 'vitest'

import {
  SM,
  bootLuxiaRive,
  hasAppearControl,
  syncShown,
  type RiveInputLike,
} from '@/features/luxia/services/rive-control'

function fakeRive() {
  const list: RiveInputLike[] = [
    'estado',
    'aparecer',
    'desaparecer',
    'variante',
  ].map((name) => ({
    name,
    value: undefined,
    fire: vi.fn(),
  }))
  const seen: string[] = []
  const rive = {
    stateMachineInputs: (sm: string) => {
      seen.push(sm)
      return list
    },
  }
  const by = (n: string) => list.find((i) => i.name === n) as RiveInputLike
  return { rive, by, seen }
}

describe('Rive LuxIA push-v8', () => {
  it('usa la SM LuxIA_oculta y fija la variante al cargar', () => {
    const { rive, by, seen } = fakeRive()
    const i = bootLuxiaRive(rive, 0)
    expect(seen).toEqual([SM])
    expect(SM).toBe('LuxIA_oculta')
    expect(by('variante').value).toBe(0)
    expect(hasAppearControl(i)).toBe(true)
  })

  it('aparecer al mostrarse y desaparecer al ocultarse, sin repetir', () => {
    const { rive, by } = fakeRive()
    const i = bootLuxiaRive(rive, 0)
    const last = { shown: false }
    syncShown(i, false, last)
    syncShown(i, true, last)
    syncShown(i, true, last)
    syncShown(i, false, last)
    expect(by('aparecer').fire).toHaveBeenCalledTimes(1)
    expect(by('desaparecer').fire).toHaveBeenCalledTimes(1)
  })

  it('sin triggers → respaldo CSS', () => {
    const rive = { stateMachineInputs: () => [{ name: 'variante', value: 0 }] }
    expect(hasAppearControl(bootLuxiaRive(rive, 0))).toBe(false)
  })
})
