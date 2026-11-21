import gsap from 'gsap'

// Movimiento de la app con GSAP. Curvas y tiempos portados de las plantillas:
// - Wynlo motion.tsx / sidebar.tsx (enterNodes, useDashboardMotion, CountUp, lift, magnetic)
// - Flito kit (so = reveal, co = cardsIn, uo = pop, X = dur, Pc = drawer)
// - Tend: solo valores (titleLines, diálogos); el código es propio.
// Con prefers-reduced-motion todas las duraciones, delays y staggers valen 0 y el contenido queda
// visible al instante (clearProps).

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Duración o retardo: 0 con movimiento reducido (X de Flito, dur de Wynlo). */
export function dur(value: number) {
  return prefersReducedMotion() ? 0 : value
}

type Nodos = Element | null | undefined | ArrayLike<Element> | Iterable<Element>

function lista(nodos: Nodos): Element[] {
  if (!nodos) return []
  if (nodos instanceof Element) return [nodos]
  return Array.from(nodos as ArrayLike<Element>)
}

/** Entrada suave (so() de Flito, enterNodes() de Wynlo). */
export function reveal(
  nodos: Nodos,
  { x = 0, y = 12, stagger = 0.045, delay = 0 }: { x?: number; y?: number; stagger?: number; delay?: number } = {},
) {
  const els = lista(nodos)
  if (!els.length) return
  gsap.fromTo(
    els,
    { opacity: 0, x, y },
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration: dur(0.55),
      ease: 'power3.out',
      stagger: dur(stagger),
      delay: dur(delay),
      clearProps: 'transform,opacity',
    },
  )
}

/** Tarjetas que entran ladeadas (co() de Flito, useDashboardMotion de Wynlo). */
export function cardsIn(nodos: Nodos, { delay = 0, stagger = 0.07 }: { delay?: number; stagger?: number } = {}) {
  const els = lista(nodos)
  if (!els.length) return
  gsap.fromTo(
    els,
    { opacity: 0, y: 40, rotation: (i: number) => (i % 2 ? 2.5 : -2.5), scale: 0.95 },
    {
      opacity: 1,
      y: 0,
      rotation: 0,
      scale: 1,
      duration: dur(0.85),
      ease: 'back.out(1.4)',
      stagger: dur(stagger),
      delay: dur(delay),
      clearProps: 'transform,opacity',
    },
  )
}

/**
 * Título por palabras (patrón de Tend): cada palabra va en una máscara con overflow clip
 * (componente <PalabrasAnimadas>) y sube desde abajo. Sin palabras marcadas, entrada suave.
 */
export function titleLines(el: Element | null | undefined, delay = 0) {
  if (!el) return
  const palabras = el.querySelectorAll('[data-tl]')
  if (!palabras.length) {
    reveal(el, { y: 14, delay })
    return
  }
  gsap.fromTo(
    palabras,
    { yPercent: 105, rotation: 4 },
    {
      yPercent: 0,
      rotation: 0,
      duration: dur(0.85),
      ease: 'power4.out',
      stagger: dur(0.022),
      delay: dur(delay),
      clearProps: 'transform',
    },
  )
}

/** Aparición con rebote (uo() de Flito, KPIs de Wynlo). */
export function pop(
  nodos: Nodos,
  { from = 0.6, delay = 0, stagger = 0.05 }: { from?: number; delay?: number; stagger?: number } = {},
) {
  const els = lista(nodos)
  if (!els.length) return
  gsap.fromTo(
    els,
    { scale: from, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: dur(0.6),
      ease: 'back.out(3)',
      delay: dur(delay),
      stagger: dur(stagger),
      overwrite: 'auto',
      clearProps: 'transform,opacity',
    },
  )
}

/** Diálogos (valores de Tend): entrada con rebote y salida corta hacia arriba. */
export function dialogoEntra(el: Element) {
  gsap.fromTo(
    el,
    { opacity: 0, y: -14, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: dur(0.38), ease: 'back.out(1.6)', clearProps: 'transform,opacity' },
  )
}

export function dialogoSale(el: Element, onComplete: () => void) {
  gsap.to(el, { opacity: 0, y: -8, duration: dur(0.16), ease: 'power2.in', onComplete })
}

function punteroFino() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !prefersReducedMotion()
  )
}

/** [data-lift] sube 4 px al pasar el puntero (Wynlo motion.tsx). Devuelve la limpieza. */
export function lift(root: Element) {
  if (!punteroFino()) return () => {}
  const quitar: Array<() => void> = []
  root.querySelectorAll<HTMLElement>('[data-lift]').forEach((el) => {
    const enter = () => gsap.to(el, { y: -4, duration: 0.45, ease: 'power3.out', overwrite: 'auto' })
    const leave = () =>
      gsap.to(el, { y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto', clearProps: 'transform' })
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    quitar.push(() => {
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
    })
  })
  return () => quitar.forEach((fn) => fn())
}

/** [data-magnetic] sigue al puntero (factor 0.2 / 0.28 respecto al centro, Wynlo). */
export function magnetic(root: Element) {
  if (!punteroFino()) return () => {}
  const quitar: Array<() => void> = []
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })
    const move = (event: PointerEvent) => {
      const box = el.getBoundingClientRect()
      x((event.clientX - box.left - box.width / 2) * 0.2)
      y((event.clientY - box.top - box.height / 2) * 0.28)
    }
    const leave = () => {
      x(0)
      y(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    quitar.push(() => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    })
  })
  return () => quitar.forEach((fn) => fn())
}
