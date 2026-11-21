import '@testing-library/jest-dom/vitest'
import '@/lib/boneyard'
import { cleanup, configure } from '@testing-library/react'
import { toast } from 'sonner'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/store'
import { useLuxiaStore } from '@/features/luxia/store'

import { esperarNavegacionesPendientes } from './navegaciones'
import { server } from './server'

configure({ asyncUtilTimeout: 5000 })

vi.mock('@paper-design/shaders-react', () => ({
  MeshGradient: () => null,
}))

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: /prefers-reduced-motion:\s*reduce/.test(query),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

HTMLCanvasElement.prototype.getContext = (() =>
  null) as HTMLCanvasElement['getContext']

beforeAll(() => server.listen())

afterEach(async () => {
  await esperarNavegacionesPendientes()
  cleanup()
  server.resetHandlers()
  useAuthStore.getState().logout()
  useLuxiaStore.setState({ abierto: false })
  localStorage.clear()
  toast.dismiss()
})

afterAll(() => server.close())
