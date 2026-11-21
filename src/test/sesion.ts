import { useAuthStore } from '@/features/auth/store'

export function entrarComo(rol: 'Lector' | 'Admin') {
  useAuthStore.getState().login({
    token: 'token-test',
    expiresAt: Date.now() + 60_000,
    rol,
    nombre: rol === 'Admin' ? 'Admin' : 'Ana',
    lectorId: rol === 'Lector' ? 2 : null,
    correo: rol === 'Admin' ? 'admin@demo.local' : 'ana@demo.local',
  })
}
