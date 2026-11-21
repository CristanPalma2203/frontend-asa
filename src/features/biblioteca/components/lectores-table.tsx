import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FilasFantasma } from '@/components/ui/filas-fantasma'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EstadoBadge } from '@/features/biblioteca/components/estado-badge'
import { badgeLector } from '@/features/biblioteca/components/estado-badge.styles'
import type { Lector, LectorLista } from '@/features/biblioteca/types/api'
import { cn } from '@/lib/utils'

export function LectoresTable({
  lectores,
  cargando = false,
  abiertoId,
  detalle,
  cargandoDetalle,
  onEdit,
  onToggle,
}: {
  lectores: LectorLista[]
  cargando?: boolean
  abiertoId: number | null
  detalle: Lector | undefined
  cargandoDetalle: boolean
  onEdit: (lector: LectorLista) => void
  onToggle: (lector: LectorLista) => void
}) {
  return (
    <Table accionesFijas className="min-w-[44rem]">
      <TableHeader>
        <TableRow>
          <TableHead>Identificador</TableHead>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cargando ? <FilasFantasma columnas={4} /> : null}
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
      </TableBody>
    </Table>
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
      <TableRow className={cn(abierto && 'bg-lima-wash/60')}>
        <TableCell className="text-texto-2 font-mono text-[13px]">
          {lector.identificador}
        </TableCell>
        <TableCell className="text-tinta font-semibold">
          {lector.nombre}
        </TableCell>
        <TableCell className="text-texto-3">{lector.correo}</TableCell>
        <TableCell>
          <EstadoBadge estilo={badgeLector[lector.estado]} />
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-expanded={abierto}
              onClick={onToggle}
            >
              Reservas
              <ChevronDown
                aria-hidden
                className={cn('transition-transform', abierto && 'rotate-180')}
              />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {abierto ? (
        <TableRow className="bg-hueso-claro hover:bg-hueso-claro">
          <TableCell colSpan={5} className="text-texto-2 text-sm">
            {cargando ? 'Cargando…' : null}
            {detalle ? (
              <span className="inline-flex items-center gap-2">
                Reservas activas:
                <span className="text-tinta font-mono font-semibold">
                  {detalle.reservasActivas}
                </span>
              </span>
            ) : null}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
