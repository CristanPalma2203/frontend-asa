const conZona = /(?:Z|[+-]\d{2}:?\d{2})$/i

const formato = new Intl.DateTimeFormat('es-SV', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/El_Salvador',
})

export function formatearFecha(iso: string) {
  const normalizada = conZona.test(iso) ? iso : `${iso}Z`
  const fecha = new Date(normalizada)
  if (Number.isNaN(fecha.getTime())) return iso
  return formato.format(fecha)
}
