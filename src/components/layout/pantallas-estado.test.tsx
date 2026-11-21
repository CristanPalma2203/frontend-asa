import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { LimiteError } from '@/components/layout/pantallas-estado'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'

describe('404', () => {
  it('una ruta inexistente muestra la 404 a pantalla completa con sus dos botones', async () => {
    const { container } = await renderEn('/no-existe')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Esta página se perdió entre estantes',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('ERROR 404')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Volver al inicio' }),
    ).toHaveAttribute('href', '/')
    expect(
      screen.getByRole('link', { name: 'Ir al catálogo' }).getAttribute('href'),
    ).toContain('/catalogo')
    expect(screen.getByText('Desarrollado por Alex Palma')).toBeInTheDocument()
    // Fuera del layout: sin sidebar ni LuxIA.
    expect(screen.queryByRole('navigation', { name: 'Principal' })).toBeNull()
    expect(screen.queryByTestId('luxia-fab')).toBeNull()
    expect(container.querySelector('[data-pantalla-error]')).not.toBeNull()
  })

  it('la ficha de un libro que no existe usa la misma 404', async () => {
    server.use(
      http.get('*/api/libros/:id', () =>
        HttpResponse.json(
          {
            status: 404,
            title: 'libro-no-encontrado',
            code: 'libro-no-encontrado',
          },
          {
            status: 404,
            headers: { 'content-type': 'application/problem+json' },
          },
        ),
      ),
    )
    await renderEn('/libros/99999')

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Esta página se perdió entre estantes',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ir al catálogo' }),
    ).toBeInTheDocument()
  })
})

function Explota(): never {
  throw new Error('fallo de prueba con detalle técnico')
}

describe('500', () => {
  it('un componente que lanza un error muestra la 500 y «Reintentar» llama al reset', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    // React registra el error capturado en consola: se silencia en este test.
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {})
    let romper = true
    function Contenido() {
      if (romper) return <Explota />
      return <p>Todo bien</p>
    }

    try {
      render(
        <LimiteError onReset={onReset}>
          <Contenido />
        </LimiteError>,
      )

      expect(
        screen.getByRole('heading', { level: 1, name: 'Algo salió mal' }),
      ).toBeInTheDocument()
      expect(screen.getByText('ERROR 500')).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'Volver al inicio' }),
      ).toHaveAttribute('href', '/')
      // El mensaje técnico no está a la vista (en desarrollo va plegado en <details>).
      const tecnico = screen.queryByText(/fallo de prueba/)
      if (tecnico)
        expect(tecnico.closest('details')).not.toHaveAttribute('open')

      romper = false
      await user.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(onReset).toHaveBeenCalledTimes(1)
      await waitFor(() =>
        expect(screen.getByText('Todo bien')).toBeInTheDocument(),
      )
    } finally {
      consola.mockRestore()
    }
  })

  it('un error en una ruta muestra la 500 del router', async () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const { router } = await renderEn('/catalogo?page=1&pageSize=12')
      // Una ruta que lanza al cargar: el errorComponent de la raíz la pinta.
      const ruta = router.routesById['/catalogo']
      const original = ruta.options.loader
      ruta.options.loader = () => {
        throw new Error('caída')
      }
      await act(() => router.invalidate())
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Algo salió mal',
        }),
      ).toBeInTheDocument()
      ruta.options.loader = original
    } finally {
      consola.mockRestore()
    }
  })
})

describe('/__error (solo desarrollo)', () => {
  it('en desarrollo lanza a propósito y muestra la 500', async () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await renderEn('/__error')
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Algo salió mal',
        }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Reintentar' }),
      ).toBeInTheDocument()
    } finally {
      consola.mockRestore()
    }
  })

  it('fuera de desarrollo no existe: responde con la 404', async () => {
    vi.stubEnv('DEV', false)
    try {
      await renderEn('/__error')
      expect(
        await screen.findByRole('heading', {
          level: 1,
          name: 'Esta página se perdió entre estantes',
        }),
      ).toBeInTheDocument()
      expect(screen.queryByText('ERROR 500')).toBeNull()
    } finally {
      vi.unstubAllEnvs()
    }
  })
})
