import { Sparkles } from 'lucide-react'

import { useLuxiaStore } from '@/features/luxia/store'
import { cn } from '@/lib/utils'

/** Abre y cierra el chat de LuxIA (el mismo panel que el botón flotante). `sidebar` sobre pino; `barra` sobre el fondo claro de la topbar. */
export function LuxiaBoton({
  variante,
  onClick,
}: {
  variante: 'sidebar' | 'barra'
  onClick?: () => void
}) {
  const abierto = useLuxiaStore((state) => state.abierto)
  const alternar = useLuxiaStore((state) => state.alternar)

  return (
    <button
      type="button"
      aria-expanded={abierto}
      aria-haspopup="dialog"
      onClick={(event) => {
        // El botón que lo abre recibe el foco al cerrar (si sigue en la página).
        alternar(event.currentTarget)
        onClick?.()
      }}
      className={cn(
        'focus-visible:shadow-foco flex cursor-pointer items-center gap-2.5 rounded-full font-semibold transition-colors outline-none',
        variante === 'sidebar'
          ? 'border-lima-400/30 bg-lima-400/8 text-lima-400 hover:bg-lima-400/14 h-11 w-full border px-4 text-sm'
          : 'border-linea-fuerte bg-card text-tinta hover:border-pino-800 h-[46px] flex-none border pr-5 pl-2 text-sm',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid place-items-center rounded-full',
          variante === 'sidebar' ? 'size-6' : 'bg-pino-950 text-lima-400 size-8',
        )}
      >
        <Sparkles className="size-4" strokeWidth={2} />
      </span>
      Pregúntale a LuxIA
    </button>
  )
}
