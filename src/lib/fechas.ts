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

/** Relativo corto en español («hace 5 min», «hace 2 h», «hace 3 d»). */
export function haceCuanto(iso: string, ahora = Date.now()) {
  const normalizada = conZona.test(iso) ? iso : `${iso}Z`
  const fecha = new Date(normalizada)
  if (Number.isNaN(fecha.getTime())) return iso
  const seg = Math.max(0, Math.floor((ahora - fecha.getTime()) / 1000))
  if (seg < 60) return 'hace un momento'
  const min = Math.floor(seg / 60)
  if (min < 60) return min === 1 ? 'hace 1 min' : `hace ${min} min`
  const horas = Math.floor(min / 60)
  if (horas < 24) return horas === 1 ? 'hace 1 h' : `hace ${horas} h`
  const dias = Math.floor(horas / 24)
  if (dias < 30) return dias === 1 ? 'hace 1 d' : `hace ${dias} d`
  return formatearFecha(iso)
}
