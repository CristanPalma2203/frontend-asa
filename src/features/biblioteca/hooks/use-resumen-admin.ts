import { useQueries, useQuery } from '@tanstack/react-query'

import { queryKeys } from '@/features/biblioteca/queryKeys'
import {
  listarLectores,
  obtenerLector,
} from '@/features/biblioteca/services/lectores.read'
import {
  listarLibros,
  obtenerLibro,
} from '@/features/biblioteca/services/libros.read'
import type { LectorLista, Libro } from '@/features/biblioteca/types/api'

// Métricas del panel admin a partir de los endpoints existentes (no hay uno de resumen).
// Todo usa las claves de queryKeys, así que las invalidaciones de libros, lectores y reservas
// lo refrescan sin hacer nada más.

/** Página grande para recorrer listas completas; la misma que usa la Home. */
const PAGINA = 50

const paginaLibros = (page: number) => ({ page, pageSize: PAGINA })
const paginaLectores = (page: number) => ({ page, pageSize: PAGINA })

/** Total de libros, para el contador del sidebar. Comparte caché con la Home y el Resumen. */
export function useTotalLibros() {
  return useQuery({
    queryKey: queryKeys.libros.list(paginaLibros(1)),
    queryFn: () => listarLibros(paginaLibros(1)),
    select: (pagina) => pagina.totalCount,
  })
}

/** Total de lectores, para el contador del sidebar. */
export function useTotalLectores() {
  return useQuery({
    queryKey: queryKeys.lectores.list(paginaLectores(1)),
    queryFn: () => listarLectores(paginaLectores(1)),
    select: (pagina) => pagina.totalCount,
  })
}

/** Todas las páginas de una lista: pide la primera y, con su `totalPages`, el resto. */
function useTodosLosLibros() {
  const primera = useQuery({
    queryKey: queryKeys.libros.list(paginaLibros(1)),
    queryFn: () => listarLibros(paginaLibros(1)),
  })
  const resto = useQueries({
    queries: Array.from(
      { length: Math.max((primera.data?.totalPages ?? 1) - 1, 0) },
      (_, i) => ({
        queryKey: queryKeys.libros.list(paginaLibros(i + 2)),
        queryFn: () => listarLibros(paginaLibros(i + 2)),
      }),
    ),
  })
  const items: Libro[] = [
    primera.data?.items ?? [],
    ...resto.map((q) => q.data?.items ?? []),
  ].flat()
  return {
    items,
    total: primera.data?.totalCount,
    isPending: primera.isPending || resto.some((q) => q.isPending),
    isError: primera.isError || resto.some((q) => q.isError),
    error: primera.error ?? resto.find((q) => q.error)?.error,
    refetch: () =>
      Promise.all([primera.refetch(), ...resto.map((q) => q.refetch())]),
  }
}

function useTodosLosLectores() {
  const primera = useQuery({
    queryKey: queryKeys.lectores.list(paginaLectores(1)),
    queryFn: () => listarLectores(paginaLectores(1)),
  })
  const resto = useQueries({
    queries: Array.from(
      { length: Math.max((primera.data?.totalPages ?? 1) - 1, 0) },
      (_, i) => ({
        queryKey: queryKeys.lectores.list(paginaLectores(i + 2)),
        queryFn: () => listarLectores(paginaLectores(i + 2)),
      }),
    ),
  })
  const items: LectorLista[] = [
    primera.data?.items ?? [],
    ...resto.map((q) => q.data?.items ?? []),
  ].flat()
  return {
    items,
    total: primera.data?.totalCount,
    isPending: primera.isPending || resto.some((q) => q.isPending),
    isError: primera.isError || resto.some((q) => q.isError),
    error: primera.error ?? resto.find((q) => q.error)?.error,
    refetch: () =>
      Promise.all([primera.refetch(), ...resto.map((q) => q.refetch())]),
  }
}

export type ResumenAdmin = {
  libros: number
  ejemplares: number
  disponibles: number
  reservados: number
  lectores: number
  lectoresActivos: number
  reservasActivas: number
}

/**
 * - Libros, ejemplares y disponibles: suma de la lista de libros.
 * - Reservados: detalle de los libros con algún ejemplar no disponible (estado «Reservado»).
 * - Reservas activas: suma de `reservasActivas` del detalle de cada lector.
 */
export function useResumenAdmin() {
  const libros = useTodosLosLibros()
  const lectores = useTodosLosLectores()

  const conNoDisponibles = libros.items.filter(
    (libro) => libro.totalEjemplares > libro.disponibles,
  )
  const detallesLibros = useQueries({
    queries: conNoDisponibles.map((libro) => ({
      queryKey: queryKeys.libros.detail(libro.idLibro),
      queryFn: () => obtenerLibro(libro.idLibro),
    })),
  })
  const detallesLectores = useQueries({
    queries: lectores.items.map((lector) => ({
      queryKey: queryKeys.lectores.detail(lector.idLector),
      queryFn: () => obtenerLector(lector.idLector),
    })),
  })

  const isPending =
    libros.isPending ||
    lectores.isPending ||
    detallesLibros.some((q) => q.isPending) ||
    detallesLectores.some((q) => q.isPending)
  const consultasError = [...detallesLibros, ...detallesLectores].find(
    (q) => q.isError,
  )
  const isError = libros.isError || lectores.isError || Boolean(consultasError)

  const data: ResumenAdmin | undefined =
    isPending || isError
      ? undefined
      : {
          libros: libros.total ?? 0,
          ejemplares: sumar(libros.items, (libro) => libro.totalEjemplares),
          disponibles: sumar(libros.items, (libro) => libro.disponibles),
          reservados: sumar(
            detallesLibros,
            (q) =>
              q.data?.ejemplares.filter((e) => e.estado === 'Reservado')
                .length ?? 0,
          ),
          lectores: lectores.total ?? 0,
          lectoresActivos: lectores.items.filter(
            (lector) => lector.estado === 'Activo',
          ).length,
          reservasActivas: sumar(
            detallesLectores,
            (q) => q.data?.reservasActivas ?? 0,
          ),
        }

  return {
    data,
    isPending,
    isError,
    error: libros.error ?? lectores.error ?? consultasError?.error,
    refetch: () =>
      Promise.all([
        libros.refetch(),
        lectores.refetch(),
        ...detallesLibros.map((q) => q.refetch()),
        ...detallesLectores.map((q) => q.refetch()),
      ]),
  }
}

function sumar<T>(items: T[], valor: (item: T) => number) {
  return items.reduce((total, item) => total + valor(item), 0)
}
