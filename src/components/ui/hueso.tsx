import { Skeleton } from 'boneyard-js/react'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

import { huesoUnico } from '@/components/ui/hueso.bones'
import { cn } from '@/lib/utils'

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
  color?: string
  shimmer?: string
  ancho?: number | string
  alto: number
  radio?: number | string
  llenar?: boolean
  className?: string
  children?: ReactNode
}) {
  const anchoPx = typeof ancho === 'number' ? ancho : 100
  const huesos = useMemo(
    () => huesoUnico(`hueso-${anchoPx}x${alto}`, anchoPx, alto, radio),
    [anchoPx, alto, radio],
  )
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

export function PortadaConCarga({
  src,
  alt = '',
  className,
  alto = 168,
  radio = 6,
  respaldo,
  contener = false,
}: {
  src: string
  alt?: string
  className?: string
  alto?: number
  radio?: number | string
  respaldo: ReactNode
  contener?: boolean
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
      contener={contener}
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
  contener,
}: {
  src: string
  alt: string
  className?: string
  alto: number
  radio: number | string
  respaldo: ReactNode
  contener: boolean
}) {
  const [listo, setListo] = useState(false)
  const [fallo, setFallo] = useState(false)

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
          'block h-full w-full opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none',
          contener
            ? 'mx-auto max-h-full max-w-full object-contain'
            : 'object-cover',
          listo && 'opacity-100',
        )}
      />
    </Hueso>
  )
}
