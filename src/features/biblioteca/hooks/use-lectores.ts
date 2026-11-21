import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type { LectorForm } from '@/features/biblioteca/schemas/lector.schema'
import {
  crearLector,
  activarLector,
  desactivarLector,
  editarLector,
} from '@/features/biblioteca/services/lectores.mutation'
import {
  listarLectores,
  obtenerLector,
} from '@/features/biblioteca/services/lectores.read'
import type {
  LectorLista,
  ListarLectoresParams,
} from '@/features/biblioteca/types/api'

export function useLectores(params: ListarLectoresParams) {
  return useQuery({
    queryKey: queryKeys.lectores.list(params),
    queryFn: () => listarLectores(params),
  })
}

export function useLector(id: number | null) {
  return useQuery({
    queryKey: queryKeys.lectores.detail(id ?? 0),
    queryFn: () => obtenerLector(id ?? 0),
    enabled: id != null,
  })
}

export function useGuardarLector(
  lector: LectorLista | null,
  opciones: { onSuccess?: () => void } = {},
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LectorForm) => {
      if (!lector) {
        await crearLector({
          identificador: values.identificador,
          nombre: values.nombre,
          correo: values.correo,
          password: values.password || undefined,
        })
        return
      }
      await editarLector(lector.idLector, {
        identificador: values.identificador,
        nombre: values.nombre,
        correo: values.correo,
      })
      const estabaInactivo = lector.estado === 'Inactivo'
      if (values.estado === 'Inactivo' && !estabaInactivo) {
        await desactivarLector(lector.idLector)
      }
      if (values.estado === 'Activo' && estabaInactivo) {
        await activarLector(lector.idLector)
      }
    },
    onSuccess: () => opciones.onSuccess?.(),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.lectores.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.resumen.all }),
      ])
    },
  })
}
