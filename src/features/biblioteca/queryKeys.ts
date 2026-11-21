import type {
  ListarLectoresParams,
  ListarLibrosParams,
} from '@/features/biblioteca/types/api'
import type { FiltroReservas } from '@/features/biblioteca/types/estados'

// Cada recurso tiene una raíz `all`; listas y detalles cuelgan de ella para poder
// invalidar todo un recurso (`all`), solo sus listas (`lists`) o un registro (`detail`).

const librosAll = ['libros'] as const
const lectoresAll = ['lectores'] as const
const reservasAll = ['reservas'] as const
const ejemplaresAll = ['ejemplares'] as const
const resumenAll = ['resumen'] as const

export const queryKeys = {
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
    /** Todas las listas de "Mis reservas" (cualquier filtro y página). */
    mias: () => [...reservasAll, 'mine'] as const,
    list: (filtro: FiltroReservas = 'Todas', page = 1, pageSize = 20) =>
      [...reservasAll, 'mine', filtro, page, pageSize] as const,
  },
  ejemplares: {
    all: ejemplaresAll,
    list: (idLibro: number) => [...ejemplaresAll, idLibro] as const,
  },
}
