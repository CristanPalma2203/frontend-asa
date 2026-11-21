import { describe, expect, it } from 'vitest'

import { interpretar } from '@/features/luxia/interpretar'

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
    expect(interpretar('Resérvame Dune')).toEqual({ tipo: 'reservar', consulta: 'Dune' })
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
