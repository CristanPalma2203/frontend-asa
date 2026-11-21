export function AlertaError({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null
  return (
    <p
      role="alert"
      className="border-rojo-600/20 bg-rojo-50 text-rojo-800 rounded-xl border px-4 py-3 text-sm font-medium"
    >
      {mensaje}
    </p>
  )
}
