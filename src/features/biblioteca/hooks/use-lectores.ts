import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import type { LectorForm } from '@/features/biblioteca/schemas/lector.schema'
import {
  crearLector,
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
 * Al editar, si el formulario lo marca Inactivo y antes no lo estaba, además lo da de baja.
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
      if (values.estado === 'Inactivo' && lector.estado !== 'Inactivo') {
        await desactivarLector(lector.idLector)
      }
    },
    onSuccess: async () => {
      opciones.onSuccess?.()
      await queryClient.invalidateQueries({ queryKey: queryKeys.lectores.all })
    },
  })
}
