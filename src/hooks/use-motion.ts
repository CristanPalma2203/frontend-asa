import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import type { RefObject } from 'react'

gsap.registerPlugin(useGSAP)

export type SeguroEnContexto = <F extends (...args: never[]) => unknown>(
  fn: F,
) => F

export function useMotion<T extends HTMLElement>(
  scope: RefObject<T | null>,
  fn: (root: T, contextSafe: SeguroEnContexto) => void | (() => void),
  deps: unknown[] = [],
) {
  useGSAP(
    (_context, contextSafe) => {
      const root = scope.current
      if (!root || !contextSafe) return
      return fn(root, contextSafe)
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  )
}
