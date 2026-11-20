import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type { LibroForm } from '@/features/biblioteca/schemas/libro.schema'
import { crearLibro, desactivarLibro, editarLibro } from '@/features/biblioteca/services/libros.mutation'
import { listarLibros, obtenerLibro } from '@/features/biblioteca/services/libros.read'
import type { Libro, ListarLibrosParams } from '@/features/biblioteca/types/api'

export function useLibros(params: ListarLibrosParams) {
  return useQuery({
    queryKey: queryKeys.libros.list(params),
    queryFn: () => listarLibros(params),
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
export function useGuardarLibro(libro: Libro | null, opciones: { onSuccess?: () => void } = {}) {
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
