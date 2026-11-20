import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type AuthSession = {
  token: string
  expiresAt: string | number
  rol: string
  nombre: string
  lectorId: number | null
}

type AuthState = {
  token: string | null
  expiresAt: number | null
  rol: string | null
  nombre: string | null
  lectorId: number | null
  login: (session: AuthSession) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      expiresAt: null,
      rol: null,
      nombre: null,
      lectorId: null,
      login: (session) =>
        set({
          token: session.token,
          expiresAt: toEpoch(session.expiresAt),
          rol: session.rol,
          nombre: session.nombre,
          lectorId: session.lectorId,
        }),
      logout: () =>
        set({
          token: null,
          expiresAt: null,
          rol: null,
          nombre: null,
          lectorId: null,
        }),
    }),
    {
      name: 'asa-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        expiresAt: state.expiresAt,
        rol: state.rol,
        nombre: state.nombre,
        lectorId: state.lectorId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !isSessionActive(state)) {
          state.logout()
        }
      },
    },
  ),
)

export function isSessionActive(state: Pick<AuthState, 'token' | 'expiresAt'>) {
  if (!state.token || state.expiresAt == null) return false
  return state.expiresAt > Date.now()
}

export function selectIsAdmin(state: AuthState) {
  return isSessionActive(state) && state.rol === 'Admin'
}

export function selectIsLector(state: AuthState) {
  return isSessionActive(state) && state.rol === 'Lector'
}

function toEpoch(value: string | number) {
  const time = typeof value === 'number' ? value : Date.parse(value)
  return Number.isNaN(time) ? 0 : time
}
