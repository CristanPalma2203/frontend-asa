import { Link, useNavigate } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import heroBlobs from '@/assets/hero-blobs.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()
  const [buscar, setBuscar] = useState('')

  return (
    <section className="relative min-h-[calc(100svh-8.5rem)]">
      <img
        src={heroBlobs}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative z-10 flex min-h-[calc(100svh-8.5rem)] items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
          <h1 className="text-4xl leading-tight sm:text-6xl">ASA Biblioteca</h1>
          <p className="text-base text-tinta sm:text-lg">
            Busca un título y pasa al catálogo.
          </p>
          <form
            className="flex w-full flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              void navigate({
                to: '/catalogo',
                search: buscar.trim() ? { buscar: buscar.trim() } : {},
              })
            }}
          >
            <Input
              value={buscar}
              onChange={(event) => setBuscar(event.target.value)}
              placeholder="Título, autor o tema"
              aria-label="Buscar en el catálogo"
              className="h-14 rounded-2xl bg-white text-base"
            />
            <Button type="submit" className="h-14 px-6">
              Buscar
            </Button>
          </form>
          <Button asChild variant="secondary" size="lg">
            <Link to="/catalogo">Ver catálogo</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
