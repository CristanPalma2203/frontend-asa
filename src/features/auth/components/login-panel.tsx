import { Brand } from '@/components/layout/brand'
import { HeroBackdrop } from '@/features/biblioteca/components/hero-backdrop'

/** Panel izquierdo del login (escritorio): fondo animado del hero, logo y frase. */
export function LoginPanel() {
  return (
    <aside className="bg-pino-950 text-papel relative isolate hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <HeroBackdrop />
      <div className="relative">
        <Brand tono="oscuro" />
      </div>
      <div className="relative max-w-md">
        <p className="text-papel text-[44px] leading-[1.04] font-semibold tracking-[-0.04em] xl:text-[52px]">
          Tu biblioteca,
          <span className="titulo-serif text-lima-400 mt-1 block text-[1.08em]">
            a un clic de distancia.
          </span>
        </p>
        <p className="mt-5 text-[15px] leading-relaxed text-white/70">
          Busca en el catálogo, reserva y consulta tus préstamos desde un solo lugar.
        </p>
      </div>
      <p className="relative text-xs text-white/60">ASA Biblioteca · Luxware</p>
    </aside>
  )
}

/** Franja pino superior del login en móvil. */
export function LoginFranjaMovil() {
  return (
    <div className="bg-pino-950 flex h-28 items-start px-5 pt-6 lg:hidden">
      <Brand tono="oscuro" />
    </div>
  )
}
