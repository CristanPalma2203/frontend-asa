import { clearHistory } from '@/features/luxia/services/historial'
import { useLuxiaStore } from '@/features/luxia/store'

/**
 * Olvida la conversación de LuxIA (historial guardado y estado del panel). Se llama al cerrar
 * sesión, ante un 401 y con el token vencido: el siguiente usuario no ve la conversación anterior.
 */
export function olvidarLuxia() {
  clearHistory()
  useLuxiaStore.getState().reiniciar()
}
