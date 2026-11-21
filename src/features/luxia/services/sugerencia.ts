import { normalizarPregunta } from '@/features/luxia/interpretar'
import { textos } from '@/features/luxia/textos'
import type { ChatMsg } from '@/features/luxia/types/chat'

const sobreReservar = /res[eé]rv|ap[aá]rt/i

export function preguntasHechas(msgs: ChatMsg[], extra: string[] = []) {
  return new Set(
    [...msgs.filter((m) => m.role === 'user').map((m) => m.text), ...extra].map(
      normalizarPregunta,
    ),
  )
}

export function primeraNueva(candidatas: string[], hechas: Set<string>) {
  return candidatas.find(
    (c) => !sobreReservar.test(c) && !hechas.has(normalizarPregunta(c)),
  )
}

export function elegirSugerencia(
  msgs: ChatMsg[],
  ocupado: boolean,
): string | null {
  if (ocupado) return null
  const ultimo = msgs[msgs.length - 1]
  if (ultimo && ultimo.role !== 'assistant') return null
  if (!ultimo) return primeraNueva([...textos.chips], new Set()) ?? null
  if (!ultimo.sugerencia) return null
  return primeraNueva([ultimo.sugerencia], preguntasHechas(msgs)) ?? null
}

export type ContextoSugerencia =
  | { tipo: 'libro'; autor: string; categoria?: string }
  | { tipo: 'autor'; otroAutor?: string }
  | { tipo: 'nada' }

export function candidatasTras(ctx: ContextoSugerencia): string[] {
  switch (ctx.tipo) {
    case 'libro':
      return [
        ...(ctx.autor ? [`¿Hay más libros de ${ctx.autor}?`] : []),
        ...(ctx.categoria ? [`¿Qué más hay de ${ctx.categoria}?`] : []),
        '¿Qué libros similares hay?',
      ]
    case 'autor':
      return [
        ...(ctx.otroAutor ? [`¿Hay libros de ${ctx.otroAutor}?`] : []),
        '¿Qué libros hay disponibles?',
      ]
    case 'nada':
      return ['¿Qué libros hay disponibles?', 'Buscar por ISBN']
  }
}
