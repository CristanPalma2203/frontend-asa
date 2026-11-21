import { Hueso } from '@/components/ui/hueso'
import { useMisReservas } from '@/features/biblioteca/hooks/use-reservas'

export function MisReservasStats() {
  const activas = useMisReservas('Activa', 1, 1)
  const todas = useMisReservas('Todas', 1, 1)
  const canceladas = useMisReservas('Cancelada', 1, 1)

  const cifras = [
    { etiqueta: 'Activas', consulta: activas },
    { etiqueta: 'Total', consulta: todas },
    { etiqueta: 'Canceladas', consulta: canceladas },
  ] as const

  return (
    <dl
      role="group"
      aria-label="Resumen de tus reservas"
      className="bg-card border-linea shadow-card grid grid-cols-3 gap-2 rounded-2xl border p-4 sm:gap-6 sm:p-5"
    >
      {cifras.map(({ etiqueta, consulta }) => (
        <div
          key={etiqueta}
          className="flex flex-col-reverse gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3"
        >
          <dt className="text-texto-3 text-xs font-medium sm:text-sm">
            {etiqueta}
          </dt>
          <dd className="text-tinta font-mono text-2xl font-semibold tracking-[-0.03em] sm:text-[28px]">
            {consulta.isPending && consulta.fetchStatus !== 'idle' ? (
              <Hueso cargando ancho={28} alto={24} />
            ) : (
              (consulta.data?.totalCount ?? 0)
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}
