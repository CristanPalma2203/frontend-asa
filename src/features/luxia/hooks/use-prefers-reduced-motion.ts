import { useSyncExternalStore } from 'react'

// Sacado de Corelux LuxiaFab.tsx. Allí era useState + listener en un efecto; aquí
// useSyncExternalStore: mismo resultado sin estado propio que sincronizar.
const query = '(prefers-reduced-motion: reduce)'

function suscribir(avisar: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const mq = window.matchMedia(query)
  mq.addEventListener?.('change', avisar)
  return () => mq.removeEventListener?.('change', avisar)
}

function leer() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(query).matches
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(suscribir, leer, () => false)
}
