import { createFileRoute } from '@tanstack/react-router'

import { CatalogoPage } from '@/features/biblioteca/catalogo-page'
import { parseCatalogoSearch } from '@/features/biblioteca/schemas/catalogo-search.schema'

export const Route = createFileRoute('/catalogo')({
  staticData: { title: 'Catálogo · ASA Biblioteca' },
  validateSearch: (search) => parseCatalogoSearch(search),
  component: CatalogoPage,
})
