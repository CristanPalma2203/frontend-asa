import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type { LibroDetalle } from '@/features/biblioteca/types/api'
import { crearApiFake } from '@/test/api-fake'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const RUTA = '/admin/libros/1?page=1&pageSize=12'

async function montar(copias = 2) {
  entrarComo('Admin')
  const api = crearApiFake([{ titulo: 'El Principito', copias }])
  server.use(...api.handlers)
  const render = await renderEn(RUTA, { staleTime: 30_000 })
  const fila = (await screen.findByText('BIB-001')).closest('tr') as HTMLElement
  return { api, fila, user: userEvent.setup(), ...render }
}

describe('admin: editar y desactivar ejemplares', () => {
  it('edita el código con PUT /api/ejemplares/{id} y su rowVersion, y recarga la lista', async () => {
    const { api, fila, user } = await montar()
    const rowVersion = api.libros[0]?.ejemplares[0]?.rowVersion

    await user.click(
      within(fila).getByRole('button', { name: 'Editar BIB-001' }),
    )
    const dialogo = await screen.findByRole('dialog', {
      name: 'Editar ejemplar',
    })
    const campo = within(dialogo).getByLabelText('Código de inventario')
    expect(campo).toHaveValue('BIB-001')
    await user.clear(campo)
    await user.type(campo, 'BIB-900')
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('BIB-900')).toBeInTheDocument()
    expect(api.libros[0]?.ejemplares[0]?.codigoInventario).toBe('BIB-900')
    const put = api.pedidos('/api/ejemplares/1')
    expect(put).toHaveLength(1)
    expect(rowVersion).toBeTruthy()
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Editar ejemplar' }),
      ).toBeNull(),
    )
  })

  it('valida con Zod antes de enviar y muestra en el campo el código duplicado del backend', async () => {
    const { api, fila, user } = await montar()

    await user.click(
      within(fila).getByRole('button', { name: 'Editar BIB-001' }),
    )
    const dialogo = await screen.findByRole('dialog', {
      name: 'Editar ejemplar',
    })
    const campo = within(dialogo).getByLabelText('Código de inventario')

    await user.clear(campo)
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))
    expect(
      await within(dialogo).findByText(
        'El código de inventario es obligatorio.',
      ),
    ).toBeInTheDocument()
    expect(api.pedidos('/api/ejemplares/1')).toHaveLength(0)

    await user.type(campo, 'BIB-002')
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))
    expect(
      await within(dialogo).findByText(
        'Ya existe un ejemplar con ese código de inventario.',
      ),
    ).toBeInTheDocument()
    expect(campo).toHaveAttribute('aria-invalid', 'true')
  })

  it('con conflicto de concurrencia avisa y recarga la lista para tomar el rowVersion nuevo', async () => {
    const { api, fila, user } = await montar()
    const ejemplar = api.libros[0]?.ejemplares[0]
    if (ejemplar) ejemplar.rowVersion = 'otro'

    await user.click(
      within(fila).getByRole('button', { name: 'Editar BIB-001' }),
    )
    const dialogo = await screen.findByRole('dialog', {
      name: 'Editar ejemplar',
    })
    await user.type(within(dialogo).getByLabelText('Código de inventario'), 'X')
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'Otro usuario cambió este ejemplar.',
    )
    await waitFor(() =>
      expect(
        api.pedidos('/api/libros/1/ejemplares').length,
      ).toBeGreaterThanOrEqual(2),
    )
  })

  it('desactivar pide confirmación, llama a DELETE e invalida libros y ejemplares', async () => {
    const { api, fila, user, queryClient } = await montar()

    await user.click(
      within(fila).getByRole('button', { name: 'Desactivar BIB-001' }),
    )
    const dialogo = await screen.findByRole('dialog', {
      name: 'Desactivar ejemplar',
    })
    expect(api.pedidos('/api/ejemplares/1')).toHaveLength(0)
    await user.click(
      within(dialogo).getByRole('button', { name: 'Desactivar' }),
    )

    expect(await within(fila).findByText('Inactivo')).toBeInTheDocument()
    expect(api.libros[0]?.ejemplares[0]?.estado).toBe('Inactivo')
    await waitFor(() =>
      expect(
        queryClient.getQueryData<LibroDetalle>(queryKeys.libros.detail(1))
          ?.disponibles,
      ).toBe(1),
    )
  })

  it('si el backend rechaza la desactivación, muestra el mensaje del ProblemDetails', async () => {
    const { fila, user } = await montar()
    server.use(
      http.delete('*/api/ejemplares/:id', () =>
        HttpResponse.json(
          {
            status: 409,
            title: 'ejemplar-reservado',
            code: 'ejemplar-reservado',
          },
          {
            status: 409,
            headers: { 'content-type': 'application/problem+json' },
          },
        ),
      ),
    )

    await user.click(
      within(fila).getByRole('button', { name: 'Desactivar BIB-001' }),
    )
    const dialogo = await screen.findByRole('dialog', {
      name: 'Desactivar ejemplar',
    })
    await user.click(
      within(dialogo).getByRole('button', { name: 'Desactivar' }),
    )

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'El ejemplar tiene una reserva activa y no se puede cambiar.',
    )
  })
})
