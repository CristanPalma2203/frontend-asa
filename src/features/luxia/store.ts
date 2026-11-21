import { create } from 'zustand'

/**
 * Estado del chat de LuxIA. Solo lo abre la mascota flotante; se cierra con ella, con Escape o al
 * ir a una ficha. `opener` es el botón que lo abrió, para devolverle el foco al cerrar.
 */
type LuxiaState = {
  abierto: boolean
  opener: HTMLElement | null
  abrir: (opener?: HTMLElement | null) => void
  cerrar: () => void
  alternar: (opener?: HTMLElement | null) => void
  /** Vuelve al estado inicial (cerrado, sin opener). */
  reiniciar: () => void
}

export const useLuxiaStore = create<LuxiaState>((set, get) => ({
  abierto: false,
  opener: null,
  abrir: (opener = null) => set({ abierto: true, opener }),
  cerrar: () => set({ abierto: false }),
  alternar: (opener = null) =>
    get().abierto ? set({ abierto: false }) : set({ abierto: true, opener }),
  reiniciar: () => set({ abierto: false, opener: null }),
}))
