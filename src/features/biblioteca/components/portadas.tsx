import { useState } from 'react'

import { useLibro } from '@/features/biblioteca/hooks/use-libros'

// Portadas desde Open Library por ISBN. `?default=false` hace que responda 404 si no hay
// portada, y en ese caso muestro un respaldo SVG con el título.

function isbnLimpio(isbn: string) {
  return isbn.replace(/[^0-9Xx]/g, '')
}

/** Portada mediana para las tarjetas del catálogo. */
export function PortadaTarjeta({ isbn, titulo }: { isbn: string; titulo: string }) {
  const [fallo, setFallo] = useState(false)
  const limpio = isbnLimpio(isbn)

  if (fallo || limpio.length === 0) {
    return <PortadaTarjetaVacia titulo={titulo} />
  }

  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${limpio}-M.jpg?default=false`}
      alt=""
      className="h-36 w-24 shrink-0 rounded-xl border-2 border-tinta object-cover"
      onError={() => setFallo(true)}
    />
  )
}

function PortadaTarjetaVacia({ titulo }: { titulo: string }) {
  return (
    <svg
      viewBox="0 0 96 144"
      role="img"
      aria-label={titulo}
      className="h-36 w-24 shrink-0 rounded-xl border-2 border-tinta"
    >
      <rect width="96" height="144" fill="#1E3D2E" />
      <rect x="8" y="8" width="80" height="128" fill="#FEF8EC" stroke="#111111" strokeWidth="2" />
      <text
        x="48"
        y="72"
        textAnchor="middle"
        fill="#1E3D2E"
        fontFamily="Fredoka, sans-serif"
        fontSize="11"
      >
        {titulo.slice(0, 42)}
      </text>
    </svg>
  )
}

/** Portada grande de la ficha del libro. */
export function PortadaFicha({ isbn, titulo }: { isbn: string; titulo: string }) {
  const [fallo, setFallo] = useState(false)
  const limpio = isbnLimpio(isbn)
  if (fallo || limpio.length === 0) {
    return (
      <svg viewBox="0 0 160 240" role="img" aria-label={titulo} className="w-full rounded-2xl border-2 border-tinta shadow-cartoon">
        <rect width="160" height="240" fill="#1E3D2E" />
        <text x="80" y="120" textAnchor="middle" fill="#FEF8EC" fontFamily="Fredoka, sans-serif" fontSize="14">
          {titulo.slice(0, 48)}
        </text>
      </svg>
    )
  }
  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${limpio}-L.jpg?default=false`}
      alt=""
      className="w-full rounded-2xl border-2 border-tinta object-cover shadow-cartoon"
      onError={() => setFallo(true)}
    />
  )
}

/** Portada pequeña de una reserva. La reserva no trae ISBN, así que lo toma del detalle del libro. */
export function MiniPortada({ idLibro, titulo }: { idLibro: number; titulo: string }) {
  const libro = useLibro(idLibro)
  const [fallo, setFallo] = useState(false)
  const isbn = libro.data ? isbnLimpio(libro.data.isbn) : ''

  if (!isbn || fallo) {
    return (
      <svg viewBox="0 0 64 96" role="img" aria-label={titulo} className="h-24 w-16 shrink-0 rounded-xl border-2 border-tinta">
        <rect width="64" height="96" fill="#1E3D2E" />
        <text x="32" y="50" textAnchor="middle" fill="#FEF8EC" fontFamily="Fredoka, sans-serif" fontSize="8">
          {titulo.slice(0, 18)}
        </text>
      </svg>
    )
  }

  return (
    <img
      src={`https://covers.openlibrary.org/b/isbn/${isbn}-S.jpg?default=false`}
      alt=""
      className="h-24 w-16 shrink-0 rounded-xl border-2 border-tinta object-cover"
      onError={() => setFallo(true)}
    />
  )
}
