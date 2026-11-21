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

/** Minúsculas y sin tildes («Ciencia» y «ciéncia» → «ciencia»). La ñ se conserva. */
export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/(?!̃)[̀-ͯ]/g, '')
    .normalize('NFC')
}

/** Palabras que no dicen qué se busca: se quitan antes de comparar con las categorías. */
const PALABRAS_VACIAS = new Set([
  'que',
  'cual',
  'cuales',
  'cuantos',
  'cuantas',
  'libro',
  'libros',
  'titulo',
  'titulos',
  'ejemplar',
  'ejemplares',
  'copias',
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'un',
  'una',
  'unos',
  'unas',
  'sobre',
  'en',
  'y',
  'o',
  'a',
  'al',
  'hay',
  'tienes',
  'tienen',
  'tiene',
  'existe',
  'existen',
  'queda',
  'quedan',
  'disponible',
  'disponibles',
  'busco',
  'buscar',
  'busca',
  'buscame',
  'quiero',
  'quisiera',
  'necesito',
  'me',
  'mi',
  'algun',
  'alguno',
  'alguna',
  'algo',
  'categoria',
  'genero',
  'tema',
  'catalogo',
  'hola',
  'oye',
  'luxia',
  'por',
  'favor',
  'porfa',
  'muestrame',
  'dime',
  'ver',
  'puedes',
  'podrias',
  'para',
  'leer',
])

/**
 * Si, sin palabras vacías, la pregunta es el nombre de una categoría existente, la devuelve
 * (con su escritura original); si no, null y se busca por texto.
 * «¿Qué libros de ciencia hay disponibles?» y «Ciencia» → «Ciencia».
 */
export function categoriaDe(pregunta: string, categorias: string[]) {
  const resto = sinPalabrasVacias(pregunta)
  if (!resto) return null
  return (
    categorias.find((categoria) => sinPalabrasVacias(categoria) === resto) ??
    null
  )
}

/** Texto normalizado, sin signos ni palabras vacías («Historia del arte» → «historia arte»). */
function sinPalabrasVacias(texto: string) {
  return normalizar(texto)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((palabra) => palabra && !PALABRAS_VACIAS.has(palabra))
    .join(' ')
}
