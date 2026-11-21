import { useEffect, useState, type RefObject } from 'react'

/**
 * Teclado móvil: publica en `el` --lx-vvh (alto del viewport
 * visible) y --lx-kb (alto tapado debajo, p. ej. el teclado de iOS) con window.visualViewport.
 * Devuelve true si el teclado ocupa espacio. Llama a `onChange` para re-medir el muelle de LuxIA.
 *
 * Por las reglas de hooks: la primera medición va en requestAnimationFrame (no
 * síncrona en el efecto) y al desactivarse no se hace setKb(false): el valor devuelto es
 * `active && kb`, así que se apaga solo.
 */
export function useVisualViewportVars(
  active: boolean,
  el: RefObject<HTMLElement | null>,
  onChange?: () => void,
) {
  const [kb, setKb] = useState(false)

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    const node = el.current
    if (!active || !vv || !node) return undefined
    let raf = 0
    const apply = () => {
      raf = 0
      const inset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
      node.style.setProperty('--lx-vvh', `${Math.round(vv.height)}px`)
      node.style.setProperty('--lx-kb', `${Math.round(inset)}px`)
      setKb(inset > 80)
      // El panel cambia de posición con el teclado: re-mide tras el siguiente layout.
      window.requestAnimationFrame(() => onChange?.())
    }
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(apply)
    }
    schedule()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      node.style.removeProperty('--lx-vvh')
      node.style.removeProperty('--lx-kb')
    }
  }, [active, el, onChange])

  return active && kb
}
