import { useEffect, useState } from 'react'

import { useSesion } from '@/components/layout/use-sesion'
import { HomeCategorias } from '@/features/biblioteca/components/home-categorias'
import { HomeHero } from '@/features/biblioteca/components/home-hero'
import {
  HomeReservaActiva,
  HomeReservaActivaCargando,
} from '@/features/biblioteca/components/home-reserva-activa'
import { useResumenHome } from '@/features/biblioteca/hooks/use-libros'
import { useMisReservas } from '@/features/biblioteca/hooks/use-reservas'
import { cn } from '@/lib/utils'

const DEMORA_HUECO_MS = 300

export function HomePage() {
  const resumen = useResumenHome()
  const sesion = useSesion()
  const activas = useMisReservas('Activa', 1, 20)
  const [demorada, setDemorada] = useState(false)

  const cargandoReservas = sesion.isLector && activas.isPending
  useEffect(() => {
    if (!cargandoReservas) return undefined
    const id = window.setTimeout(() => setDemorada(true), DEMORA_HUECO_MS)
    return () => window.clearTimeout(id)
  }, [cargandoReservas])

  const reservas = sesion.isLector
    ? (activas.data?.items ?? [])
        .filter((reserva) => reserva.estado === 'Activa')
        .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud))
    : []
  const [masReciente] = reservas
  const conColumna = Boolean(masReciente) || (cargandoReservas && demorada)

  return (
    <main className="px-4 pb-6 md:px-6 xl:px-8">
      <HomeHero resumen={resumen.data} cargando={resumen.isPending} />
      <div
        className={cn(
          'mt-14 grid items-start gap-10 lg:mt-16',
          conColumna && 'lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8',
        )}
      >
        {conColumna ? (
          <div className="lg:order-2 lg:h-full lg:pt-[76px]">
            {masReciente ? (
              <HomeReservaActiva
                reserva={masReciente}
                otras={reservas.length - 1}
              />
            ) : (
              <HomeReservaActivaCargando />
            )}
          </div>
        ) : null}
        <div className="lg:order-1">
          <HomeCategorias
            categorias={resumen.data?.conteoCategorias}
            cargando={resumen.isPending}
            anchoCompleto={!conColumna}
          />
        </div>
      </div>
    </main>
  )
}
