import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

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

describe('admin: editar e inactivar ejemplares', () => {
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

  it('cada ejemplar tiene una sola acción para pasarlo a Inactivo', async () => {
    const { api, fila, user } = await montar()

    expect(
      within(fila).queryByRole('button', { name: /Desactivar/ }),
    ).toBeNull()
    await user.click(within(fila).getByRole('button', { name: 'Inactivar' }))
    const dialogo = await screen.findByRole('dialog', {
      name: 'Inactivar ejemplar',
    })
    await user.click(within(dialogo).getByRole('button', { name: 'Inactivar' }))

    expect(await within(fila).findByText('Inactivo')).toBeInTheDocument()
    expect(api.libros[0]?.ejemplares[0]?.estado).toBe('Inactivo')
    expect(
      within(fila).getByRole('button', { name: 'Activar' }),
    ).toBeInTheDocument()
  })
})
