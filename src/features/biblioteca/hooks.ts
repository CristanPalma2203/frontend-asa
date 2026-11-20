import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  cancelarReserva,
  listarLibros,
  misReservas,
  obtenerLibro,
  reservar,
  type FiltroReservas,
  type ListarLibrosParams,
} from '@/features/biblioteca/api'
import { queryKeys } from '@/features/biblioteca/queryKeys'
import { useAuthStore } from '@/features/auth/store'
import type { PagedResponse, Reserva } from '@/features/biblioteca/types'

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
      await queryClient.invalidateQueries({ queryKey: ['reservas', 'mine'] })
    },
  })
}

export function useCancelarReserva() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ idReserva }: { idReserva: number; libroId: number }) =>
      cancelarReserva(idReserva),
    onMutate: async ({ idReserva }) => {
      await queryClient.cancelQueries({ queryKey: ['reservas', 'mine'] })
      const previas = queryClient.getQueriesData<PagedResponse<Reserva>>({
        queryKey: ['reservas', 'mine'],
      })
      const ahora = new Date().toISOString()
      queryClient.setQueriesData<PagedResponse<Reserva>>(
        { queryKey: ['reservas', 'mine'] },
        (pagina) => {
          if (!pagina) return pagina
          return {
            ...pagina,
            items: pagina.items.map((reserva) =>
              reserva.idReserva === idReserva
                ? { ...reserva, estado: 'Cancelada', fechaCancelacion: ahora }
                : reserva,
            ),
          }
        },
      )
      return { previas }
    },
    onError: (_error, _vars, contexto) => {
      for (const [key, data] of contexto?.previas ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['reservas', 'mine'] })
      await queryClient.invalidateQueries({ queryKey: ['libros'] })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.libros.detail(variables.libroId),
      })
    },
  })
}

export function useMisReservas(filtro: FiltroReservas = 'Activa', page = 1, pageSize = 20) {
  const lectorId = useAuthStore((state) => state.lectorId)
  return useQuery({
    queryKey: queryKeys.reservas.mine(filtro, page, pageSize),
    queryFn: () => misReservas(filtro, page, pageSize),
    enabled: lectorId != null,
  })
}
