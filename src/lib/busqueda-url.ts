import { defaultStringifySearch } from '@tanstack/react-router'

export function stringifySearch(search: Record<string, unknown>) {
  return defaultStringifySearch(search).replace(/\+/g, '%20')
}
