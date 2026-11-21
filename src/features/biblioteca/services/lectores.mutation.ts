import { api } from '@/lib/api/client'
import type {
  CrearLectorBody,
  EditarLectorBody,
} from '@/features/biblioteca/types/api'

export function crearLector(body: CrearLectorBody) {
  return api<void>('/api/lectores', {
    method: 'POST',
    body: {
      identificador: body.identificador,
      nombre: body.nombre,
      correo: body.correo,
      ...(body.password ? { password: body.password } : {}),
    },
  })
}

export function editarLector(id: number, body: EditarLectorBody) {
  return api<void>(`/api/lectores/${id}`, { method: 'PUT', body })
}

/** Reactiva un lector inactivo. */
export function activarLector(id: number) {
  return api<void>(`/api/lectores/${id}/activar`, { method: 'POST' })
}

export function desactivarLector(id: number) {
  return api<void>(`/api/lectores/${id}`, { method: 'DELETE' })
}
