import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PortadaLibro } from '@/features/biblioteca/components/portadas'

describe('PortadaLibro fallback', () => {
  it('sin ISBN renderiza el fallback con las mismas dimensiones que uno con portada', () => {
    const { container } = render(
      <div>
        <PortadaLibro isbn="" titulo="Don Quijote" className="w-10" />
        <PortadaLibro
          isbn="9780140328721"
          titulo="El Principito"
          className="w-10"
        />
      </div>,
    )

    const fallback = screen.getByRole('img', { name: 'Don Quijote' })
    expect(fallback).toHaveClass('w-10', 'aspect-[2/3]', 'shrink-0')
    expect(fallback).toHaveTextContent('DQ')
    expect(fallback.className).toMatch(/lima-wash/)

    const conIsbn = container
      .querySelector('img[src*="9780140328721"]')
      ?.closest('[class*="aspect-"]')
    expect(conIsbn).toHaveClass('w-10', 'aspect-[2/3]', 'shrink-0')
  })
})
