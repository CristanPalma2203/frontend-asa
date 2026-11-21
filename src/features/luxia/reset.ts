import { clearHistory } from '@/features/luxia/services/historial'
import { useLuxiaStore } from '@/features/luxia/store'

export function olvidarLuxia() {
  clearHistory()
  useLuxiaStore.getState().reiniciar()
}
