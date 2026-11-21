import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import {
  isSessionActive,
  selectIsAdmin,
  selectIsLector,
  useAuthStore,
} from '@/features/auth/store'
import { olvidarLuxia } from '@/features/luxia/reset'

/** Datos de la sesión que necesita la navegación, y la acción de salir. */
export function useSesion() {
  const isAdmin = useAuthStore(selectIsAdmin)
  const isLector = useAuthStore(selectIsLector)
  const activa = useAuthStore(isSessionActive)
  const nombre = useAuthStore((state) => state.nombre)
  const correo = useAuthStore((state) => state.correo)
  const logout = useAuthStore((state) => state.logout)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const visible = activa && Boolean(nombre || correo)

  function salir() {
    logout()
    olvidarLuxia()
    queryClient.clear()
    void navigate({ to: '/' })
  }

  return {
    visible,
    isAdmin,
    isLector,
    nombre: visible ? nombre || correo : null,
    detalle: visible ? (isAdmin ? 'Administrador' : correo || 'Lector') : null,
    iniciales: visible ? iniciales(nombre || correo || '') : '',
    salir,
  }
}

function iniciales(texto: string) {
  const partes = texto.split(/[\s@.]+/).filter(Boolean)
  return partes
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}
