import { createFileRoute } from '@tanstack/react-router'

import { PlaceholderPage } from '@/components/layout/placeholder-page'

export const Route = createFileRoute('/libros/$idLibro')({
  component: LibroPage,
})

function LibroPage() {
  return <PlaceholderPage title="Libro" />
}
