import {
  normalizeNotify,
  type NotifyData,
  type NotifyNormalized,
} from '@adastrarp/nui'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Ancho fijo del toast: el contenido tiene medida conocida y el goo lo revela al estirarse. */
export const TOAST_WIDTH = 340
export const TOAST_GAP = 12
const CHARS_PER_LINE = 34

/**
 * Alto de la pill según el texto: título (1 línea) + descripción (1 a 2 líneas), mínimo 48. Es una estimación por
 * caracteres: la pill no mide el DOM porque el motor necesita la caja objetivo antes de pintar.
 */
export function toastHeight(
  n: Pick<NotifyNormalized, 'title' | 'description'>,
): number {
  const lines = Math.min(
    2,
    Math.max(1, Math.ceil(n.description.length / CHARS_PER_LINE)),
  )
  return Math.max(48, 24 + (n.title ? 20 : 0) + lines * 20)
}

export interface Notifier {
  items: NotifyNormalized[]
  /** Agrega (o reemplaza si el `id` ya existe). Devuelve el id. */
  notify: (data: NotifyData) => string
  dismiss: (id: string) => void
}

/** Estado de las notificaciones: cada una se cierra sola a los `duration` ms (0 = no se cierra). */
export function useNotifications(max = 5): Notifier {
  const [items, setItems] = useState<NotifyNormalized[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setItems((list) => list.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback(
    (data: NotifyData) => {
      const n = normalizeNotify(data)
      clearTimeout(timers.current.get(n.id))
      timers.current.delete(n.id)
      if (n.duration > 0)
        timers.current.set(
          n.id,
          setTimeout(() => dismiss(n.id), n.duration),
        )
      setItems((list) => {
        const i = list.findIndex((x) => x.id === n.id)
        const next =
          i >= 0 ? list.map((x) => (x.id === n.id ? n : x)) : [...list, n]
        // Más de `max`: se van las más viejas.
        return next.slice(-max)
      })
      return n.id
    },
    [dismiss, max],
  )

  useEffect(() => {
    const t = timers.current
    return () => {
      t.forEach(clearTimeout)
      t.clear()
    }
  }, [])

  return { items, notify, dismiss }
}
