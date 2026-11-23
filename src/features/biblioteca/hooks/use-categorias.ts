import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import { listarCategorias } from '@/features/biblioteca/services/categorias.read'

export function useCategorias() {
  return useQuery({
    queryKey: queryKeys.categorias.all,
    queryFn: listarCategorias,
  })
}

export function mismaCategoria(a: string, b: string) {
  return a.localeCompare(b, 'es', { sensitivity: 'base' }) === 0
}
