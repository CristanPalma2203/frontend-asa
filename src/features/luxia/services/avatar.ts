const base = import.meta.env.BASE_URL

export const RIVE_SRC = `${base}luxia/luxia.riv`
export const PLACEHOLDER_SRC = `${base}luxia/luxia.webp`

let cache: boolean | null = null

export function canUseRive(): boolean {
  if (cache !== null) return cache
  if (import.meta.env.MODE === 'test') {
    cache = false
    return cache
  }
  try {
    const c = document.createElement('canvas')
    cache = !!(
      c.getContext('webgl2') ||
      c.getContext('webgl') ||
      c.getContext('2d')
    )
  } catch {
    cache = false
  }
  return cache
}
