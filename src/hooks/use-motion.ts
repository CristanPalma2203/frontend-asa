import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import type { RefObject } from 'react'

gsap.registerPlugin(useGSAP)

/** Envuelve un callback (listener, observer) para que lo que anime se revierta con el contexto. */
export type SeguroEnContexto = <F extends (...args: never[]) => unknown>(
  fn: F,
) => F

/**
 * Animaciones de un contenedor con useGSAP: `scope` es el ref del contenedor, todo lo creado
 * dentro se revierte al desmontar o al cambiar `deps` (revertOnUpdate). `fn` solo lee el DOM;
 * si devuelve una función (listeners de lift o magnetic), se ejecuta en la limpieza. Lo que se
 * anime desde callbacks asíncronos debe ir envuelto en `contextSafe`.
 */
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
