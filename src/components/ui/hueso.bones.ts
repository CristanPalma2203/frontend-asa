import type { SkeletonResult } from 'boneyard-js'

/**
 * Un solo hueso que ocupa todo el hueco, en el formato de Corelux (src/bones/layouts.js):
 * [x %, y px, w %, h px, radio]. boneyard escala `y` y `h` al alto real del contenedor.
 */
export function huesoUnico(name: string, w: number, h: number, r: number | string = 4): SkeletonResult {
  return { name, viewportWidth: w, width: w, height: h, bones: [[0, 0, 100, h, r]] }
}
