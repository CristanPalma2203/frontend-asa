import { describe, expect, it } from 'vitest'

import {
  categoriaDe,
  interpretar,
  normalizar,
} from '@/features/luxia/interpretar'

describe('interpretar', () => {
  it.each([
    ['¿Hay libros de Tolkien?', 'Tolkien'],
    ['¿Cuántos ejemplares quedan de Dune?', 'Dune'],
    ['busca Cien años de soledad', 'Cien años de soledad'],
    ['9788498381498', '9788498381498'],
    ['«El Hobbit»', 'Hobbit'],
  ])('«%s» busca «%s»', (pregunta, consulta) => {
    expect(interpretar(pregunta)).toEqual({ tipo: 'buscar', consulta })
  })

  it('detecta que piden reservar y conserva el título', () => {
    expect(interpretar('Quiero reservar El Principito')).toEqual({
      tipo: 'reservar',
      consulta: 'Principito',
    })
    expect(interpretar('Resérvame Dune')).toEqual({
      tipo: 'reservar',
      consulta: 'Dune',
    })
    expect(interpretar('reserva')).toEqual({ tipo: 'reservar', consulta: '' })
    expect(interpretar('¿Cómo reservo El Principito?')).toEqual({
      tipo: 'reservar',
      consulta: 'Principito',
    })
  })

  it('una pregunta sin contenido es vacía', () => {
    expect(interpretar('¿hay libros?')).toEqual({ tipo: 'vacia', consulta: '' })
  })
})

describe('categoriaDe', () => {
  const categorias = ['Ciencia', 'Novela', 'Historia del arte', 'Fantasía']

  it.each([
    ['¿qué libros de ciencia hay disponibles?', 'Ciencia'],
    ['Ciencia', 'Ciencia'],
    ['CIÉNCIA', 'Ciencia'],
    ['busco libros de fantasia', 'Fantasía'],
    ['¿Tienes algo de historia del arte?', 'Historia del arte'],
  ])('«%s» → %s', (pregunta, esperada) => {
    expect(categoriaDe(pregunta, categorias)).toBe(esperada)
  })

  it.each([['Dune'], ['libros de ciencia ficción'], ['¿qué hay?']])(
    '«%s» no es una categoría: se busca por texto',
    (pregunta) => {
      expect(categoriaDe(pregunta, categorias)).toBeNull()
    },
  )

  it('normalizar quita tildes y mayúsculas pero conserva la ñ', () => {
    expect(normalizar('Ciéncia y ESPAÑA')).toBe('ciencia y españa')
  })
})
