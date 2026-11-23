import { useCallback, useState } from 'react'

export const MAX_TAMANO_PAGINA = 50

function pixeles(estilo: CSSStyleDeclaration, variable: string) {
  return Number.parseFloat(estilo.getPropertyValue(variable))
}

function columnasEn(contenedor: HTMLElement) {
  const estilo = getComputedStyle(contenedor)
  const ancho = contenedor.clientWidth
  const tarjeta = pixeles(estilo, '--ancho-tarjeta')
  const hueco = pixeles(estilo, '--hueco')
  if (!ancho || !tarjeta || Number.isNaN(hueco)) return null
  return columnasPara(ancho, tarjeta, hueco)
}

export function columnasPara(ancho: number, tarjeta: number, hueco: number) {
  return Math.max(1, Math.floor((ancho + hueco) / (tarjeta + hueco)))
}

export function tamanoPaginaPorFilas(base: number, columnas: number | null) {
  if (!columnas) return base
  const filas = Math.ceil(base / columnas)
  const completo = filas * columnas
  return completo <= MAX_TAMANO_PAGINA
    ? completo
    : Math.floor(MAX_TAMANO_PAGINA / columnas) * columnas
}

export function useColumnasCatalogo() {
  const [medicion, setMedicion] = useState<{
    columnas: number | null
  } | null>(null)

  const medirContenedor = useCallback((contenedor: HTMLElement | null) => {
    if (!contenedor) return
    const medir = () => {
      const columnas = columnasEn(contenedor)
      setMedicion((previa) =>
        previa?.columnas === columnas ? previa : { columnas },
      )
    }
    medir()
    if (typeof ResizeObserver === 'undefined') return
    const observador = new ResizeObserver(medir)
    observador.observe(contenedor)
    return () => observador.disconnect()
  }, [])

  return {
    medirContenedor,
    medido: medicion !== null,
    columnas: medicion?.columnas ?? null,
  }
}
