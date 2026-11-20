import { createFileRoute } from '@tanstack/react-router'

import { LibroAdminPage } from '@/features/admin/libro-admin-page'

export const Route = createFileRoute('/admin/libros/$idLibro')({
  staticData: { title: 'Ejemplares · ASA Biblioteca' },
  component: LibroAdminPage,
})
