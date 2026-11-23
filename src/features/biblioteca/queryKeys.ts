import type {
  ListarLectoresParams,
  ListarLibrosParams,
} from '@/features/biblioteca/types/api'
import type { FiltroReservas } from '@/features/biblioteca/types/estados'

const librosAll = ['libros'] as const
const lectoresAll = ['lectores'] as const
const reservasAll = ['reservas'] as const
const ejemplaresAll = ['ejemplares'] as const
const resumenAll = ['resumen'] as const
const categoriasAll = ['categorias'] as const

export const queryKeys = {
  categorias: {
    all: categoriasAll,
  },
  resumen: {
    all: resumenAll,
    detail: (dias: 14 | 30) => [...resumenAll, dias] as const,
  },
  libros: {
    all: librosAll,
    lists: () => [...librosAll, 'list'] as const,
    list: (params: ListarLibrosParams) =>
      [...librosAll, 'list', params] as const,
    details: () => [...librosAll, 'detail'] as const,
    detail: (id: number) => [...librosAll, 'detail', id] as const,
  },
  lectores: {
    all: lectoresAll,
    lists: () => [...lectoresAll, 'list'] as const,
    list: (params: ListarLectoresParams) =>
      [...lectoresAll, 'list', params] as const,
    details: () => [...lectoresAll, 'detail'] as const,
    detail: (id: number) => [...lectoresAll, 'detail', id] as const,
  },
  reservas: {
    all: reservasAll,
    mias: () => [...reservasAll, 'mine'] as const,
    list: (filtro: FiltroReservas = 'Todas', page = 1, pageSize = 20) =>
      [...reservasAll, 'mine', filtro, page, pageSize] as const,
  },
  ejemplares: {
    all: ejemplaresAll,
    list: (idLibro: number) => [...ejemplaresAll, idLibro] as const,
  },
}
