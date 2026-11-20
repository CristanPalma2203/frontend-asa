import { createFileRoute } from '@tanstack/react-router'

import { LibroPage } from '@/features/biblioteca/libro-page'

export const Route = createFileRoute('/libros/$idLibro')({
  component: LibroPage,
})
