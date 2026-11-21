import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EjemplaresAdminTable } from '@/features/biblioteca/components/ejemplares-admin-table'
import { LectoresTable } from '@/features/biblioteca/components/lectores-table'
import type {
  EjemplarLista,
  Lector,
  LectorLista,
} from '@/features/biblioteca/types/api'

const ejemplares: EjemplarLista[] = [
  {
    idEjemplar: 1,
    codigoInventario: 'BIB-001',
    estado: 'Disponible',
    rowVersion: 'rv-1',
  },
  {
    idEjemplar: 2,
    codigoInventario: 'BIB-002',
    estado: 'Inactivo',
    rowVersion: 'rv-2',
  },
]

const lectores: LectorLista[] = [
  {
    idLector: 7,
    identificador: 'L-007',
    nombre: 'Ana López',
    correo: 'ana@demo.local',
    estado: 'Activo',
    tieneUsuario: true,
  },
]

const detalleAna: Lector = {
  idLector: 7,
  identificador: 'L-007',
  nombre: 'Ana López',
  correo: 'ana@demo.local',
  estado: 'Activo',
  tieneUsuario: true,
  reservasActivas: 2,
}

const cabeceras = () =>
  screen.getAllByRole('columnheader').map((th) => th.textContent)

describe('tabla de ejemplares', () => {
  it('pinta columnas, badges y acciones por fila con sus clases', async () => {
    const user = userEvent.setup()
    const onCambiarEstado = vi.fn()
    render(
      <EjemplaresAdminTable
        ejemplares={ejemplares}
        deshabilitado={false}
        onCambiarEstado={onCambiarEstado}
        onEditar={vi.fn()}
      />,
    )

    expect(cabeceras()).toEqual(['Código', 'Estado', 'Acciones'])
    const [, disponible, inactivo] = screen.getAllByRole('row')
    if (!disponible || !inactivo) throw new Error('faltan filas')
    const codigo = within(disponible).getByRole('cell', { name: 'BIB-001' })
    expect(codigo).toHaveClass('font-mono', 'whitespace-nowrap')
    expect(within(disponible).getByText('Disponible')).toBeInTheDocument()
    expect(
      within(disponible)
        .getAllByRole('button')
        .map((boton) => boton.textContent),
    ).toEqual(['Inactivar', 'Editar'])
    expect(
      within(disponible).queryByRole('button', { name: /Desactivar/ }),
    ).toBeNull()

    await user.click(within(inactivo).getByRole('button', { name: 'Activar' }))
    expect(onCambiarEstado).toHaveBeenCalledWith(ejemplares[1])
  })

  it('en carga muestra filas fantasma y deshabilita las acciones', () => {
    render(
      <EjemplaresAdminTable
        ejemplares={ejemplares}
        cargando
        deshabilitado
        onCambiarEstado={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Inactivar' })).toBeDisabled()
    expect(screen.getAllByTestId('fila-fantasma')).toHaveLength(4)
  })
})

describe('tabla de lectores', () => {
  it('pinta las columnas y despliega la fila de reservas a todo el ancho', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    const { rerender } = render(
      <LectoresTable
        lectores={lectores}
        paginacion={{ page: 2, pageSize: 12, total: 13 }}
        abiertoId={null}
        detalle={undefined}
        cargandoDetalle={false}
        onEdit={vi.fn()}
        onToggle={onToggle}
      />,
    )

    expect(cabeceras()).toEqual([
      'Identificador',
      'Nombre',
      'Correo',
      'Estado',
      'Acciones',
    ])
    expect(screen.getByRole('cell', { name: 'Ana López' })).toHaveClass(
      'font-semibold',
    )
    await user.click(screen.getByRole('button', { name: /Reservas/ }))
    expect(onToggle).toHaveBeenCalledWith(lectores[0])

    rerender(
      <LectoresTable
        lectores={lectores}
        abiertoId={7}
        detalle={detalleAna}
        cargandoDetalle={false}
        onEdit={vi.fn()}
        onToggle={onToggle}
      />,
    )
    expect(screen.getByRole('button', { name: /Reservas/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    const detalle = screen.getByText('Reservas activas:').closest('td')
    expect(detalle).toHaveAttribute('colspan', '5')
    expect(detalle).toHaveTextContent('Reservas activas:2')
  })
})

describe('columna de acciones fija', () => {
  it('solo queda fija desde sm, así en móvil el menú se ve completo', () => {
    render(
      <EjemplaresAdminTable
        ejemplares={ejemplares}
        deshabilitado={false}
        onCambiarEstado={vi.fn()}
      />,
    )
    const contenedor = screen
      .getByRole('table')
      .closest('[data-slot="table-container"]')
    const clases = contenedor?.className.split(/\s+/) ?? []
    expect(clases).toContain('sm:[&_td:last-child]:sticky')
    expect(clases).toContain('sm:[&_th:last-child]:sticky')
    expect(
      clases.filter((c) => c.includes('sticky') && !c.startsWith('sm:')),
    ).toEqual([])
  })
})
