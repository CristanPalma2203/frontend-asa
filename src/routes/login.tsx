import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { redirect, useNavigate } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { iniciarSesion } from '@/features/auth/api'
import { isSessionActive, useAuthStore } from '@/features/auth/store'
import { mensajeDeError } from '@/features/biblioteca/errores'
import { loginSchema, type LoginForm } from '@/features/biblioteca/schemas'
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

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
      <Card className="p-6">
        <h1 className="font-display text-3xl text-verde">Iniciar sesión</h1>
        <form className="mt-4 flex flex-col gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1">
            <Label htmlFor="correo">Correo</Label>
            <Input
              id="correo"
              type="email"
              autoComplete="username"
              aria-invalid={form.formState.errors.correo ? true : undefined}
              {...form.register('correo')}
            />
            {form.formState.errors.correo ? (
              <p className="text-sm text-destructive">{form.formState.errors.correo.message}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          {form.formState.errors.root ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Entrar
          </Button>
        </form>
      </Card>
      {import.meta.env.DEV ? (
        <Card className="p-4">
          <p className="font-display text-lg text-verde">Cuentas demo</p>
          <p className="mt-1 text-sm">Solo rellena el correo. La contraseña no está en la app.</p>
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
        </Card>
      ) : null}
    </main>
  )
}
