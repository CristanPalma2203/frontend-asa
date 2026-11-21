import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

function suscribir(avisar: () => void) {
  if (typeof window.matchMedia !== 'function') return () => {}
  const mq = window.matchMedia(query)
  mq.addEventListener?.('change', avisar)
  return () => mq.removeEventListener?.('change', avisar)
}

function leer() {
  return (
    typeof window.matchMedia === 'function' && window.matchMedia(query).matches
  )
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(suscribir, leer, () => false)
}
