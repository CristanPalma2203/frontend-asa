import { env } from '@/config/env'
import { useAuthStore } from '@/features/auth/store'
import { olvidarLuxia } from '@/features/luxia/reset'

export type ApiFieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly title: string
  readonly detail: string | undefined
  readonly errors: ApiFieldErrors | undefined

  constructor(problem: {
    status: number
    code?: string
    title?: string
    detail?: string
    errors?: ApiFieldErrors
  }) {
    super(problem.detail ?? problem.title ?? `Error ${problem.status}`)
    this.name = 'ApiError'
    this.status = problem.status
    this.code = problem.code
    this.title = problem.title ?? `Error ${problem.status}`
    this.detail = problem.detail
    this.errors = problem.errors
  }
}

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, headers: incomingHeaders, ...init } = options
  const token = readActiveToken()
  const headers = new Headers(incomingHeaders)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(
    new URL(path, ensureTrailingSlash(env.VITE_API_URL)),
    {
      ...init,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  )

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      useAuthStore.getState().logout()
      olvidarLuxia()
      onUnauthorized?.()
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/problem+json')) {
      throw await problemError(response)
    }

    throw new ApiError({
      status: response.status,
      title: response.statusText || `Error ${response.status}`,
    })
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('json')) {
    return undefined as T
  }

  return (await response.json()) as T
}

function readActiveToken() {
  const { token, expiresAt } = useAuthStore.getState()
  if (!token) return null
  if (expiresAt != null && expiresAt <= Date.now()) {
    useAuthStore.getState().logout()
    olvidarLuxia()
    return null
  }
  return token
}

function ensureTrailingSlash(base: string) {
  return base.endsWith('/') ? base : `${base}/`
}

async function problemError(response: Response) {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  const problem = isRecord(payload) ? payload : {}

  return new ApiError({
    status:
      typeof problem.status === 'number' ? problem.status : response.status,
    code: typeof problem.code === 'string' ? problem.code : undefined,
    title:
      typeof problem.title === 'string' ? problem.title : response.statusText,
    detail: typeof problem.detail === 'string' ? problem.detail : undefined,
    errors: parseErrors(problem.errors),
  })
}

function parseErrors(value: unknown): ApiFieldErrors | undefined {
  if (!isRecord(value)) return undefined

  const errors: ApiFieldErrors = {}
  for (const [key, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      errors[key] = messages.filter(
        (message): message is string => typeof message === 'string',
      )
    } else if (typeof messages === 'string') {
      errors[key] = [messages]
    }
  }

  return errors
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
