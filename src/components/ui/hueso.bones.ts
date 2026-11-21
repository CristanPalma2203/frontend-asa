import type { SkeletonResult } from 'boneyard-js'

/**
 * Un solo hueso que ocupa todo el hueco, en el formato de boneyard:
 * [x %, y px, w %, h px, radio]. boneyard escala `y` y `h` al alto real del contenedor.
 */
export function huesoUnico(
  name: string,
  w: number,
  h: number,
  r: number | string = 4,
): SkeletonResult {
  return {
    name,
    viewportWidth: w,
    width: w,
    height: h,
    bones: [[0, 0, 100, h, r]],
  }
}

/** Colores del hueso sobre fondos oscuros (pino, hero): lima translúcido. */
export const HUESO_OSCURO = {
  color: 'rgba(194,249,104,0.14)',
  shimmer: 'rgba(194,249,104,0.28)',
} as const
