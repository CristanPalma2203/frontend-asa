import { createFileRoute } from '@tanstack/react-router'

import { CatalogoPage } from '@/features/biblioteca/catalogo-page'
import { parseCatalogoSearch } from '@/features/biblioteca/schemas'

export const Route = createFileRoute('/catalogo')({
  validateSearch: (search) => parseCatalogoSearch(search),
  component: CatalogoPage,
})
