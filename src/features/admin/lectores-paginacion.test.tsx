import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { LectorLista } from '@/features/biblioteca/types/api'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const lector = (i: number): LectorLista => ({
  idLector: i,
  identificador: `L-${String(i).padStart(3, '0')}`,
  nombre: `Lector ${i}`,
  correo: `lector${i}@demo.local`,
  estado: 'Activo',
  tieneUsuario: false,
})

describe('admin: paginador de lectores', () => {
  it('muestra «Página X de N» con totalPages de la respuesta y Siguiente pide la página 2', async () => {
    const user = userEvent.setup()
    entrarComo('Admin')
    const paginas: string[] = []
    server.use(
      http.get('*/api/lectores', ({ request }) => {
        const url = new URL(request.url)
        const page = Number(url.searchParams.get('page') ?? 1)
        paginas.push(String(page))
        return HttpResponse.json({
          items: [lector(page * 10 + 1)],
          page,
          pageSize: 12,
          totalCount: 25,
          totalPages: 3,
        })
      }),
    )
    await renderEn('/admin/lectores?page=1&pageSize=12')

    const nav = await screen.findByRole('navigation', { name: 'Paginación' })
    expect(within(nav).getByText('Página 1 de 3')).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(within(nav).getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Lector 21')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(
          screen.getByRole('navigation', { name: 'Paginación' }),
        ).getByText('Página 2 de 3'),
      ).toBeInTheDocument(),
    )
    expect(paginas).toContain('2')
  })
})
