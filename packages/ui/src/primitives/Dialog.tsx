import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { Surface } from '../Surface'
import { useFocusTrap } from './shared'

/**
 * Cáscara modal de `InputDialog` y `Alert`: scrim, superficie, `aria-modal`, foco atrapado y Escape.
 * El foco inicial cae en `[data-autofocus]` si existe y si no en el primer control. El scrim es de las pocas
 * opacidades sobre un rol que permite el DS. No cierra con click afuera: en el juego un click suelto no debe descartar datos.
 */
export function Dialog({
  role = 'dialog',
  labelledBy,
  describedBy,
  onEscape,
  className = 'w-[26rem]',
  children,
}: {
  role?: 'dialog' | 'alertdialog'
  labelledBy: string
  describedBy?: string
  onEscape: () => void
  className?: string
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  useFocusTrap(panel)

  useEffect(() => {
    const node = panel.current
    const target =
      node?.querySelector<HTMLElement>('[data-autofocus]') ??
      node?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled])',
      )
    target?.focus()
  }, [])

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    e.preventDefault()
    e.stopPropagation()
    onEscape()
  }

  return (
    <div
      data-adastra="Dialog"
      className="fixed inset-0 z-50 grid place-items-center bg-surface-sunken/60 p-6"
    >
      <Surface
        ref={panel}
        elevated
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
        className={`flex max-h-full flex-col gap-4 overflow-y-auto p-6 ${className}`}
      >
        {children}
      </Surface>
    </div>
  )
}
