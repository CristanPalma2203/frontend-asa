import { Skeleton } from 'boneyard-js/react'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

import { huesoUnico } from '@/components/ui/hueso.bones'
import { cn } from '@/lib/utils'

/**
 * Hueco de un dato que aún no llega: boneyard pinta el shimmer solo en ese hueco y el resto del
 * componente (tarjeta, bordes, botones) se ve desde el primer render.
 * Sin `children` reserva un bloque de `ancho` × `alto` para que el layout no colapse.
 * No va dentro de <p>, <h*> ni <button>: boneyard envuelve con un <div>.
 */
export function Hueso({
  cargando,
  ancho,
  alto,
  radio = 4,
  llenar = false,
  color,
  shimmer,
  className,
  children,
}: {
  cargando: boolean
  /** Color del hueso (boneyard `color`); sin él, el de la config global. */
  color?: string
  /** Color del brillo; sin él, el `shimmerColor` de la config global. */
  shimmer?: string
  /** Ancho del hueco (px o valor CSS). Sin él, el ancho lo da `className` o el contenedor. */
  ancho?: number | string
  alto: number
  radio?: number | string
  /** El hueco ocupa el alto de su contenedor (p. ej. una portada con aspect-ratio). */
  llenar?: boolean
  className?: string
  children?: ReactNode
}) {
  const anchoPx = typeof ancho === 'number' ? ancho : 100
  const huesos = useMemo(
    () => huesoUnico(`hueso-${anchoPx}x${alto}`, anchoPx, alto, radio),
    [anchoPx, alto, radio],
  )
  // boneyard <Skeleton> solo acepta `color`; su shimmerColor es de la config global. El brillo
  // propio va por `boneClass` (.hueso-brillo en index.css) con estas variables CSS.
  const estilo = {
    ...(ancho === undefined ? {} : { width: ancho }),
    ...(shimmer
      ? { '--hueso-color': color ?? 'transparent', '--hueso-brillo': shimmer }
      : {}),
  } as CSSProperties

  return (
    <div className={cn('max-w-full', className)} style={estilo}>
      <Skeleton
        loading={cargando}
        initialBones={huesos}
        color={color}
        boneClass={shimmer ? 'hueso-brillo' : undefined}
        className={llenar ? 'hueso-llenar h-full' : undefined}
      >
        {children ?? (
          <span aria-hidden className="block" style={{ height: alto }} />
        )}
      </Skeleton>
    </div>
  )
}

/**
 * Portada con shimmer hasta que la imagen carga: lista con onLoad,
 * o al montar si viene de caché (img.complete && naturalWidth > 0). Si falla, `respaldo`.
 * La imagen entra con opacidad 0 → 1 en 200 ms. `key={src}` reinicia el estado si cambia la URL.
 */
export function PortadaConCarga({
  src,
  alt = '',
  className,
  alto = 168,
  radio = 6,
  respaldo,
}: {
  src: string
  alt?: string
  /** Tamaño y forma del hueco (ancho y aspect-ratio). */
  className?: string
  /** Alto de referencia del hueso; se escala al alto real. */
  alto?: number
  radio?: number | string
  respaldo: ReactNode
}) {
  return (
    <PortadaConCargaInterna
      key={src}
      src={src}
      alt={alt}
      className={className}
      alto={alto}
      radio={radio}
      respaldo={respaldo}
    />
  )
}

function PortadaConCargaInterna({
  src,
  alt,
  className,
  alto,
  radio,
  respaldo,
}: {
  src: string
  alt: string
  className?: string
  alto: number
  radio: number | string
  respaldo: ReactNode
}) {
  const [listo, setListo] = useState(false)
  const [fallo, setFallo] = useState(false)

  // Ref callback, no efecto: si la imagen ya estaba en caché, no habrá onLoad.
  const marcarSiCargada = (img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth > 0) setListo(true)
  }

  if (fallo) return <>{respaldo}</>

  return (
    <Hueso
      cargando={!listo}
      alto={alto}
      radio={radio}
      llenar
      className={cn('overflow-hidden', className)}
    >
      <img
        ref={marcarSiCargada}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setListo(true)}
        onError={() => setFallo(true)}
        className={cn(
          'block h-full w-full object-cover opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none',
          listo && 'opacity-100',
        )}
      />
    </Hueso>
  )
}
