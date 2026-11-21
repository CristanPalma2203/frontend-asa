import { create } from 'zustand'

type LuxiaState = {
  abierto: boolean
  opener: HTMLElement | null
  abrir: (opener?: HTMLElement | null) => void
  cerrar: () => void
  alternar: (opener?: HTMLElement | null) => void
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
