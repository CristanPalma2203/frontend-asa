import { useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'

import type { ResumenCategoria } from '@/features/admin/types/resumen'
import { cn } from '@/lib/utils'

/**
 * Barras apiladas «Ejemplares por categoría», portado de
 * «Revenue by channel» de Wynlo. Clic → catálogo filtrado.
 */
export function CategoriasChart({
  categorias,
  cargando = false,
  className,
}: {
  categorias: ResumenCategoria[]
  cargando?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  const max = useMemo(
    () =>
      Math.max(
        1,
        ...categorias.map(
          (c) => c.disponibles + c.reservados + c.inactivos,
        ),
      ),
    [categorias],
  )

  if (cargando) {
    return (
      <section
        className={cn(
          'bg-card border-linea shadow-card flex h-full flex-col rounded-2xl border p-5 sm:p-6',
          className,
        )}
      >
        <Header />
        <div className="mt-6 flex h-40 flex-1 items-end gap-3" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className="bg-niebla max-w-14 flex-1 animate-pulse rounded-t-lg"
              style={{ height: `${40 + ((i * 17) % 60)}%` }}
            />
          ))}
        </div>
      </section>
    )
  }

  if (categorias.length === 0) {
    return (
      <section
        className={cn(
          'bg-card border-linea shadow-card flex h-full flex-col rounded-2xl border p-5 sm:p-6',
          className,
        )}
      >
        <Header />
        <p className="text-texto-3 flex flex-1 items-center justify-center py-12 text-center text-sm">
          Sin categorías con ejemplares
        </p>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'bg-card border-linea shadow-card flex h-full flex-col rounded-2xl border p-5 sm:p-6',
        className,
      )}
    >
      <Header />
      <div
        role="img"
        aria-label="Ejemplares por categoría: disponibles, reservados e inactivos"
        className="mt-6 flex flex-1 items-end gap-3 overflow-x-auto pb-2"
      >
        {categorias.map((cat) => {
          const total = cat.disponibles + cat.reservados + cat.inactivos
          const h = Math.max(8, (total / max) * 180)
          const d = total ? (cat.disponibles / total) * 100 : 0
          const r = total ? (cat.reservados / total) * 100 : 0
          const i = total ? (cat.inactivos / total) * 100 : 0
          return (
            <button
              key={cat.categoria}
              type="button"
              title={`${cat.categoria}: ${total} ejemplares`}
              onClick={() =>
                void navigate({
                  to: '/admin/libros',
                  search: {
                    page: 1,
                    pageSize: 12,
                    categoria: cat.categoria,
                  },
                })
              }
              className="group focus-visible:shadow-foco flex min-w-[56px] flex-1 cursor-pointer flex-col items-center gap-2 outline-none"
            >
              <span className="text-texto-3 text-[11px] tabular-nums">
                {total}
              </span>
              <span
                className="flex w-full max-w-14 flex-col-reverse overflow-hidden rounded-t-lg transition-[box-shadow,filter] group-hover:shadow-[0_0_0_3px_var(--color-lima-glow)] group-hover:brightness-105"
                style={{ height: h }}
              >
                <span
                  className="bg-pino-800 w-full"
                  style={{ height: `${d}%` }}
                />
                <span
                  className="bg-lima-400 w-full"
                  style={{ height: `${r}%` }}
                />
                <span
                  className="bg-linea-fuerte w-full"
                  style={{ height: `${i}%` }}
                />
              </span>
              <span className="text-texto-3 max-w-[4.5rem] truncate text-center text-[11px]">
                {cat.categoria}
              </span>
            </button>
          )
        })}
      </div>

      <div className="text-texto-3 mt-5 flex flex-wrap gap-4 text-xs">
        <Leyenda color="bg-pino-800" label="Disponibles" />
        <Leyenda color="bg-lima-400" label="Reservados" />
        <Leyenda color="bg-linea-fuerte" label="Inactivos" />
      </div>

      <table className="sr-only">
        <caption>Ejemplares por categoría</caption>
        <thead>
          <tr>
            <th>Categoría</th>
            <th>Disponibles</th>
            <th>Reservados</th>
            <th>Inactivos</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <tr key={c.categoria}>
              <td>{c.categoria}</td>
              <td>{c.disponibles}</td>
              <td>{c.reservados}</td>
              <td>{c.inactivos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Header() {
  return (
    <div className="shrink-0">
      <h2 className="text-lg tracking-[-0.02em]">
        Ejemplares por <span className="titulo-serif">categoría</span>
      </h2>
      <p className="text-texto-3 text-sm">
        Clic en una barra para filtrar el catálogo
      </p>
    </div>
  )
}

function Leyenda({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={cn('size-2 rounded-full', color)} aria-hidden />
      {label}
    </span>
  )
}
