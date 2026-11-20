import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url({
    error: 'VITE_API_URL es obligatoria y tiene que ser una URL válida',
  }),
})

const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
})

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n')

  throw new Error(
    `Faltan o son inválidas las variables de entorno.\n${details}\nRevisa .env.example y define VITE_API_URL.`,
  )
}

export const env = parsed.data
