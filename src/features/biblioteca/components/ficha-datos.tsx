import { Hueso } from '@/components/ui/hueso'
import type { LibroDetalle } from '@/features/biblioteca/types/api'
import { cn } from '@/lib/utils'

type Item = { etiqueta: string; valor: string; mono?: boolean }

export function FichaDatos({
  detalle,
  totalActivos,
}: {
  detalle?: LibroDetalle
  totalActivos: number
}) {
  const items: Item[] = detalle
    ? [
        { etiqueta: 'ISBN', valor: detalle.isbn, mono: true },
        ...(detalle.paginas
          ? [{ etiqueta: 'Páginas', valor: String(detalle.paginas) }]
          : []),
        ...(detalle.anioPublicacion
          ? [{ etiqueta: 'Año', valor: String(detalle.anioPublicacion) }]
          : []),
        ...(detalle.editorial
          ? [{ etiqueta: 'Editorial', valor: detalle.editorial }]
          : []),
        {
          etiqueta: 'Ejemplares',
          valor: `${totalActivos} ${totalActivos === 1 ? 'activo' : 'activos'}`,
        },
      ]
    : []
  const isbnAncho = items.length > 2

  return (
    <dl
      data-m="meta"
      className="md:border-linea grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-0 md:border-y"
    >
      {detalle
        ? items.map((item, i) => (
            <div
              key={item.etiqueta}
              className={cn(
                'bg-card flex min-w-0 flex-col gap-1.5 rounded-[14px] px-3.5 py-3',
                'md:mr-5 md:min-w-[120px] md:flex-1 md:rounded-none md:bg-transparent md:py-4 md:pr-5 md:pl-0',
                i < items.length - 1 && 'md:border-linea md:border-r',
                item.etiqueta === 'ISBN' && isbnAncho && 'col-span-2',
              )}
            >
              <dt className="text-texto-3 text-[10.5px] font-semibold tracking-[0.12em] uppercase">
                {item.etiqueta}
              </dt>
              <dd
                className={cn(
                  'text-tinta truncate font-medium',
                  item.mono ? 'font-mono text-[14px]' : 'text-[15px]',
                )}
              >
                {item.valor}
              </dd>
            </div>
          ))
        : ['ISBN', 'Ejemplares'].map((etiqueta) => (
            <div
              key={etiqueta}
              className="bg-card flex flex-col gap-1.5 rounded-[14px] px-3.5 py-3 md:mr-5 md:flex-1 md:rounded-none md:bg-transparent md:py-4 md:pr-5 md:pl-0"
            >
              <dt className="text-texto-3 text-[10.5px] font-semibold tracking-[0.12em] uppercase">
                {etiqueta}
              </dt>
              <dd>
                <Hueso cargando ancho="70%" alto={16} className="mt-0.5" />
              </dd>
            </div>
          ))}
    </dl>
  )
}
