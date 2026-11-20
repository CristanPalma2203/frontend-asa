import { createFileRoute } from '@tanstack/react-router'

import { LectoresAdminPage } from '@/features/admin/lectores-page'
import { parseCatalogoSearch } from '@/features/biblioteca/schemas/catalogo-search.schema'

export const Route = createFileRoute('/admin/lectores')({
  staticData: { title: 'Lectores · ASA Biblioteca' },
  validateSearch: (search) => parseCatalogoSearch(search),
  component: LectoresAdminPage,
})
