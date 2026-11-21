import { Link } from '@tanstack/react-router'
import { BookX } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'

export function LibroNoEncontrado() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-5 py-20 text-center">
      <span className="bg-lima-wash text-pino-800 grid size-16 place-items-center rounded-full">
        <BookX aria-hidden className="size-7" strokeWidth={1.8} />
      </span>
      <p className="eyebrow mt-4">Error 404</p>
      <h1 className="text-[32px] leading-tight sm:text-[40px]">
        Libro no <span className="titulo-serif">encontrado</span>
      </h1>
      <p className="text-texto-3 text-[15px]">
        Ese título no está en la biblioteca.
      </p>
      <Link
        to="/catalogo"
        search={{ page: 1, pageSize: 12 }}
        className={buttonVariants({ className: 'mt-4' })}
      >
        Volver al catálogo
      </Link>
    </main>
  )
}
