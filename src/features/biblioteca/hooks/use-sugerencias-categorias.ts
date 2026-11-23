import { useId, useState, type FocusEvent, type KeyboardEvent } from 'react'

import {
  sugerirCategorias,
  useCategorias,
} from '@/features/biblioteca/hooks/use-categorias'
import type { Categoria } from '@/features/biblioteca/types/api'

export function useSugerenciasCategorias({
  texto,
  onElegir,
}: {
  texto: string
  onElegir: (categoria: Categoria) => void
}) {
  const categorias = useCategorias()
  const idLista = useId()
  const [cerrada, setCerrada] = useState(false)
  const [activa, setActiva] = useState(-1)
  const [textoPrevio, setTextoPrevio] = useState(texto)
  if (texto !== textoPrevio) {
    setTextoPrevio(texto)
    setCerrada(false)
    setActiva(-1)
  }

  const sugerencias = sugerirCategorias(categorias.data, texto)
  const abierta = !cerrada && sugerencias.length > 0
  const idOpcion = (indice: number) => `${idLista}-${indice}`

  function cerrar() {
    setCerrada(true)
    setActiva(-1)
  }

  function elegir(categoria: Categoria) {
    cerrar()
    onElegir(categoria)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (sugerencias.length === 0) return
      event.preventDefault()
      setCerrada(false)
      const paso = event.key === 'ArrowDown' ? 1 : -1
      setActiva((indice) =>
        abierta
          ? (indice + paso + sugerencias.length) % sugerencias.length
          : paso === 1
            ? 0
            : sugerencias.length - 1,
      )
      return
    }
    if (!abierta) return
    if (event.key === 'Escape') {
      event.preventDefault()
      cerrar()
      return
    }
    const elegida = sugerencias[activa]
    if (event.key === 'Enter' && elegida) {
      event.preventDefault()
      elegir(elegida)
    }
  }

  function onBlur(event: FocusEvent<HTMLInputElement>) {
    if (
      event.relatedTarget instanceof Node &&
      document.getElementById(idLista)?.contains(event.relatedTarget)
    )
      return
    cerrar()
  }

  return {
    categorias: categorias.data,
    propsEntrada: {
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-expanded': abierta,
      'aria-controls': idLista,
      'aria-activedescendant':
        abierta && activa >= 0 ? idOpcion(activa) : undefined,
      onKeyDown,
      onBlur,
    } as const,
    lista: {
      id: idLista,
      abierta,
      sugerencias,
      activa,
      idOpcion,
      onElegir: elegir,
      onActivar: setActiva,
    },
  }
}
