import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { ActividadFeed } from '@/features/admin/components/actividad-feed'
import { CategoriasChart } from '@/features/admin/components/categorias-chart'
import { MasReservados } from '@/features/admin/components/mas-reservados'
import { PorAgotarse } from '@/features/admin/components/por-agotarse'
import { ReservasChart } from '@/features/admin/components/reservas-chart'
import { ResumenKpis } from '@/features/admin/components/resumen-kpis'
import { useResumen } from '@/features/admin/hooks/use-resumen'
import type { DiasResumen } from '@/features/admin/types/resumen'
import { ErrorReintentar } from '@/features/biblioteca/components/error-reintentar'

const lista = { page: 1, pageSize: 12 } as const

export function ResumenAdminPage() {
  const [dias, setDias] = useState<DiasResumen>(14)
  const resumen = useResumen(dias)
  const totales = resumen.data
  const cargando = resumen.isPending

  return (
    <main className="flex w-full flex-col gap-4 pt-2">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Panel de administración</p>
        <h1 className="text-[36px] leading-[1.02] sm:text-[44px]">
          Resumen de la <span className="titulo-serif">biblioteca</span>
        </h1>
      </header>

      {resumen.isError ? (
        <section className="bg-card border-linea shadow-card rounded-xl border p-8">
          <h2 className="text-xl">No se pudieron cargar las métricas</h2>
          <ErrorReintentar
            error={resumen.error}
            onRetry={() => void resumen.refetch()}
          />
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-stretch">
          <div className="min-w-0 lg:col-span-12">
            <ResumenKpis resumen={totales} cargando={cargando} />
          </div>

          <div className="flex min-h-[320px] min-w-0 lg:col-span-8">
            <ReservasChart
              serie={totales?.serieDiaria ?? []}
              dias={dias}
              onDias={setDias}
              cargando={cargando}
              className="w-full"
            />
          </div>
          <div className="flex min-h-[320px] min-w-0 lg:col-span-4">
            <ActividadFeed
              items={totales?.actividad ?? []}
              cargando={cargando}
              className="w-full"
            />
          </div>

          <div className="flex min-h-[280px] min-w-0 lg:col-span-7">
            <CategoriasChart
              categorias={totales?.porCategoria ?? []}
              cargando={cargando}
              className="w-full"
            />
          </div>
          <div className="flex min-h-[280px] min-w-0 lg:col-span-5">
            <MasReservados
              items={totales?.masReservados ?? []}
              cargando={cargando}
              className="w-full"
            />
          </div>

          <div className="min-w-0 lg:col-span-12">
            <PorAgotarse
              items={totales?.porAgotarse ?? []}
              cargando={cargando}
            />
          </div>

          <div className="min-w-0 lg:col-span-6">
            <AccesoCompacto
              titulo="Libros y ejemplares"
              texto="Catálogo y gestión de ejemplares."
              to="/admin/libros"
              search={lista}
              cta="Gestionar libros"
            />
          </div>
          <div className="min-w-0 lg:col-span-6">
            <AccesoCompacto
              titulo="Lectores"
              texto="Altas, ediciones y reservas."
              to="/admin/lectores"
              search={lista}
              cta="Gestionar lectores"
            />
          </div>
        </div>
      )}
    </main>
  )
}

function AccesoCompacto({
  titulo,
  texto,
  to,
  search,
  cta,
}: {
  titulo: string
  texto: string
  to: '/admin/libros' | '/admin/lectores'
  search: typeof lista
  cta: string
}) {
  return (
    <div className="bg-card border-linea flex h-full items-center justify-between gap-4 rounded-xl border px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-[-0.02em]">{titulo}</h2>
        <p className="text-texto-3 text-sm">{texto}</p>
      </div>
      <Link
        to={to}
        search={search}
        className="text-pino-800 focus-visible:shadow-foco inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold underline-offset-4 outline-none hover:underline"
      >
        {cta}
        <ArrowRight aria-hidden className="size-4" strokeWidth={2.2} />
      </Link>
    </div>
  )
}
