import { createFileRoute, notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/__error')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: LanzarError,
})

function LanzarError(): never {
  throw new Error('Error de prueba lanzado a propósito desde /__error')
}
