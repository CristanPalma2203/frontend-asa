import { useEffect, useState, type RefObject } from 'react'

export function useVisualViewportVars(
  active: boolean,
  el: RefObject<HTMLElement | null>,
  onChange?: () => void,
) {
  const [kb, setKb] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    const node = el.current
    if (!active || !vv || !node) return undefined
    let raf = 0
    const apply = () => {
      raf = 0
      const inset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
      node.style.setProperty('--lx-vvh', `${Math.round(vv.height)}px`)
      node.style.setProperty('--lx-kb', `${Math.round(inset)}px`)
      setKb(inset > 80)
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
