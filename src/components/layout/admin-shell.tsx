import { Outlet } from '@tanstack/react-router'

export function AdminShell() {
  return (
    <div className="min-w-0 px-4 pb-12 md:px-6 xl:px-8">
      <Outlet />
    </div>
  )
}
