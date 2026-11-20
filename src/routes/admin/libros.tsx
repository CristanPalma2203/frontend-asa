import { createFileRoute, Outlet } from '@tanstack/react-router'

import { parseCatalogoSearch } from '@/features/biblioteca/schemas'

export const Route = createFileRoute('/admin/libros')({
  validateSearch: (search) => parseCatalogoSearch(search),
  component: LibrosAdminLayout,
})

function LibrosAdminLayout() {
  return <Outlet />
}
