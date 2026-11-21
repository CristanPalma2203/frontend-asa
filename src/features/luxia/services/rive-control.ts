/** Lógica pura de inputs Rive de LuxIA (sin importar el runtime, testeable). */
/** push-v8: SM `LuxIA_oculta` (artboard LuxIA) arranca oculta desde el cuadro 0 (iniciar_oculta=true por defecto). */
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

/** true si el .riv trae aparecer/desaparecer (si no, el contenedor usa el respaldo CSS). */
export function hasAppearControl(i: LuxiaRiveInputs) {
  return !!(i.aparecer && i.desaparecer)
}

/**
 * En onLoad (onRiveReady, mismo tick de la carga): variante vía r.stateMachineInputs(SM).
 * No usar useStateMachineInput para esto: llega 1-4 cuadros tarde y parpadea.
 */
export function bootLuxiaRive(
  rive: RiveLike,
  variante: number,
): LuxiaRiveInputs {
  const i = findInputs(rive)
  if (i.variante) i.variante.value = variante
  return i
}

/** Dispara aparecer/desaparecer solo cuando cambia el estado visible. */
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
