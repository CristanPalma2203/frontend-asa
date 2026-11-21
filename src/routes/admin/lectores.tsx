import { createFileRoute } from '@tanstack/react-router'

import { LectoresAdminPage } from '@/features/admin/lectores-page'
import { parseLectoresSearch } from '@/features/biblioteca/schemas/lectores-search.schema'

export const Route = createFileRoute('/admin/lectores')({
  staticData: { title: 'Lectores · ASA Biblioteca' },
  validateSearch: (search) => parseLectoresSearch(search),
  component: LectoresAdminPage,
})
