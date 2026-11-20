import { createFileRoute } from '@tanstack/react-router'

import { LibrosAdminPage } from '@/features/admin/libros-page'

export const Route = createFileRoute('/admin/libros/')({
  staticData: { title: 'Libros · ASA Biblioteca' },
  component: LibrosAdminPage,
})
