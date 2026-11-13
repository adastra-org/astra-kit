import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchNui } from './fetch'
import type { NuiMessage } from './events'

/**
 * Escucha `{ action, data }` que manda Lua. El handler se lee del último render: no hace falta memoizarlo
 * y la suscripción a `window` se hace una sola vez por `action`.
 */
export function useNuiEvent<T = unknown>(
  action: string,
  handler: (data: T) => void,
): void {
  const saved = useRef(handler)
  useEffect(() => {
    saved.current = handler
  }, [handler])

  useEffect(() => {
    const onMessage = (event: MessageEvent<NuiMessage<string, T>>) => {
      const msg = event.data
      if (msg && typeof msg === 'object' && msg.action === action)
        saved.current(msg.data as T)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [action])
}

export interface NuiVisibilityOptions {
  /** Acción Lua que muestra la UI. Default `show`. */
  showAction?: string
  /** Acción Lua que la oculta. Default `hide`. */
  hideAction?: string
  /** Callback Lua que se llama al cerrar desde la UI. Default `close`. */
  closeEvent?: string
  /** Visible al montar. Default `false`: Lua manda `show`. */
  initial?: boolean
  /** Escape cierra. Default `true`. */
  escape?: boolean
}

export interface NuiVisibility {
  visible: boolean
  show: () => void
  hide: () => void
  /** Oculta y avisa a Lua (`fetchNui(closeEvent)`) para que suelte el foco (`SetNuiFocus(false, false)`). */
  close: () => void
}

/** Visibilidad de la NUI: `show` / `hide` desde Lua y Escape -> `fetchNui('close')`. */
export function useNuiVisibility({
  showAction = 'show',
  hideAction = 'hide',
  closeEvent = 'close',
  initial = false,
  escape = true,
}: NuiVisibilityOptions = {}): NuiVisibility {
  const [visible, setVisible] = useState(initial)

  const show = useCallback(() => setVisible(true), [])
  const hide = useCallback(() => setVisible(false), [])
  const close = useCallback(() => {
    setVisible(false)
    fetchNui(closeEvent).catch((error) =>
      console.error(`[nui] ${closeEvent} falló`, error),
    )
  }, [closeEvent])

  useNuiEvent(showAction, show)
  useNuiEvent(hideAction, hide)

  useEffect(() => {
    if (!escape || !visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [escape, visible, close])

  return { visible, show, hide, close }
}
