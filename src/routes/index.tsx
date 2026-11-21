import { createFileRoute } from '@tanstack/react-router'

import { HomePage } from '@/features/biblioteca/home-page'

export const Route = createFileRoute('/')({
  staticData: { title: 'ASA Biblioteca' },
  component: HomePage,
})
