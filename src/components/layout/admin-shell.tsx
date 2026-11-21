import { Outlet } from '@tanstack/react-router'

/** Contenedor de /admin. La navegación (sidebar «Gestión» y migas) la pinta el AppShell. */
export function AdminShell() {
  return (
    <div className="min-w-0 px-5 pb-12 lg:px-14">
      <Outlet />
    </div>
  )
}
