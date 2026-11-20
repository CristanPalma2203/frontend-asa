export const queryKeys = {
  libros: {
    list: (params: {
      buscar?: string
      categoria?: string
      page: number
      pageSize: number
    }) => ['libros', 'list', params] as const,
    detail: (id: number) => ['libros', 'detail', id] as const,
  },
  reservas: {
    mine: (filtro: 'Activa' | 'Cancelada' | 'Todas' = 'Todas', page = 1, pageSize = 20) =>
      ['reservas', 'mine', filtro, page, pageSize] as const,
  },
  ejemplares: (idLibro: number) => ['ejemplares', idLibro] as const,
  lectores: {
    list: (params: { buscar?: string; page: number; pageSize: number }) =>
      ['lectores', 'list', params] as const,
    detail: (id: number) => ['lectores', 'detail', id] as const,
  },
}
