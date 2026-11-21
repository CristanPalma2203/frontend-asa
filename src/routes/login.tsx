import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { redirect, useNavigate } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { iniciarSesion } from '@/features/auth/api'
import { LoginFranjaMovil, LoginPanel } from '@/features/auth/components/login-panel'
import { PasswordInput } from '@/features/auth/components/password-input'
import { isSessionActive, useAuthStore } from '@/features/auth/store'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { loginSchema, type LoginForm } from '@/features/biblioteca/schemas/login.schema'
import { ApiError } from '@/lib/api/client'

export const Route = createFileRoute('/login')({
  staticData: { title: 'Iniciar sesión · ASA Biblioteca' },
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    if (typeof search.redirect !== 'string' || !search.redirect.startsWith('/')) return {}
    if (search.redirect.startsWith('//')) return {}
    return { redirect: search.redirect }
  },
  beforeLoad: ({ search }) => {
    const state = useAuthStore.getState()
    if (!isSessionActive(state)) return
    if (search.redirect) throw redirect({ href: search.redirect })
    throw redirect({ to: state.rol === 'Admin' ? '/admin' : '/catalogo' })
  },
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: '', password: '' },
  })

  async function onSubmit(values: LoginForm) {
    form.clearErrors('root')
    try {
      await iniciarSesion(values)
      const rol = useAuthStore.getState().rol
      if (search.redirect) {
        await navigate({ href: search.redirect })
        return
      }
      await navigate({ to: rol === 'Admin' ? '/admin' : '/catalogo' })
    } catch (error) {
      const code = error instanceof ApiError ? error.code : undefined
      form.setError('root', {
        message: mensajeDeError(code, 'No se pudo iniciar sesión.'),
      })
    }
  }

  const errores = form.formState.errors

  return (
    <div className="bg-background grid min-h-svh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <LoginPanel />
      <div className="flex flex-col">
        <LoginFranjaMovil />
        <main className="-mt-10 flex flex-1 flex-col items-center justify-center px-5 pb-10 lg:mt-0 lg:px-10 lg:py-12">
          <div className="bg-card border-linea shadow-flotante w-full max-w-[440px] rounded-[28px] border p-7 sm:p-9 lg:shadow-card">
            <p className="eyebrow">Acceso</p>
            <h1 className="mt-2 text-[30px] leading-tight">
              Iniciar <span className="titulo-serif">sesión</span>
            </h1>
            <p className="text-texto-3 mt-2 text-[15px]">
              Entra con el correo de tu cuenta de la biblioteca.
            </p>

            <form
              className="mt-7 flex flex-col gap-5"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="correo" className="text-texto-2 text-[13px] font-semibold">
                  Correo
                </Label>
                <Input
                  id="correo"
                  type="email"
                  autoComplete="username"
                  placeholder="nombre@correo.com"
                  aria-invalid={errores.correo ? true : undefined}
                  aria-describedby={errores.correo ? 'correo-error' : undefined}
                  {...form.register('correo')}
                />
                {errores.correo ? (
                  <p id="correo-error" className="text-rojo-800 text-[13px] font-medium">
                    {errores.correo.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-texto-2 text-[13px] font-semibold">
                  Contraseña
                </Label>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  aria-invalid={errores.password ? true : undefined}
                  aria-describedby={errores.password ? 'password-error' : undefined}
                  {...form.register('password')}
                />
                {errores.password ? (
                  <p id="password-error" className="text-rojo-800 text-[13px] font-medium">
                    {errores.password.message}
                  </p>
                ) : null}
              </div>
              {errores.root ? (
                <p
                  role="alert"
                  className="border-rojo-600/20 bg-rojo-50 text-rojo-800 rounded-xl border px-4 py-3 text-sm font-medium"
                >
                  {errores.root.message}
                </p>
              ) : null}
              <Button type="submit" size="lg" className="mt-1 w-full" disabled={form.formState.isSubmitting}>
                Entrar
              </Button>
            </form>

            {import.meta.env.DEV ? (
              <div className="border-linea mt-7 border-t pt-5">
                <p className="text-texto-2 text-[13px] font-semibold">Cuentas demo</p>
                <p className="text-texto-3 mt-1 text-[13px]">
                  Solo rellena el correo. La contraseña no está en la app.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('correo', 'admin@demo.local')}
                  >
                    admin@demo.local
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('correo', 'ana.lopez@demo.local')}
                  >
                    ana.lopez@demo.local
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
