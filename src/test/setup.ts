import '@testing-library/jest-dom/vitest'
import '@/lib/boneyard'
import { cleanup, configure } from '@testing-library/react'
import { toast } from 'sonner'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { useAuthStore } from '@/features/auth/store'
import { useLuxiaStore } from '@/features/luxia/store'

import { server } from './server'

// findBy*/waitFor esperan 5 s (1 s por defecto): con la máquina cargada, la búsqueda diferida del
// catálogo y las respuestas de MSW a veces pasaban del segundo y el test fallaba sin estar roto.
configure({ asyncUtilTimeout: 5000 })

// El fondo del hero usa WebGL (Paper shaders), que jsdom no tiene.
vi.mock('@paper-design/shaders-react', () => ({
  MeshGradient: () => null,
}))

// jsdom no implementa matchMedia (boneyard lo usa para el modo oscuro, LuxIA y GSAP para el
// movimiento reducido). Se fuerza prefers-reduced-motion: reduce para que toda animación termine
// al instante; el resto de consultas responde false. Un test puede sustituirlo con vi.stubGlobal.
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

// jsdom tampoco tiene ResizeObserver (boneyard mide con él el alto real del hueco).
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom no implementa canvas: sin esto cada getContext() avisa por consola.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as HTMLCanvasElement['getContext']

beforeAll(() => server.listen())

afterEach(() => {
  cleanup()
  server.resetHandlers()
  useAuthStore.getState().logout()
  useLuxiaStore.setState({ abierto: false })
  localStorage.clear()
  // Sonner guarda los toasts en un estado global y un Toaster nuevo vuelve a mostrar los activos:
  // sin esto, un toast de un test aparece en el siguiente.
  toast.dismiss()
})

afterAll(() => server.close())
