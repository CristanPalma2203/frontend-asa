import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HeroBackdrop } from '@/features/biblioteca/components/hero-backdrop'
import { resetSoftwareWebGlCache } from '@/features/biblioteca/components/hero-backdrop.webgl'

vi.mock('@paper-design/shaders-react', () => ({
  MeshGradient: () => <div data-testid="mesh-gradient" />,
}))

function simularWebGL(renderer: string) {
  const loseContext = vi.fn()
  const gl = {
    getExtension: (nombre: string) =>
      nombre === 'WEBGL_debug_renderer_info'
        ? { UNMASKED_RENDERER_WEBGL: 1 }
        : nombre === 'WEBGL_lose_context'
          ? { loseContext }
          : null,
    getParameter: () => renderer,
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(((
    tipo: string,
  ) =>
    tipo.startsWith('webgl')
      ? gl
      : null) as unknown as HTMLCanvasElement['getContext'])
  return { loseContext }
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resetSoftwareWebGlCache()
})

describe('HeroBackdrop', () => {
  it('sin WebGL deja solo el wash y la rejilla estática', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    vi.useFakeTimers()
    const { container } = render(<HeroBackdrop />)

    await act(() => vi.advanceTimersByTimeAsync(1000))

    expect(container.querySelector('.hero-fx__wash')).not.toBeNull()
    expect(container.querySelector('.hero-fx__grid')).not.toBeNull()
    expect(screen.queryByTestId('mesh-gradient')).toBeNull()
  })

  it('con render por software no monta el shader', async () => {
    simularWebGL('Google SwiftShader')
    vi.useFakeTimers()
    render(<HeroBackdrop />)

    await act(() => vi.advanceTimersByTimeAsync(1000))

    expect(screen.queryByTestId('mesh-gradient')).toBeNull()
  })

  it('con WebGL por hardware monta el shader a los 800 ms y libera el contexto al desmontar', async () => {
    const { loseContext } = simularWebGL('ANGLE (NVIDIA GeForce)')
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    vi.useFakeTimers()
    const { unmount } = render(<HeroBackdrop />)

    await act(() => vi.advanceTimersByTimeAsync(700))
    expect(screen.queryByTestId('mesh-gradient')).toBeNull()

    await act(() => vi.advanceTimersByTimeAsync(200))
    vi.useRealTimers()
    expect(await screen.findByTestId('mesh-gradient')).toBeInTheDocument()

    const llamadasAntes = loseContext.mock.calls.length
    unmount()
    expect(loseContext.mock.calls.length).toBeGreaterThan(llamadasAntes)
  })
})
