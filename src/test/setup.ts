import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { useAuthStore } from '@/features/auth/store'

import { server } from './server'

beforeAll(() => server.listen())

afterEach(() => {
  cleanup()
  server.resetHandlers()
  useAuthStore.getState().logout()
  localStorage.clear()
})

afterAll(() => server.close())
