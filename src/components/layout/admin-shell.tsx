import { Link, Outlet, useRouterState } from '@tanstack/react-router'

const links = [
  { to: '/admin/libros', label: 'Libros' },
  { to: '/admin/lectores', label: 'Lectores' },
] as const

export function AdminShell() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <div className="flex min-h-[calc(100svh-8rem)] flex-col md:flex-row">
      <aside className="flex gap-2 border-b-2 border-tinta bg-verde p-3 text-crema md:w-52 md:flex-col md:border-r-2 md:border-b-0">
        <p className="font-display hidden text-lg md:block">Admin</p>
        {links.map((link) => {
          const active = pathname === link.to || pathname.startsWith(`${link.to}/`)
          return (
            <Link
              key={link.to}
              to={link.to}
              search={{ page: 1, pageSize: 12 }}
              className={
                active
                  ? 'rounded-lg bg-lima px-3 py-2 text-sm font-semibold text-verde'
                  : 'rounded-lg px-3 py-2 text-sm hover:bg-crema/10'
              }
            >
              {link.label}
            </Link>
          )
        })}
      </aside>
      <div className="min-w-0 flex-1 p-4">
        <Outlet />
      </div>
    </div>
  )
}
