import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type { EjemplarForm } from '@/features/biblioteca/schemas/ejemplar.schema'
import {
  cambiarEstadoEjemplar,
  crearEjemplar,
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.ejemplares.list(idLibro) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.libros.detail(idLibro) })
    },
    onError: (error) => opciones.onError?.(error),
  })
}

export type CambioEstadoEjemplar = EjemplarLista & { siguiente: EstadoEjemplarEditable }

/**
 * Cambia el estado con concurrencia optimista (rowVersion). Si otro usuario lo cambió antes
 * (`conflicto-concurrencia`), avisa con `onConflicto` y recarga la lista para tomar el rowVersion nuevo.
 */
export function useCambiarEstadoEjemplar(
  idLibro: number,
  opciones: { onConflicto?: () => void } = {},
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (item: CambioEstadoEjemplar) =>
      cambiarEstadoEjemplar(idLibro, item.idEjemplar, item.siguiente, item.rowVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.ejemplares.list(idLibro) })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === 'conflicto-concurrencia') {
        opciones.onConflicto?.()
        await queryClient.refetchQueries({ queryKey: queryKeys.ejemplares.list(idLibro) })
      }
    },
  })
}
