import { Button } from '@/components/ui/button'

export function Paginacion({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (page: number) => void
}) {
  const total = Math.max(totalPages, 1)
  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3"
    >
      <p className="text-texto-3 text-sm">
        Página {page} de {total}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= total}
          onClick={() => onPage(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  )
}
