import { api } from '@/lib/api/client'
import { useAuthStore } from '@/features/auth/store'

type SesionApi = {
  accessToken: string | null
  expiresAt: string | null
  rol: string
  nombre: string
  lectorId: number | null
}

export async function iniciarSesion(input: {
  correo: string
  password: string
}) {
  const sesion = await api<SesionApi>('/api/auth/login', {
    method: 'POST',
    body: input,
  })

  if (!sesion.accessToken) {
    throw new Error('El servidor no devolvió un token.')
  }

  guardar(sesion, sesion.accessToken, input.correo)

  const me = await api<SesionApi>('/api/auth/me')
  guardar(me, sesion.accessToken, input.correo)
}

function guardar(sesion: SesionApi, token: string, correo: string) {
  useAuthStore.getState().login({
    token,
    expiresAt: sesion.expiresAt ?? Date.now(),
    rol: sesion.rol,
    nombre: sesion.nombre,
    lectorId: sesion.lectorId,
    correo,
  })
}
