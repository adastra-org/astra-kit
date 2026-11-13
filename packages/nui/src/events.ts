import { isEnvBrowser } from './env'

/** Forma del mensaje que manda Lua con `SendNUIMessage({ action = '...', data = ... })`. */
export interface NuiMessage<A extends string = string, D = unknown> {
  action: A
  data?: D
}

/** Despacha un mensaje NUI en `window`, como si viniera de Lua. */
export function emitNui<D = unknown>(action: string, data?: D): void {
  window.dispatchEvent(
    new MessageEvent<NuiMessage<string, D>>('message', {
      data: { action, data },
    }),
  )
}

/**
 * Simula mensajes de Lua para desarrollar en el navegador. No hace nada dentro del juego.
 * Devuelve una función que cancela los que todavía no se enviaron.
 */
export function debugData<D = unknown>(
  events: NuiMessage<string, D>[],
  delay = 1000,
): () => void {
  if (!isEnvBrowser()) return () => {}
  const timers = events.map((e) =>
    setTimeout(() => emitNui(e.action, e.data), delay),
  )
  return () => timers.forEach(clearTimeout)
}
