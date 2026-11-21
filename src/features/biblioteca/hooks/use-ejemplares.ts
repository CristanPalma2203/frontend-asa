import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type {
  EjemplarEdicion,
  EjemplarForm,
} from '@/features/biblioteca/schemas/ejemplar.schema'
import {
  cambiarEstadoEjemplar,
  crearEjemplar,
  editarEjemplar,
} from '@/features/biblioteca/services/ejemplares.mutation'
import { listarEjemplares } from '@/features/biblioteca/services/ejemplares.read'
import type { EjemplarLista } from '@/features/biblioteca/types/api'
import type { EstadoEjemplarEditable } from '@/features/biblioteca/types/estados'
import { ApiError } from '@/lib/api/client'

export function useEjemplares(idLibro: number) {
  return useQuery({
    queryKey: queryKeys.ejemplares.list(idLibro),
    queryFn: () => listarEjemplares(idLibro),
    enabled: idLibro > 0,
  })
}

export function useCrearEjemplar(
  idLibro: number,
  opciones: { onSuccess?: () => void; onError?: (error: Error) => void } = {},
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: EjemplarForm) => crearEjemplar(idLibro, values),
    onSuccess: async () => {
      opciones.onSuccess?.()
      await invalidarDisponibilidad(queryClient, idLibro)
    },
    onError: (error) => opciones.onError?.(error),
  })
}

async function invalidarDisponibilidad(
  queryClient: QueryClient,
  idLibro: number,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: queryKeys.ejemplares.list(idLibro),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.libros.detail(idLibro),
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.libros.lists() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.resumen.all }),
  ])
}

export function useEditarEjemplar(
  idLibro: number,
  opciones: { onSuccess?: () => void; onError?: (error: Error) => void } = {},
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      idEjemplar,
      ...body
    }: EjemplarEdicion & { idEjemplar: number }) =>
      editarEjemplar(idEjemplar, body),
    onSuccess: async () => {
      opciones.onSuccess?.()
      await invalidarDisponibilidad(queryClient, idLibro)
    },
    onError: async (error) => {
      opciones.onError?.(error)
      if (
        error instanceof ApiError &&
        error.code === 'conflicto-concurrencia'
      ) {
        await queryClient.refetchQueries({
          queryKey: queryKeys.ejemplares.list(idLibro),
        })
      }
    },
  })
}

export type CambioEstadoEjemplar = EjemplarLista & {
  siguiente: EstadoEjemplarEditable
}

export function useCambiarEstadoEjemplar(
  idLibro: number,
  opciones: { onConflicto?: () => void } = {},
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (item: CambioEstadoEjemplar) =>
      cambiarEstadoEjemplar(
        idLibro,
        item.idEjemplar,
        item.siguiente,
        item.rowVersion,
      ),
    onSuccess: async () => {
      await invalidarDisponibilidad(queryClient, idLibro)
    },
    onError: async (error) => {
      if (
        error instanceof ApiError &&
        error.code === 'conflicto-concurrencia'
      ) {
        opciones.onConflicto?.()
        await queryClient.refetchQueries({
          queryKey: queryKeys.ejemplares.list(idLibro),
        })
      }
    },
  })
}
