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

export const muestraHome = {
  page: 1,
  pageSize: 50,
} satisfies ListarLibrosParams

export type ResumenHome = {
  destacados: Libro[]
  portadasCategorias: { categoria: string; portada: Libro }[]
}

export function resumirHome(
  pagina: { items: Libro[] },
  maxDestacados = 6,
): ResumenHome {
  const destacados = [...pagina.items]
    .sort((a, b) => Number(b.disponibles > 0) - Number(a.disponibles > 0))
    .slice(0, maxDestacados)

  const porCategoria = new Map<string, Libro[]>()
  for (const libro of pagina.items) {
    const categoria = libro.categoria.trim()
    if (!categoria) continue
    porCategoria.set(categoria, [...(porCategoria.get(categoria) ?? []), libro])
  }
  const portadasCategorias = [...porCategoria].flatMap(
    ([categoria, libros]) => {
      const portada = libros.find((libro) => libro.disponibles > 0) ?? libros[0]
      return portada ? [{ categoria, portada }] : []
    },
  )

  return { destacados, portadasCategorias }
}

export function useResumenHome() {
  return useQuery({
    queryKey: queryKeys.libros.list(muestraHome),
    queryFn: () => listarLibros(muestraHome),
    select: (pagina) => resumirHome(pagina, 12),
  })
}

export function useLibro(id: number) {
  return useQuery({
    queryKey: queryKeys.libros.detail(id),
    queryFn: () => obtenerLibro(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.libros.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categorias.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.resumen.all }),
      ])
    },
  })
}

export function useDesactivarLibro(opciones: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => desactivarLibro(id),
    onSuccess: async () => {
      opciones.onSuccess?.()
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.libros.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.categorias.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.resumen.all }),
      ])
    },
  })
}

export const MAS_DE_CATEGORIA = 6

export function useMasDeCategoria(
  categoria: string | undefined,
  idActual: number,
) {
  const params = {
    page: 1,
    pageSize: MAS_DE_CATEGORIA + 1,
    categoria,
  } satisfies ListarLibrosParams
  return useQuery({
    queryKey: queryKeys.libros.list(params),
    queryFn: () => listarLibros(params),
    enabled: Boolean(categoria),
    select: (pagina) =>
      pagina.items
        .filter((libro) => libro.idLibro !== idActual)
        .slice(0, MAS_DE_CATEGORIA),
  })
}
