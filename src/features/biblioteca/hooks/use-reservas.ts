import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/features/auth/store'
import { queryKeys } from '@/features/biblioteca/queryKeys'
import { cancelarReserva, reservar } from '@/features/biblioteca/services/reservas.mutation'
import { listarReservasDeLector } from '@/features/biblioteca/services/reservas.read'
import type { PagedResponse, Reserva } from '@/features/biblioteca/types/api'
import type { FiltroReservas } from '@/features/biblioteca/types/estados'

/** Reservas del lector de la sesión. No consulta si la sesión no tiene lector. */
export function useMisReservas(filtro: FiltroReservas = 'Activa', page = 1, pageSize = 20) {
  const lectorId = useAuthStore((state) => state.lectorId)
  return useQuery({
    queryKey: queryKeys.reservas.list(filtro, page, pageSize),
    queryFn: () => listarReservasDeLector(lectorId ?? 0, filtro, page, pageSize),
    enabled: lectorId != null,
  })
}

export function useReservar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: reservar,
    onSuccess: async () => {
      await invalidarTrasReserva(queryClient)
    },
  })
}

/** Cancela con update optimista: marca la reserva como Cancelada y hace rollback si falla. */
export function useCancelarReserva() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ idReserva }: { idReserva: number }) => cancelarReserva(idReserva),
    onMutate: async ({ idReserva }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reservas.mias() })
      const previas = queryClient.getQueriesData<PagedResponse<Reserva>>({
        queryKey: queryKeys.reservas.mias(),
      })
      const ahora = new Date().toISOString()
      queryClient.setQueriesData<PagedResponse<Reserva>>(
        { queryKey: queryKeys.reservas.mias() },
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
    onSettled: async () => {
      await invalidarTrasReserva(queryClient)
    },
  })
}

/**
 * Reservar o cancelar cambia "disponibles" y las reservas del lector. `libros.all` cubre por prefijo
 * todas las listas y todos los detalles de libros (catálogo, ficha y admin), así que no hace falta
 * invalidar `libros.detail(id)` aparte: hacerlo pedía el detalle dos veces.
 */
async function invalidarTrasReserva(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.libros.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.reservas.mias() }),
  ])
}
