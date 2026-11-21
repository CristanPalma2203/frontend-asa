export const SM = 'LuxIA_oculta'
export const ARTBOARD = 'LuxIA'

export interface RiveInputLike {
  name: string
  value?: number | boolean
  fire?: () => void
}
export interface RiveLike {
  stateMachineInputs(sm: string): RiveInputLike[] | undefined
}

export interface LuxiaRiveInputs {
  aparecer?: RiveInputLike
  desaparecer?: RiveInputLike
  variante?: RiveInputLike
  estado?: RiveInputLike
  gesto?: RiveInputLike
  mano?: RiveInputLike
}

export function findInputs(rive: RiveLike): LuxiaRiveInputs {
  const list = rive.stateMachineInputs(SM) || []
  const by = (n: string) => list.find((i) => i.name === n)
  return {
    aparecer: by('aparecer'),
    desaparecer: by('desaparecer'),
    variante: by('variante'),
    estado: by('estado'),
    gesto: by('gesto'),
    mano: by('mano'),
  }
}

export function hasAppearControl(i: LuxiaRiveInputs) {
  return !!(i.aparecer && i.desaparecer)
}

export function bootLuxiaRive(
  rive: RiveLike,
  variante: number,
): LuxiaRiveInputs {
  const i = findInputs(rive)
  if (i.variante) i.variante.value = variante
  return i
}

export function syncShown(
  i: LuxiaRiveInputs,
  shown: boolean,
  last: { shown: boolean },
) {
  if (shown === last.shown) return false
  last.shown = shown
  const trigger = shown ? i.aparecer : i.desaparecer
  trigger?.fire?.()
  return true
}
