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
    mine: () => ['reservas', 'mine'] as const,
  },
}
