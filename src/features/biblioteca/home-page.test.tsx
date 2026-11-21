import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { resumirHome } from '@/features/biblioteca/hooks/use-libros'
import type { Libro } from '@/features/biblioteca/types/api'
import { libroEjemplo } from '@/test/fixtures'
import { renderEn } from '@/test/render'

describe('home', () => {
  it('muestra el total, las categorías y las portadas que devuelve la API', async () => {
    await renderEn('/')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Encuentra tu próximo libro',
    )
    expect(await screen.findByText('1 título en el catálogo')).toBeInTheDocument()

    const categorias = screen.getByRole('list', { name: 'Categorías' })
    expect(within(categorias).getByRole('link', { name: 'Infantil' })).toHaveAttribute(
      'href',
      expect.stringContaining('categoria=Infantil'),
    )

    const portadas = screen.getByRole('list', { name: 'Libros del catálogo' })
    expect(
      within(portadas).getByRole('link', { name: 'El Principito, disponible' }),
    ).toHaveAttribute('href', '/libros/1')

    expect(screen.getByRole('heading', { name: 'Reservar es así de simple' })).toBeInTheDocument()
  })
})

describe('resumirHome', () => {
  const libro = (id: number, categoria: string, disponibles: number): Libro => ({
    ...libroEjemplo,
    idLibro: id,
    categoria,
    disponibles,
  })

  it('pone primero los libros con stock y ordena categorías por frecuencia', () => {
    const items = [libro(1, 'Poesía', 0), libro(2, 'Novela', 1), libro(3, 'Novela', 2)]
    const resumen = resumirHome({ items, totalCount: 30 })

    expect(resumen.totalTitulos).toBe(30)
    expect(resumen.destacados.map((l) => l.idLibro)).toEqual([2, 3, 1])
    expect(resumen.categorias).toEqual(['Novela', 'Poesía'])
  })
})
