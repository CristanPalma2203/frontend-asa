import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/layout/placeholder-page'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    if (typeof search.redirect !== 'string') return {}
    return { redirect: search.redirect }
  },
  component: LoginPage,
})

function LoginPage() {
  return <PlaceholderPage title="Iniciar sesión" />
}
