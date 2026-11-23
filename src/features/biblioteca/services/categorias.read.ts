import type { Categoria } from '@/features/biblioteca/types/api'
import { api } from '@/lib/api/client'

export function listarCategorias() {
  return api<Categoria[]>('/api/categorias')
}
