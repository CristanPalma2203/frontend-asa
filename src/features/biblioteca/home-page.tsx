import { HomeHero } from '@/features/biblioteca/components/home-hero'
import { HomePasos } from '@/features/biblioteca/components/home-pasos'
import { useResumenHome } from '@/features/biblioteca/hooks/use-libros'

export function HomePage() {
  const resumen = useResumenHome()

  // Si la API falla, el hero sigue sirviendo para buscar: solo se ocultan chips y portadas.
  return (
    <main>
      <HomeHero resumen={resumen.data} cargando={resumen.isPending} />
      <HomePasos />
    </main>
  )
}
