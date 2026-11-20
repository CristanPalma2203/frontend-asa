import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { toast } from 'sonner'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { useAuthStore } from '@/features/auth/store'

import { server } from './server'

beforeAll(() => server.listen())

afterEach(() => {
  cleanup()
  server.resetHandlers()
  useAuthStore.getState().logout()
  localStorage.clear()
  // Sonner guarda los toasts en un estado global y un Toaster nuevo vuelve a mostrar los activos:
  // sin esto, un toast de un test aparece en el siguiente.
  toast.dismiss()
})

afterAll(() => server.close())
