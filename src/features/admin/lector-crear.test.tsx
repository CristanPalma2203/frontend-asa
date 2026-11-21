import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { LectorLista } from '@/features/biblioteca/types/api'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const ANA: LectorLista = {
  idLector: 1,
  identificador: 'L-001',
  nombre: 'Ana López',
  correo: 'ana.lopez@demo.local',
  estado: 'Activo',
  tieneUsuario: true,
}

function apiLectores() {
  const lectores: LectorLista[] = [ANA]
  let listados = 0
  server.use(
    http.get('*/api/lectores', () => {
      listados++
      return HttpResponse.json({
        items: lectores,
        page: 1,
        pageSize: 12,
        totalCount: lectores.length,
        totalPages: 1,
      })
    }),
    http.post('*/api/lectores', async ({ request }) => {
      const body = (await request.json()) as Pick<
        LectorLista,
        'identificador' | 'nombre' | 'correo'
      >
      const idLector = lectores.length + 1
      lectores.push({
        ...body,
        idLector,
        estado: 'Activo',
        tieneUsuario: false,
      })
      return HttpResponse.json({ idLector }, { status: 201 })
    }),
  )
  return { listados: () => listados }
}

describe('admin: crear lector', () => {
  it('al crear, el modal cierra y la fila nueva aparece sin recargar', async () => {
    entrarComo('Admin')
    const api = apiLectores()
    const user = userEvent.setup()
    await renderEn('/admin/lectores?page=1&pageSize=12')
    await screen.findByText('Ana López')
    const antes = api.listados()

    await user.click(screen.getByRole('button', { name: 'Crear lector' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Crear lector' })
    await user.type(within(dialogo).getByLabelText('Identificador'), 'L-002')
    await user.type(within(dialogo).getByLabelText('Nombre'), 'Bruno Díaz')
    await user.type(
      within(dialogo).getByLabelText('Correo'),
      'bruno.diaz@demo.local',
    )
    await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Crear lector' })).toBeNull(),
    )
    const aviso = await screen.findByText('Lector «Bruno Díaz» creado')
    expect(aviso.closest('[data-sonner-toast]')).toHaveAttribute(
      'data-type',
      'success',
    )
    expect(
      await screen.findByRole('cell', { name: 'Bruno Díaz' }),
    ).toBeInTheDocument()
    expect(screen.getByText('2 lectores')).toBeInTheDocument()
    expect(api.listados()).toBeGreaterThan(antes)
  })
})
