import { useQuery } from '@tanstack/react-query'

import type { DiasResumen } from '@/features/admin/types/resumen'
import { obtenerResumen } from '@/features/admin/services/resumen.read'
import { queryKeys } from '@/features/biblioteca/queryKeys'

export function useResumen(dias: DiasResumen = 14) {
  return useQuery({
    queryKey: queryKeys.resumen.detail(dias),
    queryFn: () => obtenerResumen(dias),
  })
}
