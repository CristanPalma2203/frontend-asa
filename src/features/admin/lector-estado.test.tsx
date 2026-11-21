import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { LectorLista } from '@/features/biblioteca/types/api'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

/** Lectores en memoria: PUT edita, DELETE desactiva y POST …/activar reactiva. */
function apiLectores(inicial: LectorLista) {
  const lector = { ...inicial }
  const pedidos: string[] = []
  server.use(
    http.get('*/api/lectores', () =>
      HttpResponse.json({
        items: [lector],
        page: 1,
        pageSize: 12,
        totalCount: 1,
        totalPages: 1,
      }),
    ),
    http.put('*/api/lectores/:id', async ({ request }) => {
      pedidos.push('PUT')
      Object.assign(lector, await request.json())
      return new HttpResponse(null, { status: 204 })
    }),
    http.post('*/api/lectores/:id/activar', () => {
      pedidos.push('POST activar')
      lector.estado = 'Activo'
      return new HttpResponse(null, { status: 204 })
    }),
    http.delete('*/api/lectores/:id', () => {
      pedidos.push('DELETE')
      lector.estado = 'Inactivo'
      return new HttpResponse(null, { status: 204 })
    }),
  )
  return { lector, pedidos }
}

const ANA: LectorLista = {
  idLector: 2,
  identificador: 'L-002',
  nombre: 'Ana López',
  correo: 'ana.lopez@demo.local',
  estado: 'Inactivo',
  tieneUsuario: true,
}

async function editarEstado(estado: 'Activo' | 'Inactivo') {
  const user = userEvent.setup()
  const fila = (await screen.findByText('Ana López')).closest(
    'tr',
  ) as HTMLElement
  await user.click(within(fila).getByRole('button', { name: /Editar/ }))
  const dialogo = await screen.findByRole('dialog', { name: 'Editar lector' })
  await user.selectOptions(within(dialogo).getByLabelText('Estado'), estado)
  await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))
  await waitFor(() =>
    expect(screen.queryByRole('dialog', { name: 'Editar lector' })).toBeNull(),
  )
  return fila
}

describe('admin: estado del lector al editar', () => {
  it('pasar de Inactivo a Activo guarda y llama a POST /api/lectores/{id}/activar', async () => {
    entrarComo('Admin')
    const api = apiLectores(ANA)
    await renderEn('/admin/lectores?page=1&pageSize=12')

    await editarEstado('Activo')

    expect(api.pedidos).toEqual(['PUT', 'POST activar'])
    // Las queries de lectores se invalidan: la tabla ya muestra el estado nuevo.
    expect(await screen.findByText('Activo')).toBeInTheDocument()
  })

  it('pasar de Activo a Inactivo usa la desactivación existente (DELETE)', async () => {
    entrarComo('Admin')
    const api = apiLectores({ ...ANA, estado: 'Activo' })
    await renderEn('/admin/lectores?page=1&pageSize=12')

    await editarEstado('Inactivo')

    expect(api.pedidos).toEqual(['PUT', 'DELETE'])
  })
})
