import { Link } from '@tanstack/react-router'

import { useSesion } from '@/components/layout/use-sesion'
import { useVistaAdmin } from '@/components/layout/use-vista-admin'
import { cn } from '@/lib/utils'

/**
 * Pill segmentada «Panel / Biblioteca» (solo Admin). La vista vive en la URL, así que recargar
 * la conserva y los guards de /admin siguen igual. El lector nunca la ve.
 */
export function VistaPill({
  tono = 'claro',
  className,
}: {
  /** `oscuro`: dentro del menú móvil (sobre el sidebar). */
  tono?: 'claro' | 'oscuro'
  className?: string
}) {
  const sesion = useSesion()
  const vista = useVistaAdmin()
  if (!sesion.isAdmin) return null

  const opciones = [
    { id: 'panel', etiqueta: 'Panel', destino: '/admin' },
    { id: 'biblioteca', etiqueta: 'Biblioteca', destino: '/' },
  ] as const

  return (
    <nav
      aria-label="Cambiar de vista"
      className={cn(
        'grid grid-cols-2 rounded-full p-1',
        tono === 'claro' ? 'bg-linea' : 'bg-white/8',
        className,
      )}
    >
      {opciones.map((opcion) => {
        const activa = vista === opcion.id
        return (
          <Link
            key={opcion.id}
            to={opcion.destino}
            aria-current={activa ? 'page' : undefined}
            className={cn(
              'focus-visible:shadow-foco flex items-center justify-center rounded-full px-5 text-sm font-semibold transition-[background-color,color,box-shadow] duration-250 outline-none hover:no-underline motion-reduce:transition-none',
              tono === 'claro' ? 'h-9' : 'h-11',
              activa
                ? tono === 'claro'
                  ? 'bg-card text-tinta shadow-[0_1px_3px_rgb(4_44_36/0.16)]'
                  : 'bg-lima-400 text-pino-800'
                : tono === 'claro'
                  ? 'text-texto-2 hover:text-tinta'
                  : 'text-white/75 hover:text-white',
            )}
          >
            {opcion.etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}
