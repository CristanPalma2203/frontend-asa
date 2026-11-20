import { createFileRoute, Outlet } from '@tanstack/react-router'

import { parseCatalogoSearch } from '@/features/biblioteca/schemas/catalogo-search.schema'

export const Route = createFileRoute('/admin/libros')({
  validateSearch: (search) => parseCatalogoSearch(search),
  component: LibrosAdminLayout,
})

function LibrosAdminLayout() {
  return <Outlet />
}
