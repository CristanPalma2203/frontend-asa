import { Outlet } from '@tanstack/react-router'

/** Contenedor de /admin. La navegación (sidebar «Gestión» y migas) la pinta el AppShell. */
export function AdminShell() {
  return (
    <div className="min-w-0 px-4 pb-12 md:px-6 xl:px-8">
      <Outlet />
    </div>
  )
}
