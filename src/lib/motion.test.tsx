import { act, render, screen } from '@testing-library/react'
import gsap from 'gsap'
import { useRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CountUp } from '@/components/ui/count-up'
import { useMotion } from '@/hooks/use-motion'
import { cardsIn, dur, prefersReducedMotion, reveal } from '@/lib/motion'
import { renderEn } from '@/test/render'

/** Ningún elemento queda oculto ni desplazado por una animación a medias. */
function sinRestosDeAnimacion(root: HTMLElement) {
  const conEstilo = Array.from(
    root.querySelectorAll<HTMLElement>('[style]'),
  ).filter(
    (el) =>
      el.style.opacity === '0' ||
      /translate|scale|rotate/.test(el.style.transform),
  )
  // Los huesos de boneyard arrancan en opacidad 0 por diseño (stagger); no son contenido.
  return conEstilo.filter((el) => !el.closest('[data-boneyard-overlay]'))
}

function simularMovimiento() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('movimiento reducido (setup de los tests)', () => {
  it('dur() devuelve 0', () => {
    expect(prefersReducedMotion()).toBe(true)
    expect(dur(0.85)).toBe(0)
  })

  it.each([
    ['Home', '/', 'Descubre tu próxima lectura'],
    ['Catálogo', '/catalogo?page=1&pageSize=12', 'El Principito'],
    ['Ficha', '/libros/1', 'El Principito'],
  ])(
    '%s queda visible tras montar, sin opacity 0 ni transform inline',
    async (_pantalla, ruta, texto) => {
      const { container } = await renderEn(ruta)
      await screen.findAllByRole('heading', { name: texto })
      await act(async () => {})
      expect(sinRestosDeAnimacion(container)).toEqual([])
    },
  )
})

describe('máscaras de titleLines', () => {
  it('en la Home ninguna palabra usa overflow hidden/auto y el h1 se lee como un solo texto', async () => {
    const { container } = await renderEn('/')
    const h1 = await screen.findByRole('heading', {
      level: 1,
      name: 'Descubre tu próxima lectura',
    })
    await act(async () => {})
    const mascaras = Array.from(
      container.querySelectorAll<HTMLElement>('[data-mascara]'),
    )
    expect(mascaras.length).toBeGreaterThan(0)
    for (const m of mascaras) {
      expect(m.className).not.toMatch(/overflow-(hidden|auto|scroll)/)
      expect(m.className).toContain('overflow-clip')
    }
    expect(h1.querySelectorAll('[data-tl]')).toHaveLength(mascaras.length)
  })

  it('la fila de Recomendados de la Home no saca scroll vertical (overflow-y hidden)', async () => {
    await renderEn('/')
    const tira = await screen.findByRole('list', {
      name: 'Recomendados',
    })
    expect(tira).toHaveClass(
      'overflow-x-auto',
      'overflow-y-hidden',
      'tira-sin-barra',
    )
  })
})

function Animado({ onRoot }: { onRoot: (el: HTMLElement) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useMotion(ref, (root) => {
    onRoot(root)
    reveal(root.children, { y: 12 })
    cardsIn(root.querySelectorAll('li'))
  })
  return (
    <div ref={ref}>
      <p>uno</p>
      <ul>
        <li>a</li>
        <li>b</li>
      </ul>
    </div>
  )
}

describe('con movimiento', () => {
  it('al desmontar no quedan tweens vivos', () => {
    simularMovimiento()
    let root: HTMLElement | null = null
    const { unmount } = render(<Animado onRoot={(el) => (root = el)} />)
    const nodos = [
      ...Array.from((root as unknown as HTMLElement).children),
      ...Array.from((root as unknown as HTMLElement).querySelectorAll('li')),
    ]
    expect(nodos.some((n) => gsap.getTweensOf(n).length > 0)).toBe(true)

    unmount()

    for (const n of nodos) expect(gsap.getTweensOf(n)).toHaveLength(0)
  })

  it('CountUp termina en el valor final', async () => {
    simularMovimiento()
    render(<CountUp value={12345} duration={0.2} />)
    // Arranca en 0 y GSAP (con su ticker real) cuenta hasta el valor.
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(
      await screen.findByText('12.345', {}, { timeout: 2000 }),
    ).toBeInTheDocument()
  })

  it('CountUp con movimiento reducido escribe el valor al instante', () => {
    render(<CountUp value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })
})
