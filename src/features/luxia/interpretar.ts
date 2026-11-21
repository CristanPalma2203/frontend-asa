// LuxIA solo consulta: interpreta la pregunta con reglas sencillas (no hay modelo de lenguaje)
// y la convierte en una búsqueda de la API de libros.

export type Intencion = {
  /** `reservar`: piden reservar; LuxIA no lo hace y remite al botón de la ficha. */
  tipo: 'buscar' | 'reservar' | 'vacia'
  /** Texto que se manda como `search` (título, autor o ISBN). */
  consulta: string
}

// Sin \b: con acentos (resérvame) \b de JS no ve límite de palabra fiable.
const pideReservar = /(^|[^a-záéíóúñ])(res[eé]rv|ap[aá]rt)/i

/** Frases de relleno al inicio de la pregunta; se quitan en bucle hasta que no queda ninguna. */
const prefijos: RegExp[] = [
  /^(hola|oye|buenas)[,!\s]+/i,
  /^luxia[,:!\s]+/i,
  /^(por favor|porfa)[,\s]+/i,
  /^(yo\s+)?(quiero|quisiera|necesito|me gustar[ií]a|puedes|podr[ií]as|me ayudas a)\s+/i,
  /^(c[oó]mo|d[oó]nde)\s+(puedo\s+|se\s+)?(reservo|reservar|reserva|aparto|apartar)\s+/i,
  /^(reservar|apartar|res[eé]rva|ap[aá]rta)(me|lo|la)?\s+/i,
  /^(busca(r|me)?|encuentra|mu[eé]strame|dime)\s+/i,
  /^(si\s+)?(tienes|tienen|hay|existe|existen|queda|quedan)\s+/i,
  /^(cu[aá]nt[oa]s)\s+(ejemplares|copias|libros)\s+(quedan|hay|tienen|tienes)\s+/i,
  /^(cu[aá]nt[oa]s)\s+(ejemplares|copias|libros)\s+/i,
  /^(alg[uú]n|alguna|algo)\s+/i,
  /^(ejemplares|copias)\s+/i,
  /^(libros?|t[ií]tulos?)\s+/i,
  /^(disponibles?)\s+/i,
  /^(de|del|sobre|por)\s+/i,
  /^(autor|autora|escritor|escritora)\s+/i,
  /^(un|una|el|la|los|las)\s+/i,
]

const sufijos: RegExp[] = [
  /\s+(por favor|porfa)$/i,
  /\s+(disponibles?|en (el )?cat[aá]logo)$/i,
]

export function interpretar(pregunta: string): Intencion {
  const tipoBase = pideReservar.test(pregunta) ? 'reservar' : 'buscar'
  let texto = pregunta
    .trim()
    .replace(/^[¿¡"'«“\s]+/, '')
    .replace(/[?!."'»”\s]+$/, '')

  let anterior = ''
  while (anterior !== texto) {
    anterior = texto
    // El espacio final deja que un prefijo cuadre también con la última palabra («hay libros»).
    for (const prefijo of prefijos)
      texto = `${texto} `.replace(prefijo, '').trim()
    for (const sufijo of sufijos) texto = texto.replace(sufijo, '')
    texto = texto.replace(/^["'«“]+|["'»”]+$/g, '').trim()
  }

  if (!texto)
    return {
      tipo: tipoBase === 'reservar' ? 'reservar' : 'vacia',
      consulta: '',
    }
  return { tipo: tipoBase, consulta: texto }
}
