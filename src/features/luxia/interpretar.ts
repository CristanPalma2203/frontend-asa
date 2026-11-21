export type Intencion = {
  tipo: 'buscar' | 'reservar' | 'vacia'
  consulta: string
}

const pideReservar = /(^|[^a-záéíóúñ])(res[eé]rv|ap[aá]rt)/i

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
  /^(m[aá]s|otros?|otras?)\s+/i,
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

export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/(?!̃)[̀-ͯ]/g, '')
    .normalize('NFC')
}

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
  'mas',
  'otro',
  'otros',
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

export function categoriaDe(pregunta: string, categorias: string[]) {
  const resto = sinPalabrasVacias(pregunta)
  if (!resto) return null
  return (
    categorias.find((categoria) => sinPalabrasVacias(categoria) === resto) ??
    null
  )
}

export function sinPalabrasVacias(texto: string) {
  return normalizar(texto)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((palabra) => palabra && !PALABRAS_VACIAS.has(palabra))
    .join(' ')
}

export function normalizarPregunta(texto: string) {
  return normalizar(texto)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
