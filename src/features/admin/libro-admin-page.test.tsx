import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type { LibroDetalle } from '@/features/biblioteca/types/api'
import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const STALE_TIME_APP = 30_000
const COLUMNA_DISPONIBLES = 4

function celdaDisponibles(titulo: string) {
  const fila = screen
    .getByRole('link', { name: titulo })
    .closest('tr') as HTMLElement
  return within(fila).getAllByRole('cell')[COLUMNA_DISPONIBLES]
}

describe('admin de ejemplares', () => {
  it('inactivar un ejemplar baja los disponibles del libro (detalle y lista)', async () => {
    const user = userEvent.setup()
    entrarComo('Admin')
    const api = crearApiFake([{ titulo: 'El Principito', copias: 3 }])
    server.use(...api.handlers)
    const { router, queryClient } = await renderEn(
      '/admin/libros?page=1&pageSize=12',
      {
        staleTime: STALE_TIME_APP,
      },
    )
    await screen.findByRole('link', { name: 'El Principito' })
    expect(celdaDisponibles('El Principito')).toHaveTextContent('3')

    await act(() =>
      router.navigate({
        to: '/admin/libros/$idLibro',
        params: { idLibro: '1' },
        search: { page: 1, pageSize: 12 },
      }),
    )
    const fila = (await screen.findByText('BIB-001')).closest(
      'tr',
    ) as HTMLElement

    await user.click(within(fila).getByRole('button', { name: 'Inactivar' }))
    const dialogo = await screen.findByRole('dialog', {
      name: 'Inactivar ejemplar',
    })
    await user.click(within(dialogo).getByRole('button', { name: 'Inactivar' }))

    expect(await within(fila).findByText('Inactivo')).toBeInTheDocument()
    expect(api.libros[0]?.ejemplares[0]?.estado).toBe('Inactivo')
    await waitFor(() =>
      expect(
        queryClient.getQueryData<LibroDetalle>(queryKeys.libros.detail(1))
          ?.disponibles,
      ).toBe(2),
    )

    await act(() =>
      router.navigate({
        to: '/admin/libros',
        search: { page: 1, pageSize: 12 },
      }),
    )
    await waitFor(() =>
      expect(celdaDisponibles('El Principito')).toHaveTextContent('2'),
    )
    const listados = api
      .pedidos('/api/libros')
      .filter((url) => url.searchParams.get('pageSize') === '12')
    expect(listados).toHaveLength(2)
  })
})
