import type { LibroDetalle } from '@/features/biblioteca/types/api'
import type { ChatLibro } from '@/features/luxia/types/chat'

export type ObtenerLibro = (idLibro: number) => Promise<LibroDetalle>

export async function fichasDeLibros(
  idsLibros: number[],
  obtenerLibro: ObtenerLibro,
): Promise<ChatLibro[]> {
  const resultados = await Promise.allSettled(
    [...new Set(idsLibros)].map(obtenerLibro),
  )
  return resultados.flatMap((resultado) =>
    resultado.status === 'fulfilled' && resultado.value.estado === 'Activo'
      ? [
          {
            idLibro: resultado.value.idLibro,
            isbn: resultado.value.isbn,
            titulo: resultado.value.titulo,
            autor: resultado.value.autor,
            disponibles: resultado.value.disponibles,
            categoria: resultado.value.categoria,
          },
        ]
      : [],
  )
}
