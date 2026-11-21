import { createFileRoute, notFound } from '@tanstack/react-router'

/**
 * Solo desarrollo: /__error lanza un error a propósito para ver la pantalla 500. Fuera de
 * desarrollo la ruta responde como inexistente (404) y nunca lanza.
 */
export const Route = createFileRoute('/__error')({
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw notFound()
  },
  component: LanzarError,
})

function LanzarError(): never {
  throw new Error('Error de prueba lanzado a propósito desde /__error')
}
