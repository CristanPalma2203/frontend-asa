import { useCallback, useEffect, useRef, useState } from 'react'

export type LuxiaMood =
  'idle' | 'greet' | 'thinking' | 'talking' | 'ready' | 'error'

export interface LuxiaInputs {
  estado: number
  gesto: number
  mano: number
}

export const MOOD_INPUTS: Record<LuxiaMood, LuxiaInputs> = {
  idle: { estado: 0, gesto: 0, mano: 0 },
  greet: { estado: 0, gesto: 4, mano: 16 },
  thinking: { estado: 1, gesto: 0, mano: 2 },
  talking: { estado: 2, gesto: 0, mano: 1 },
  ready: { estado: 3, gesto: 0, mano: 0 },
  error: { estado: 4, gesto: 0, mano: 14 },
}

const AUTO_NEXT: Partial<Record<LuxiaMood, LuxiaMood>> = {
  greet: 'idle',
  talking: 'ready',
}
export const MOOD_HOLD_MS = 2000

export function useLuxiaController(initial: LuxiaMood = 'idle') {
  const [mood, setMoodState] = useState<LuxiaMood>(initial)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setMood = useCallback((next: LuxiaMood) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setMoodState(next)
    const after = AUTO_NEXT[next]
    if (after) {
      timer.current = setTimeout(() => {
        timer.current = null
        setMoodState(after)
      }, MOOD_HOLD_MS)
    }
  }, [])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return { mood, inputs: MOOD_INPUTS[mood], setMood }
}
