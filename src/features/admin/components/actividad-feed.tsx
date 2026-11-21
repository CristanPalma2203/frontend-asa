import type { ResumenActividad } from '@/features/admin/types/resumen'
import { haceCuanto } from '@/lib/fechas'
import { cn } from '@/lib/utils'

const FILAS_VISIBLES = 6
const ALTO_FILA = 52

/**
 * Feed «Actividad reciente», portado de «Just in» de Wynlo.
 * Misma altura que el chart: scroll interno + fade + «Ver todo».
 */
export function ActividadFeed({
  items,
  cargando = false,
  className,
}: {
  items: ResumenActividad[]
  cargando?: boolean
  className?: string
}) {
  const conScroll = items.length > FILAS_VISIBLES

  return (
    <section
      className={cn(
        'bg-card border-linea shadow-card flex h-full min-h-0 min-w-0 flex-col rounded-2xl border p-5 sm:p-6',
        className,
      )}
    >
      <div className="mb-4 shrink-0">
        <h2 className="text-lg tracking-[-0.02em]">
          Actividad <span className="titulo-serif">reciente</span>
        </h2>
        <p className="text-texto-3 text-sm">Últimas reservas y cancelaciones</p>
      </div>

      {cargando ? (
        <ul className="flex flex-1 flex-col gap-3" aria-hidden>
          {Array.from({ length: 5 }, (_, i) => (
            <li
              key={i}
              className="bg-niebla h-12 animate-pulse rounded-xl"
            />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-texto-3 flex flex-1 items-center justify-center py-12 text-center text-sm">
          Sin actividad reciente
        </p>
      ) : (
        <div className="relative min-h-0 flex-1">
          <ul
            id="actividad-lista"
            className="h-full overflow-y-auto pr-1"
            style={{ maxHeight: FILAS_VISIBLES * ALTO_FILA }}
          >
            {items.map((item) => (
              <li
                key={`${item.tipo}-${item.fecha}-${item.codigoEjemplar}-${item.lector}`}
                className="flex min-h-[52px] items-start gap-3 rounded-xl p-2.5"
              >
                <span
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    item.tipo === 'reserva' ? 'bg-pino-800' : 'bg-rojo-600',
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="text-tinta block truncate text-sm font-medium">
                    {item.lector}
                  </span>
                  <span className="text-texto-3 block truncate text-xs">
                    {item.libro}
                    {item.codigoEjemplar ? ` · ${item.codigoEjemplar}` : ''}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                      item.tipo === 'reserva'
                        ? 'bg-lima-wash text-pino-800'
                        : 'bg-rojo-100 text-rojo-800',
                    )}
                  >
                    {item.tipo === 'reserva' ? 'Reserva' : 'Cancelada'}
                  </span>
                  <time
                    dateTime={item.fecha}
                    className="text-texto-4 text-[11px]"
                  >
                    {haceCuanto(item.fecha)}
                  </time>
                </span>
              </li>
            ))}
          </ul>
          {conScroll ? (
            <div
              className="from-papel via-papel/85 pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t to-transparent"
              aria-hidden
            />
          ) : null}
        </div>
      )}

      <div className="border-linea mt-3 shrink-0 border-t pt-3">
        <a
          href="#actividad-lista"
          className="text-pino-800 focus-visible:shadow-foco text-sm font-semibold underline-offset-4 outline-none hover:underline"
        >
          Ver todo
        </a>
      </div>
    </section>
  )
}
