import { getParentResourceName, isEnvBrowser } from './env'

export class NuiError extends Error {
  readonly event: string
  readonly status: number
  constructor(event: string, status: number) {
    super(`NUI callback "${event}" respondió ${status}`)
    this.name = 'NuiError'
    this.event = event
    this.status = status
  }
}

type MockHandler = (data: unknown) => unknown
const mocks = new Map<string, MockHandler>()

/**
 * Registra la respuesta de un callback para correr la UI en el navegador (sin Lua).
 * Solo se usa cuando `isEnvBrowser()`; dentro del juego se ignora. Devuelve la función para quitarlo.
 */
export function mockNui<T = unknown, D = unknown>(
  event: string,
  handler: T | ((data: D) => T | Promise<T>),
): () => void {
  mocks.set(
    event,
    typeof handler === 'function' ? (handler as MockHandler) : () => handler,
  )
  return () => void mocks.delete(event)
}

/** Quita todos los mocks (para tests). */
export function clearNuiMocks(): void {
  mocks.clear()
}

/**
 * Llama a un `RegisterNUICallback(event, ...)` del lado Lua: POST a `https://<resource>/<event>` con `data` en JSON.
 * Resuelve con lo que Lua pasó a `cb(...)`. En el navegador resuelve con el mock registrado (`mockNui`) o `undefined`.
 */
export async function fetchNui<T = unknown>(
  event: string,
  data?: unknown,
): Promise<T> {
  if (isEnvBrowser()) {
    const mock = mocks.get(event)
    if (!mock) {
      console.debug(`[nui] ${event} (sin mock en el navegador)`, data)
      return undefined as T
    }
    return (await mock(data)) as T
  }

  const res = await fetch(`https://${getParentResourceName()}/${event}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data ?? {}),
  })
  if (!res.ok) throw new NuiError(event, res.status)
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}
