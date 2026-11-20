import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/layout/placeholder-page'
import { requireSession } from '@/features/auth/guards'

export const Route = createFileRoute('/mis-reservas')({
  beforeLoad: ({ location }) => {
    requireSession(location.href)
  },
  component: MisReservasPage,
})

function MisReservasPage() {
  return <PlaceholderPage title="Mis reservas" />
}
