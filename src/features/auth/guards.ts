import { redirect } from '@tanstack/react-router'

import { isSessionActive, useAuthStore } from '@/features/auth/store'

export function requireSession(redirectTo: string) {
  if (!isSessionActive(useAuthStore.getState())) {
    throw redirect({
      to: '/login',
      search: { redirect: redirectTo },
    })
  }
}

export function requireAdmin(redirectTo: string) {
  requireSession(redirectTo)
  if (useAuthStore.getState().rol !== 'Admin') {
    throw redirect({ to: '/' })
  }
}
