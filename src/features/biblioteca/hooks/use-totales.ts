import { useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import { listarLectores } from '@/features/biblioteca/services/lectores.read'
import { listarLibros } from '@/features/biblioteca/services/libros.read'

const soloConteo = { page: 1, pageSize: 1 }

export function useTotalLibros() {
  return useQuery({
    queryKey: queryKeys.libros.list(soloConteo),
    queryFn: () => listarLibros(soloConteo),
    select: (pagina) => pagina.totalCount,
  })
}

export function useTotalLectores() {
  return useQuery({
    queryKey: queryKeys.lectores.list(soloConteo),
    queryFn: () => listarLectores(soloConteo),
    select: (pagina) => pagina.totalCount,
  })
}
