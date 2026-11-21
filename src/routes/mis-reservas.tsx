import { createFileRoute, redirect } from '@tanstack/react-router'

import { MisReservasPage } from '@/features/biblioteca/mis-reservas-page'
import { parseMisReservasSearch } from '@/features/biblioteca/schemas/mis-reservas-search.schema'
import { requireSession } from '@/features/auth/guards'
import { selectIsLector, useAuthStore } from '@/features/auth/store'

export const Route = createFileRoute('/mis-reservas')({
  staticData: { title: 'Mis reservas · ASA Biblioteca' },
  validateSearch: (search) => parseMisReservasSearch(search),
  beforeLoad: ({ location }) => {
    requireSession(location.href)
    if (!selectIsLector(useAuthStore.getState())) {
      throw redirect({ to: '/' })
    }
  },
  component: MisReservasPage,
})
