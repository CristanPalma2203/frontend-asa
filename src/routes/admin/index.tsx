import { createFileRoute } from '@tanstack/react-router'

import { ResumenAdminPage } from '@/features/admin/resumen-page'

export const Route = createFileRoute('/admin/')({
  staticData: { title: 'Resumen · ASA Biblioteca' },
  component: ResumenAdminPage,
})
