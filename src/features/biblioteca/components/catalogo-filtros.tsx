import { ChevronDown, Search, X } from 'lucide-react'
import { useRef } from 'react'

import { SugerenciasCategorias } from '@/features/biblioteca/components/sugerencias-categorias'
import { useSugerenciasCategorias } from '@/features/biblioteca/hooks/use-sugerencias-categorias'
import {
  categoriaExacta,
  mismaCategoria,
} from '@/features/biblioteca/hooks/use-categorias'
import {
  ORDENES,
  type Disponibilidad,
  type Orden,
} from '@/features/biblioteca/schemas/catalogo-search.schema'
import type { Categoria } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { reveal } from '@/lib/motion'
import { cn } from '@/lib/utils'

const claseChip =
  'focus-visible:shadow-foco flex h-[42px] flex-none cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors outline-none'

export function ChipsCategorias({
  categorias,
  activa,
  onElegir,
}: {
  categorias: Categoria[] | undefined
  activa: string | undefined
  onElegir: (categoria: string | undefined) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lista = categorias ?? []
  useMotion(
    ref,
    (root) => reveal(root.children, { x: 10, y: 0, stagger: 0.04 }),
    [lista.length],
  )
  const activaFueraDeLista =
    activa && !lista.some((c) => mismaCategoria(c.nombre, activa))
  const opciones: {
    valor: string | undefined
    etiqueta: string
    cantidad?: number
  }[] = [
    {
      valor: undefined,
      etiqueta: 'Todas',
      cantidad: categorias
        ? lista.reduce((total, c) => total + c.cantidadLibros, 0)
        : undefined,
    },
    ...lista.map((c) => ({
      valor: c.nombre,
      etiqueta: c.nombre,
      cantidad: c.cantidadLibros,
    })),
    ...(activaFueraDeLista ? [{ valor: activa, etiqueta: activa }] : []),
  ]

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Categorías"
      className="tira-sin-barra -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {opciones.map((opcion) => {
        const seleccionada =
          opcion.valor === undefined
            ? !activa
            : Boolean(activa && mismaCategoria(opcion.valor, activa))
        return (
          <button
            key={opcion.etiqueta}
            type="button"
            aria-pressed={seleccionada}
            onClick={() => onElegir(opcion.valor)}
            className={cn(
              claseChip,
              seleccionada
                ? 'border-pino-950 bg-pino-950 text-papel'
                : 'border-linea bg-card text-texto-2 hover:border-separador hover:text-tinta',
            )}
          >
            {opcion.etiqueta}
            {opcion.cantidad !== undefined ? (
              <span
                className={cn(
                  'font-mono text-xs',
                  seleccionada ? 'text-lima-400' : 'text-texto-4',
                )}
              >
                {opcion.cantidad}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function BarraCatalogo({
  texto,
  onTexto,
  disponibilidad,
  onDisponibilidad,
  orden,
  onOrden,
  totalLibros,
  onCategoria,
}: {
  texto: string
  onTexto: (texto: string) => void
  onCategoria: (categoria: string, conservarTexto: boolean) => void
  disponibilidad: Disponibilidad | undefined
  onDisponibilidad: (valor: Disponibilidad | undefined) => void
  orden: Orden | undefined
  onOrden: (orden: Orden | undefined) => void
  totalLibros: number | undefined
}) {
  const sugerencias = useSugerenciasCategorias({
    texto,
    onElegir: (categoria) => onCategoria(categoria.nombre, false),
  })
  const rapidos: { valor: Disponibilidad; etiqueta: string }[] = [
    { valor: 'disponibles', etiqueta: 'Disponibles' },
    { valor: 'agotados', etiqueta: 'Agotados' },
  ]

  return (
    <div className="bg-card shadow-card flex flex-col gap-2.5 rounded-[20px] p-2.5 md:flex-row md:items-center">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          const exacta = categoriaExacta(sugerencias.categorias, texto)
          if (exacta) onCategoria(exacta.nombre, true)
        }}
        className="bg-hueso relative flex h-11 min-w-0 flex-1 items-center rounded-xl md:max-w-[420px]"
      >
        <Search
          aria-hidden
          className="text-niebla-fg pointer-events-none absolute left-3.5 size-[18px]"
          strokeWidth={2}
        />
        <input
          id="buscar-libros"
          name="buscar"
          type="search"
          aria-label="Buscar"
          {...sugerencias.propsEntrada}
          value={texto}
          onChange={(event) => onTexto(event.target.value)}
          placeholder="Busca por título, autor o categoría"
          className="text-tinta placeholder:text-texto-4 focus-visible:shadow-foco h-full w-full rounded-xl bg-transparent pr-3 pl-10 text-[15px] outline-none"
        />
        <SugerenciasCategorias {...sugerencias.lista} />
      </form>

      <div className="tira-sin-barra -mx-2.5 flex items-center gap-2 overflow-x-auto px-2.5 md:mx-0 md:overflow-visible md:px-0">
        {rapidos.map((rapido) => {
          const activo = disponibilidad === rapido.valor
          return (
            <button
              key={rapido.valor}
              type="button"
              aria-pressed={activo}
              onClick={() =>
                onDisponibilidad(activo ? undefined : rapido.valor)
              }
              className={cn(
                claseChip,
                'h-10 gap-[7px] px-3.5',
                activo
                  ? 'border-pino-800 bg-pino-800/8 text-pino-800'
                  : 'border-linea bg-card text-texto-2 hover:border-separador',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'size-[7px] rounded-full',
                  rapido.valor === 'disponibles' ? 'bg-lima-400' : 'bg-texto-4',
                )}
              />
              {rapido.etiqueta}
              {activo ? <X aria-hidden className="size-3.5" /> : null}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3 md:ml-auto">
        {totalLibros !== undefined ? (
          <p className="text-texto-2 text-sm font-medium whitespace-nowrap">
            {totalLibros.toLocaleString('es')}{' '}
            {totalLibros === 1 ? 'libro' : 'libros'}
          </p>
        ) : null}
        <div className="relative">
          <select
            name="orden"
            aria-label="Ordenar"
            value={orden ?? ''}
            onChange={(event) =>
              onOrden((event.target.value || undefined) as Orden | undefined)
            }
            className="border-linea bg-card text-tinta hover:border-separador focus-visible:shadow-foco h-11 cursor-pointer appearance-none rounded-xl border pr-10 pl-3.5 text-sm font-medium outline-none"
          >
            <option value="">Ordenar: Relevancia</option>
            {(Object.keys(ORDENES) as Orden[]).map((clave) => (
              <option key={clave} value={clave}>
                Ordenar: {ORDENES[clave]}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="text-niebla-fg pointer-events-none absolute top-1/2 right-3.5 size-3.5 -translate-y-1/2"
            strokeWidth={2.4}
          />
        </div>
      </div>
    </div>
  )
}
