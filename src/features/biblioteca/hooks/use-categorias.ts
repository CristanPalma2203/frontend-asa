import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import { listarCategorias } from '@/features/biblioteca/services/categorias.read'
import type { Categoria } from '@/features/biblioteca/types/api'

const CINCO_MINUTOS = 5 * 60 * 1000
export const MAX_SUGERENCIAS = 5

export function useCategorias() {
  return useQuery({
    queryKey: queryKeys.categorias.all,
    queryFn: listarCategorias,
    staleTime: CINCO_MINUTOS,
  })
}

export function mismaCategoria(a: string, b: string) {
  return a.localeCompare(b, 'es', { sensitivity: 'base' }) === 0
}

function sinAcentos(texto: string) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

export function sugerirCategorias(
  categorias: Categoria[] | undefined,
  texto: string,
) {
  const buscado = sinAcentos(texto)
  if (!buscado || !categorias) return []
  return categorias
    .map((categoria) => ({
      categoria,
      posicion: sinAcentos(categoria.nombre).indexOf(buscado),
    }))
    .filter(({ posicion }) => posicion >= 0)
    .sort(
      (a, b) =>
        Number(a.posicion > 0) - Number(b.posicion > 0) ||
        b.categoria.cantidadLibros - a.categoria.cantidadLibros ||
        a.categoria.nombre.localeCompare(b.categoria.nombre, 'es'),
    )
    .slice(0, MAX_SUGERENCIAS)
    .map(({ categoria }) => categoria)
}

export function categoriaExacta(
  categorias: Categoria[] | undefined,
  texto: string,
) {
  const buscado = sinAcentos(texto)
  return categorias?.find((c) => sinAcentos(c.nombre) === buscado)
}
