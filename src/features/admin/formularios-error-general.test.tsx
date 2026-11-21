import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

const paginaVacia = {
  items: [],
  page: 1,
  pageSize: 12,
  totalCount: 0,
  totalPages: 0,
}

function problema(status: number, code: string | undefined, detail: string) {
  return HttpResponse.json(
    { status, code, title: 'Error', detail },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

async function crearLibro() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /Crear libro/ }))
  const dialogo = await screen.findByRole('dialog', { name: 'Crear libro' })
  await user.type(within(dialogo).getByLabelText('ISBN'), '9780306406157')
  await user.type(within(dialogo).getByLabelText('Título'), 'Rayuela')
  await user.type(within(dialogo).getByLabelText('Autor'), 'Julio Cortázar')
  await user.type(within(dialogo).getByLabelText('Categoría'), 'Novela')
  await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))
  return dialogo
}

async function crearLector() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /Crear lector/ }))
  const dialogo = await screen.findByRole('dialog', { name: 'Crear lector' })
  await user.type(within(dialogo).getByLabelText('Identificador'), 'L-900')
  await user.type(within(dialogo).getByLabelText('Nombre'), 'Marta Ruiz')
  await user.type(within(dialogo).getByLabelText('Correo'), 'marta@demo.local')
  await user.click(within(dialogo).getByRole('button', { name: 'Guardar' }))
  return dialogo
}

describe('formularios de admin: errores generales', () => {
  it('libro: un 500 se muestra como alerta arriba del formulario', async () => {
    entrarComo('Admin')
    server.use(
      http.get('*/api/libros', () => HttpResponse.json(paginaVacia)),
      http.post('*/api/libros', () =>
        problema(500, 'error-interno', 'Ocurrió un error interno.'),
      ),
    )
    await renderEn('/admin/libros?page=1&pageSize=12')

    const dialogo = await crearLibro()

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'Ocurrió un error interno.',
    )
  })

  it('libro: el ISBN duplicado va al campo y no a la alerta', async () => {
    entrarComo('Admin')
    server.use(
      http.get('*/api/libros', () => HttpResponse.json(paginaVacia)),
      http.post('*/api/libros', () =>
        problema(409, 'isbn-duplicado', 'Ya existe un libro con ese ISBN.'),
      ),
    )
    await renderEn('/admin/libros?page=1&pageSize=12')

    const dialogo = await crearLibro()

    expect(
      await within(dialogo).findByText('Ya existe un libro con ese ISBN.'),
    ).toBeInTheDocument()
    expect(within(dialogo).queryByRole('alert')).toBeNull()
  })

  it('lector: un 403 se muestra como alerta arriba del formulario', async () => {
    entrarComo('Admin')
    server.use(
      http.get('*/api/lectores', () => HttpResponse.json(paginaVacia)),
      http.post('*/api/lectores', () =>
        problema(403, 'acceso-denegado', 'Sin permiso.'),
      ),
    )
    await renderEn('/admin/lectores?page=1&pageSize=12')

    const dialogo = await crearLector()

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'No tienes permiso para hacer esta acción.',
    )
  })

  it('lector: un código no mapeado muestra el detalle del servidor', async () => {
    entrarComo('Admin')
    server.use(
      http.get('*/api/lectores', () => HttpResponse.json(paginaVacia)),
      http.post('*/api/lectores', () =>
        problema(422, 'regla-nueva', 'El servidor rechazó la operación.'),
      ),
    )
    await renderEn('/admin/lectores?page=1&pageSize=12')

    const dialogo = await crearLector()

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent(
      'El servidor rechazó la operación.',
    )
  })
})
