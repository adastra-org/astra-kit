import { useEffect, useRef, type ReactNode, type RefObject } from 'react'

/** Íconos por clave (`icon` en los datos de Lua). La app decide qué lucide-react incluye: no se importa el set entero. */
export type IconMap = Record<string, ReactNode>

/** Tecla pulsada contra una configurada (`KeyboardEvent.key`, sin distinguir mayúsculas). */
export const sameKey = (event: KeyboardEvent, key: string): boolean =>
  event.key.toLowerCase() === key.toLowerCase()

/**
 * Atrapa Tab dentro de un diálogo modal y devuelve el foco al elemento previo al cerrarse.
 * El primer foco lo decide el componente (`autoFocus` o un ref).
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const node = ref.current
    if (!node) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const items = [
        ...node.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ]
      const first = items[0]
      const last = items[items.length - 1]
      if (!first || !last) return
      const active = document.activeElement
      if (e.shiftKey && (active === first || !node.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !node.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('keydown', onKey)
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [ref])
}

/** Último valor sin re-suscribir efectos (para handlers de teclado y timers). */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
