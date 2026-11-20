import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/layout/placeholder-page'
import { requireAdmin } from '@/features/auth/guards'

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => {
    requireAdmin(location.href)
  },
  component: AdminPage,
})

function AdminPage() {
  return <PlaceholderPage title="Administración" />
}
