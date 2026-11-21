import type { ReactNode } from 'react'

export function Campo({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-texto-2 text-[13px] font-semibold">{label}</span>
      {children}
      {error ? (
        <span className="text-rojo-800 text-[13px] font-medium">{error}</span>
      ) : null}
    </label>
  )
}
