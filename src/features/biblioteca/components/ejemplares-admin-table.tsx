import { Button } from '@/components/ui/button'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeEjemplar } from '@/features/biblioteca/components/estado-badge.styles'
import type { EjemplarLista } from '@/features/biblioteca/types/api'

/** Ejemplares de un libro con el botón para pasar entre Disponible e Inactivo. */
export function EjemplaresAdminTable({
  ejemplares,
  deshabilitado,
  onCambiarEstado,
}: {
  ejemplares: EjemplarLista[]
  deshabilitado: boolean
  onCambiarEstado: (ejemplar: EjemplarLista) => void
}) {
  return (
    <table className="mt-3 w-full text-left text-sm">
      <thead>
        <tr className="border-b-2 border-tinta">
          <th className="py-2">Código</th>
          <th>Estado</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {ejemplares.map((item) => (
          <tr key={item.idEjemplar} className="border-b border-tinta/20">
            <td className="py-2">{item.codigoInventario}</td>
            <td>
              <EstadoBadge estilo={badgeEjemplar[item.estado]} />
            </td>
            <td className="py-2 text-right">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={deshabilitado}
                onClick={() => onCambiarEstado(item)}
              >
                {item.estado === 'Inactivo' ? 'Activar' : 'Inactivar'}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
