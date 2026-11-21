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

/** Detalle de un lector; no consulta mientras `id` sea null. */
export function useLector(id: number | null) {
  return useQuery({
    queryKey: queryKeys.lectores.detail(id ?? 0),
    queryFn: () => obtenerLector(id ?? 0),
    enabled: id != null,
  })
}

/**
 * Crea un lector (con usuario si trae contraseña) o, si se pasa `lector`, edita sus datos.
 * Al editar, si el estado cambia, después de guardar los datos lo desactiva o lo reactiva.
 * Las queries de lectores se invalidan también si falla a medias (los datos ya se guardaron).
 */
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.lectores.all })
    },
  })
}
