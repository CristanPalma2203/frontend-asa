import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useRef, type ReactNode } from 'react'

import { buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { PortadaLibro } from '@/features/biblioteca/components/portadas'
import { StockBadge } from '@/features/biblioteca/components/stock-badge'
import type { Libro } from '@/features/biblioteca/types/api'
import { useMotion } from '@/hooks/use-motion'
import { reveal } from '@/lib/motion'

/** Panel lateral con el resumen de un libro del catálogo y el acceso a su ficha. */
export function LibroResumenPanel({
  libro,
  onCerrar,
}: {
  libro: Libro | null
  onCerrar: () => void
}) {
  return (
    <Sheet
      open={libro !== null}
      onOpenChange={(abierto) => {
        if (!abierto) onCerrar()
      }}
    >
      <SheetContent>
        {libro ? (
          <ContenidoPanel>
            <div className="bg-hueso flex justify-center px-8 pt-12 pb-9">
              <PortadaLibro
                isbn={libro.isbn}
                titulo={libro.titulo}
                tamano="L"
                className="w-[168px]"
              />
            </div>
            <div className="flex flex-1 flex-col gap-5 p-7">
              <div className="flex flex-col gap-2">
                <p className="eyebrow">{libro.categoria}</p>
                <SheetTitle className="text-tinta text-[26px] leading-tight font-semibold tracking-[-0.03em]">
                  {libro.titulo}
                </SheetTitle>
                <SheetDescription className="text-texto-2 text-[15px]">
                  {libro.autor}
                </SheetDescription>
              </div>

              <dl className="border-linea grid grid-cols-2 gap-4 border-y py-4">
                <div>
                  <dt className="text-texto-3 text-xs">ISBN</dt>
                  <dd className="text-texto mt-1 font-mono text-[13px]">
                    {libro.isbn}
                  </dd>
                </div>
                <div>
                  <dt className="text-texto-3 text-xs">Ejemplares</dt>
                  <dd className="text-texto mt-1 font-mono text-[13px]">
                    {libro.disponibles} de {libro.totalEjemplares}
                  </dd>
                </div>
              </dl>

              <div>
                <StockBadge disponibles={libro.disponibles} />
              </div>

              <Link
                to="/libros/$idLibro"
                params={{ idLibro: String(libro.idLibro) }}
                className={buttonVariants({ className: 'mt-auto w-full' })}
              >
                Ver ficha
                <ArrowRight aria-hidden strokeWidth={2.2} />
              </Link>
            </div>
          </ContenidoPanel>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/** Hijos del panel: entran tras el deslizamiento del drawer (y 14, stagger 0.04, delay 0.12). */
function ContenidoPanel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useMotion(ref, (root) =>
    reveal(root.children, { y: 14, stagger: 0.04, delay: 0.12 }),
  )
  return (
    <div ref={ref} className="flex flex-1 flex-col">
      {children}
    </div>
  )
}
