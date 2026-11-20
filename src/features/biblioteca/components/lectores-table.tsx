import { Button } from '@/components/ui/button'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeLector } from '@/features/biblioteca/components/estado-badge.styles'
import type { Lector, LectorLista } from '@/features/biblioteca/types/api'

/** Lectores del panel admin; cada fila se puede expandir para ver sus reservas activas. */
export function LectoresTable({
  lectores,
  abiertoId,
  detalle,
  cargandoDetalle,
  onEdit,
  onToggle,
}: {
  lectores: LectorLista[]
  abiertoId: number | null
  detalle: Lector | undefined
  cargandoDetalle: boolean
  onEdit: (lector: LectorLista) => void
  onToggle: (lector: LectorLista) => void
}) {
  return (
    <table className="mt-4 w-full text-left text-sm">
      <thead>
        <tr className="border-b-2 border-tinta">
          <th className="py-2">Identificador</th>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Estado</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {lectores.map((lector) => (
          <LectorFilas
            key={lector.idLector}
            lector={lector}
            abierto={abiertoId === lector.idLector}
            detalle={abiertoId === lector.idLector ? detalle : undefined}
            cargando={abiertoId === lector.idLector && cargandoDetalle}
            onEdit={() => onEdit(lector)}
            onToggle={() => onToggle(lector)}
          />
        ))}
      </tbody>
    </table>
  )
}

function LectorFilas({
  lector,
  abierto,
  detalle,
  cargando,
  onEdit,
  onToggle,
}: {
  lector: LectorLista
  abierto: boolean
  detalle: { reservasActivas: number } | undefined
  cargando: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  return (
    <>
      <tr className="border-b border-tinta/20">
        <td className="py-2">{lector.identificador}</td>
        <td>{lector.nombre}</td>
        <td>{lector.correo}</td>
        <td>
          <EstadoBadge estilo={badgeLector[lector.estado]} />
        </td>
        <td className="space-x-2 py-2 text-right">
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            Editar
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onToggle}>
            Reservas
          </Button>
        </td>
      </tr>
      {abierto ? (
        <tr className="border-b border-tinta/20 bg-crema">
          <td colSpan={5} className="px-2 py-3 text-sm">
            {cargando ? 'Cargando…' : null}
            {detalle ? `Reservas activas: ${detalle.reservasActivas}` : null}
          </td>
        </tr>
      ) : null}
    </>
  )
}
