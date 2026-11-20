import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelarReserva,
  listarLibros,
  misReservas,
  obtenerLibro,
  reservar,
  type ListarLibrosParams,
} from '@/features/biblioteca/api'
import { queryKeys } from '@/features/biblioteca/queryKeys'

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

export function useReservar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reservar,
    onSuccess: async (_reserva, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['libros'] })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.libros.detail(variables.libroId),
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.reservas.mine() })
    },
  })
}

export function useCancelarReserva() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelarReserva,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['libros'] })
      await queryClient.invalidateQueries({ queryKey: queryKeys.reservas.mine() })
    },
  })
}

export function useMisReservas() {
  return useQuery({
    queryKey: queryKeys.reservas.mine(),
    queryFn: misReservas,
  })
}
