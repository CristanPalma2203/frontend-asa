import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import gsap from 'gsap'
import { describe, expect, it } from 'vitest'

import {
  indiceDiaDesdeX,
  RESERVAS_PAD,
} from '@/features/admin/components/chart-paths'
import type { Resumen } from '@/features/admin/types/resumen'
import { renderEn } from '@/test/render'
import { server } from '@/test/server'
import { entrarComo } from '@/test/sesion'

function serie(n: number, factor = 1) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(2026, 10, 1 + i))
    return {
      fecha: d.toISOString().slice(0, 10),
      reservas: (i % 5) * factor,
      cancelaciones: i % 3,
    }
  })
}

function resumenFixture(parcial: Partial<Resumen> = {}): Resumen {
  return {
    kpis: {
      librosActivos: 42,
      ejemplaresActivos: 120,
      ejemplaresDisponibles: 80,
      ejemplaresReservados: 40,
      lectoresActivos: 18,
      reservasActivas: 12,
      ocupacion: 0.33,
    },
    serieDiaria: serie(14),
    porCategoria: [
      {
        categoria: 'Novela',
        disponibles: 20,
        reservados: 8,
        inactivos: 2,
      },
      {
        categoria: 'Ciencia',
        disponibles: 10,
        reservados: 3,
        inactivos: 1,
      },
    ],
    masReservados: [
      {
        libroId: 1,
        isbn: '9780140328721',
        titulo: 'El Principito',
        autor: 'Saint-Exupéry',
        portadaUrl: null,
        reservas: 9,
      },
    ],
    porAgotarse: [
      {
        libroId: 2,
        isbn: '9780307474728',
        titulo: 'Cien años de soledad',
        disponibles: 0,
        total: 3,
      },
    ],
    actividad: [
      {
        tipo: 'reserva',
        lector: 'Ana Pérez',
        libro: 'El Principito',
        codigoEjemplar: 'BIB-001',
        fecha: '2026-11-20T14:00:00Z',
      },
    ],
    ...parcial,
  }
}

describe('admin: Resumen de la biblioteca', () => {
  it('renderiza KPIs, chart, feed y rankings con datos de /api/resumen', async () => {
    entrarComo('Admin')
    server.use(
      http.get('*/api/resumen', () => HttpResponse.json(resumenFixture())),
    )
    await renderEn('/admin')

    expect(
      await screen.findByRole('heading', {
        name: /Resumen de la biblioteca/i,
      }),
    ).toBeInTheDocument()

    const kpis = await screen.findByRole('list', { name: 'Indicadores' })
    expect(within(kpis).getByText('Libros')).toBeInTheDocument()
    expect(within(kpis).getByText('Ocupación')).toBeInTheDocument()
    expect(within(kpis).getByText('33%')).toBeInTheDocument()

    expect(
      screen.getByRole('heading', { name: /Reservas por día/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: /Reservas y cancelaciones de los últimos 14 días/i,
      }),
    ).toBeInTheDocument()

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('El Principito')).toBeInTheDocument()
    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Novela/i })).toBeInTheDocument()
  })

  it('el toggle 14D/30D cambia la query ?dias=', async () => {
    const user = userEvent.setup()
    entrarComo('Admin')
    const pedidos: string[] = []
    server.use(
      http.get('*/api/resumen', ({ request }) => {
        const dias = new URL(request.url).searchParams.get('dias') ?? ''
        pedidos.push(dias)
        return HttpResponse.json(
          resumenFixture({
            serieDiaria: serie(Number(dias) === 30 ? 30 : 14),
          }),
        )
      }),
    )
    await renderEn('/admin')
    await screen.findByRole('heading', { name: /Reservas por día/i })
    await waitFor(() => expect(pedidos).toContain('14'))

    const periodo = screen.getByRole('group', { name: 'Periodo' })
    await user.click(within(periodo).getByRole('button', { name: '30D' }))

    await waitFor(() => expect(pedidos).toContain('30'))
    expect(
      screen.getByRole('img', {
        name: /últimos 30 días/i,
      }),
    ).toBeInTheDocument()
  })

  it('muestra vacíos cuando no hay actividad ni reservas', async () => {
    entrarComo('Admin')
    server.use(
      http.get('*/api/resumen', () =>
        HttpResponse.json(
          resumenFixture({
            serieDiaria: serie(14, 0).map((d) => ({
              ...d,
              reservas: 0,
              cancelaciones: 0,
            })),
            masReservados: [],
            porAgotarse: [],
            actividad: [],
            porCategoria: [],
          }),
        ),
      ),
    )
    await renderEn('/admin')

    expect(
      await screen.findAllByText('Sin reservas en este periodo'),
    ).toHaveLength(2)
    expect(screen.getByText('Sin actividad reciente')).toBeInTheDocument()
    expect(
      screen.getByText('Ningún título cerca de agotarse'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Sin categorías con ejemplares'),
    ).toBeInTheDocument()
  })

  it('clic en una categoría navega al catálogo admin filtrado', async () => {
    const user = userEvent.setup()
    entrarComo('Admin')
    server.use(
      http.get('*/api/resumen', () => HttpResponse.json(resumenFixture())),
    )
    const { router } = await renderEn('/admin')
    const barra = await screen.findByRole('button', { name: /Novela/i })
    await user.click(barra)

    await waitFor(() => {
      expect(router.state.location.pathname).toMatch(/^\/admin\/libros\/?$/)
      expect(router.state.location.search).toMatchObject({
        categoria: 'Novela',
      })
    })
  })

  it('pointermove en una X conocida activa el día esperado', async () => {
    entrarComo('Admin')
    server.use(
      http.get('*/api/resumen', () => HttpResponse.json(resumenFixture())),
    )
    await renderEn('/admin')
    const plot = await screen.findByTestId('reservas-chart-plot')
    const width = 640
    const left = 40
    plot.getBoundingClientRect = () =>
      ({
        width,
        height: 260,
        top: 0,
        left,
        right: left + width,
        bottom: 260,
        x: left,
        y: 0,
        toJSON() {},
      }) as DOMRect

    const n = 14
    const diaEsperado = 7
    const plotW = width - RESERVAS_PAD.l - RESERVAS_PAD.r
    const clientX = left + RESERVAS_PAD.l + (diaEsperado / (n - 1)) * plotW
    expect(
      indiceDiaDesdeX(clientX, left, width, RESERVAS_PAD.l, RESERVAS_PAD.r, n),
    ).toBe(diaEsperado)

    fireEvent.pointerMove(plot, { clientX, clientY: 80 })

    await waitFor(() => {
      expect(screen.getByTestId('reservas-chart-tooltip')).toHaveAttribute(
        'data-dia',
        String(diaEsperado),
      )
    })
  })

  it('con datos reales dibuja el pico del 21/11 y deja la línea visible', async () => {
    entrarComo('Admin')
    const serieReal = Array.from({ length: 14 }, (_, i) => ({
      fecha: `2026-11-${String(8 + i).padStart(2, '0')}`,
      reservas: i === 13 ? 9 : 0,
      cancelaciones: 0,
    }))
    server.use(
      http.get('*/api/resumen', () =>
        HttpResponse.json(resumenFixture({ serieDiaria: serieReal })),
      ),
    )
    await renderEn('/admin')

    const grafica = await screen.findByRole('img', {
      name: /Reservas y cancelaciones de los últimos 14 días/i,
    })
    expect(screen.getByText('21/11')).toBeInTheDocument()
    const linea = grafica.querySelector('path[stroke="var(--color-pino-800)"]')
    const puntos = (linea?.getAttribute('d') ?? '')
      .split(/[MC ]+/)
      .filter(Boolean)
      .map((par) => par.split(',').map(Number))
    const ultimo = puntos.at(-1)
    const base = puntos[0]
    expect(ultimo?.[1]).toBe(RESERVAS_PAD.t)
    expect(base?.[1]).toBeGreaterThan(RESERVAS_PAD.t)

    const recorte = grafica.querySelector('clipPath rect')
    gsap.killTweensOf(recorte)
    expect(Number(recorte?.getAttribute('width'))).toBeGreaterThan(0)
  })
})
