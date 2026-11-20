import { createFileRoute } from '@tanstack/react-router'

import { AdminShell } from '@/components/layout/admin-shell'
import { requireAdmin } from '@/features/auth/guards'

export const Route = createFileRoute('/admin')({
  staticData: { title: 'Administración · ASA Biblioteca' },
  beforeLoad: ({ location }) => {
    requireAdmin(location.href)
  },
  component: AdminShell,
})
