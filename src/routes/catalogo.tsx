import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/layout/placeholder-page'

export const Route = createFileRoute('/catalogo')({
  validateSearch: (search: Record<string, unknown>): { buscar?: string } => {
    if (typeof search.buscar !== 'string' || search.buscar.length === 0) return {}
    return { buscar: search.buscar }
  },
  component: CatalogoPage,
})

function CatalogoPage() {
  return <PlaceholderPage title="Catálogo" />
}
