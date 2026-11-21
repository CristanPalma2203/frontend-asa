import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type { LibroDetalle } from '@/features/biblioteca/types/api'
import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

// staleTime de main.tsx: con él, un dato solo se vuelve a pedir si una mutación lo invalida.
const STALE_TIME_APP = 30_000
const COLUMNA_DISPONIBLES = 4 // ISBN, Título, Autor, Categoría, Disponibles, acciones

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
    // Inactivar pide confirmación.
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

    // De vuelta a la lista: estaba en caché con 3 y se invalidó, así que se vuelve a pedir.
    await act(() =>
      router.navigate({
        to: '/admin/libros',
        search: { page: 1, pageSize: 12 },
      }),
    )
    await waitFor(() =>
      expect(celdaDisponibles('El Principito')).toHaveTextContent('2'),
    )
    // Solo el listado de la tabla (pageSize 12); el contador del sidebar usa otra página.
    const listados = api
      .pedidos('/api/libros')
      .filter((url) => url.searchParams.get('pageSize') === '12')
    expect(listados).toHaveLength(2)
  })

  it('el resumen muestra las métricas calculadas con los endpoints existentes', async () => {
    entrarComo('Admin')
    const api = crearApiFake([
      { titulo: 'El Principito', copias: 3 },
      { titulo: 'Dune', copias: 2 },
    ])
    server.use(...api.handlers)
    await renderEn('/admin')

    const metricas = await screen.findByRole('list', { name: 'Métricas' })
    const valor = (etiqueta: string) =>
      within(within(metricas).getByText(etiqueta).closest('li') as HTMLElement)

    expect(await valor('Libros').findByText('2')).toBeInTheDocument()
    expect(valor('Ejemplares disponibles').getByText('5')).toBeInTheDocument()
    expect(
      valor('Ejemplares disponibles').getByText('de 5 ejemplares en total'),
    ).toBeInTheDocument()
    expect(valor('Ejemplares reservados').getByText('0')).toBeInTheDocument()
  })
})
