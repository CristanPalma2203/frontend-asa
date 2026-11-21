import { fireEvent, render, screen } from '@testing-library/react'
import { delay, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { Hueso, PortadaConCarga } from '@/components/ui/hueso'
import { entrarComo } from '@/test/sesion'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

describe('PortadaConCarga', () => {
  it('muestra shimmer (aria-busy) hasta que la imagen carga', () => {
    const { container } = render(
      <PortadaConCarga
        src="https://covers.test/a.jpg"
        respaldo={<span>respaldo</span>}
      />,
    )
    const img = container.querySelector('img') as HTMLImageElement
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(img).toHaveClass('opacity-0')

    fireEvent.load(img)

    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(img).toHaveClass('opacity-100')
  })

  it('si la imagen falla muestra el respaldo', () => {
    const { container } = render(
      <PortadaConCarga
        src="https://covers.test/b.jpg"
        respaldo={<span>respaldo</span>}
      />,
    )
    fireEvent.error(container.querySelector('img') as HTMLImageElement)

    expect(screen.getByText('respaldo')).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})

describe('Hueso', () => {
  it('con cargando=false renderiza los hijos sin overlay', () => {
    const { container } = render(
      <Hueso cargando={false} alto={14}>
        <span>dato</span>
      </Hueso>,
    )
    expect(screen.getByText('dato')).toBeVisible()
    expect(container.querySelector('[data-boneyard-overlay]')).toBeNull()
    expect(container.querySelector('[aria-busy]')).toBeNull()
  })

  it('con cargando=true pinta el hueso y reserva el alto', () => {
    const { container } = render(
      <Hueso cargando ancho={96} alto={24} radio={999} />,
    )
    expect(container.querySelector('[data-boneyard-overlay]')).not.toBeNull()
    expect(container.querySelector('[data-boneyard-bone]')).not.toBeNull()
  })
})

describe('estados de carga con huecos', () => {
  it('catálogo: tarjetas con su forma y títulos fantasma, sin bloque de tarjeta entera', async () => {
    server.use(
      http.get('http://api.test/api/libros', async () => {
        await delay('infinite')
      }),
    )
    await renderEn('/catalogo?page=1&pageSize=12')

    const fantasmas = await screen.findAllByTestId('libro-card-fantasma')
    expect(fantasmas).toHaveLength(12)
    expect(screen.getAllByTestId('titulo-fantasma')).toHaveLength(12)
    for (const tarjeta of fantasmas) {
      expect(tarjeta.closest('[data-boneyard-content]')).toBeNull()
      expect(
        tarjeta.querySelectorAll('[data-boneyard-overlay]').length,
      ).toBeGreaterThan(0)
    }
  })

  it('admin: la cabecera de la tabla se ve durante la carga', async () => {
    entrarComo('Admin')
    server.use(
      http.get('http://api.test/api/libros', async () => {
        await delay('infinite')
      }),
    )
    await renderEn('/admin/libros?page=1&pageSize=12')

    expect(
      await screen.findByRole('columnheader', { name: 'Título' }),
    ).toBeVisible()
    expect(
      screen.getByRole('columnheader', { name: 'Disponibles' }),
    ).toBeVisible()
    expect(screen.getAllByTestId('fila-fantasma')).toHaveLength(8)
    expect(
      screen.getByRole('searchbox', { name: 'Buscar libros' }),
    ).toBeVisible()
  })
})
