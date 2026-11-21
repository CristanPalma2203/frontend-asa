import { Link } from '@tanstack/react-router'
import { ArrowRight, BookMarked, CalendarCheck, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRef } from 'react'

import { useMotion } from '@/hooks/use-motion'
import { prefersReducedMotion, reveal } from '@/lib/motion'

type Paso = { icono: LucideIcon; titulo: string; texto: string }

const pasos: Paso[] = [
  {
    icono: Search,
    titulo: 'Busca',
    texto:
      'Encuentra el libro por título, autor o ISBN, o explora por categoría.',
  },
  {
    icono: BookMarked,
    titulo: 'Reserva',
    texto:
      'Si hay ejemplares disponibles, pulsa «Reservar». La biblioteca te asigna uno.',
  },
  {
    icono: CalendarCheck,
    titulo: 'Gestiona',
    texto:
      'Consulta tus reservas activas y cancélalas cuando quieras desde «Mis reservas».',
  },
]

export function HomePasos() {
  const ref = useRef<HTMLElement>(null)

  // Entra al aparecer en pantalla (IntersectionObserver, sin cargar ScrollTrigger).
  useMotion(ref, (root, contextSafe) => {
    const bloques = root.querySelectorAll('[data-m="paso"]')
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined')
      return
    const entrar = contextSafe(() => reveal(bloques, { y: 12, stagger: 0.07 }))
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        entrar()
      },
      { threshold: 0.2 },
    )
    io.observe(root)
    return () => io.disconnect()
  })

  return (
    <section
      ref={ref}
      aria-labelledby="home-pasos-titulo"
      className="mx-auto w-full max-w-6xl px-5 pt-16 pb-20 sm:px-10 sm:pt-20"
    >
      <div
        data-m="paso"
        className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
      >
        <div>
          <p className="eyebrow">Cómo funciona</p>
          <h2
            id="home-pasos-titulo"
            className="mt-3 text-[32px] leading-[1.05] sm:text-[40px]"
          >
            Reservar es <span className="titulo-serif">así de simple</span>
          </h2>
        </div>
        <Link
          to="/catalogo"
          search={{ page: 1, pageSize: 12 }}
          className="text-pino-800 hover:text-pino-850 group inline-flex items-center gap-1.5 text-sm font-semibold"
        >
          Explorar el catálogo
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2.2}
          />
        </Link>
      </div>

      <ol className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {pasos.map(({ icono: Icono, titulo, texto }, i) => (
          <li
            key={titulo}
            data-m="paso"
            className="bg-card border-linea shadow-card hover:shadow-card-hover relative flex flex-col gap-4 rounded-xl border p-7 transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="bg-lima-wash text-pino-800 grid size-11 place-items-center rounded-full">
                <Icono aria-hidden className="size-5" strokeWidth={2} />
              </span>
              <span aria-hidden className="text-texto-5 font-mono text-[13px]">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="text-xl">{titulo}</h3>
            <p className="text-texto-3 text-[15px] leading-relaxed">{texto}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
