import { Tag } from 'lucide-react'

import type { useSugerenciasCategorias } from '@/features/biblioteca/hooks/use-sugerencias-categorias'
import { cn } from '@/lib/utils'

export function SugerenciasCategorias({
  id,
  abierta,
  sugerencias,
  activa,
  idOpcion,
  onElegir,
  onActivar,
  className,
}: ReturnType<typeof useSugerenciasCategorias>['lista'] & {
  className?: string
}) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Categorías sugeridas"
      hidden={!abierta}
      className={cn(
        'bg-card border-linea shadow-flotante absolute inset-x-0 top-full z-40 mt-2 max-h-[min(18rem,40dvh)] overflow-y-auto overscroll-contain rounded-2xl border p-1.5',
        className,
      )}
    >
      {sugerencias.map((categoria, indice) => (
        <li
          key={categoria.nombre}
          id={idOpcion(indice)}
          role="option"
          aria-selected={indice === activa}
          aria-label={`${categoria.nombre} · ${textoLibros(categoria.cantidadLibros)}`}
          onMouseDown={(event) => event.preventDefault()}
          onMouseEnter={() => onActivar(indice)}
          onClick={() => onElegir(categoria)}
          className={cn(
            'text-tinta flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
            indice === activa ? 'bg-lima-wash' : 'hover:bg-niebla',
          )}
        >
          <span
            aria-hidden
            className="bg-pino-800/8 text-pino-800 grid size-8 flex-none place-items-center rounded-full"
          >
            <Tag className="size-4" strokeWidth={2.2} />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {categoria.nombre}
          </span>
          <span className="text-texto-3 flex-none text-[13px]">
            {textoLibros(categoria.cantidadLibros)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function textoLibros(cantidad: number) {
  return `${cantidad} ${cantidad === 1 ? 'libro' : 'libros'}`
}
