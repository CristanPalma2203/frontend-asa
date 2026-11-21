import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type { LibroForm } from '@/features/biblioteca/schemas/libro.schema'
import {
  crearLibro,
  desactivarLibro,
  editarLibro,
} from '@/features/biblioteca/services/libros.mutation'
import {
  listarLibros,
  obtenerLibro,
} from '@/features/biblioteca/services/libros.read'
import type { Libro, ListarLibrosParams } from '@/features/biblioteca/types/api'

export function useLibros(params: ListarLibrosParams) {
  return useQuery({
    queryKey: queryKeys.libros.list(params),
    queryFn: () => listarLibros(params),
  })
}

/** Muestra del catálogo para la Home: una página de la API de la que salen las portadas y categorías. */
const muestraHome = { page: 1, pageSize: 50 } satisfies ListarLibrosParams

export type ResumenHome = {
  totalTitulos: number
  /** Portadas para la tira del hero: primero los que tienen stock. */
  destacados: Libro[]
  /** Categorías más frecuentes de la muestra, de mayor a menor. */
  categorias: string[]
}

export function resumirHome(
  pagina: { items: Libro[]; totalCount: number },
  maxDestacados = 6,
  maxCategorias = 6,
): ResumenHome {
  const destacados = [...pagina.items]
    .sort((a, b) => Number(b.disponibles > 0) - Number(a.disponibles > 0))
    .slice(0, maxDestacados)

  const conteo = new Map<string, number>()
  for (const libro of pagina.items) {
    const categoria = libro.categoria.trim()
    if (categoria) conteo.set(categoria, (conteo.get(categoria) ?? 0) + 1)
  }
  const categorias = [...conteo]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'))
    .slice(0, maxCategorias)
    .map(([categoria]) => categoria)

  return { totalTitulos: pagina.totalCount, destacados, categorias }
}

export function useResumenHome() {
  return useQuery({
    queryKey: queryKeys.libros.list(muestraHome),
    queryFn: () => listarLibros(muestraHome),
    select: (pagina) => resumirHome(pagina),
  })
}

export function useLibro(id: number) {
  return useQuery({
    queryKey: queryKeys.libros.detail(id),
    queryFn: () => obtenerLibro(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

/** Crea un libro o, si se pasa `libro`, lo edita. */
export function useGuardarLibro(
  libro: Libro | null,
  opciones: { onSuccess?: () => void } = {},
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LibroForm) => {
      if (libro) await editarLibro(libro.idLibro, values)
      else await crearLibro(values)
    },
    onSuccess: async () => {
      opciones.onSuccess?.()
      await queryClient.invalidateQueries({ queryKey: queryKeys.libros.all })
    },
  })
}

export function useDesactivarLibro(opciones: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => desactivarLibro(id),
    onSuccess: async () => {
      opciones.onSuccess?.()
      await queryClient.invalidateQueries({ queryKey: queryKeys.libros.all })
    },
  })
}
