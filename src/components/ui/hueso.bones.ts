import type { SkeletonResult } from 'boneyard-js'

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

export const HUESO_OSCURO = {
  color: 'rgba(194,249,104,0.14)',
  shimmer: 'rgba(194,249,104,0.28)',
} as const
