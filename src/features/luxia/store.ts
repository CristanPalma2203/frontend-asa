import { create } from 'zustand'

/**
 * Estado compartido del chat de LuxIA: lo abren y cierran el botón flotante, el del sidebar y el
 * de la barra superior. `opener` es el botón que lo abrió, para devolverle el foco al cerrar.
 */
type LuxiaState = {
  abierto: boolean
  opener: HTMLElement | null
  abrir: (opener?: HTMLElement | null) => void
  cerrar: () => void
  alternar: (opener?: HTMLElement | null) => void
  setAbierto: (abierto: boolean) => void
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
  setAbierto: (abierto) => set({ abierto }),
  reiniciar: () => set({ abierto: false, opener: null }),
}))
