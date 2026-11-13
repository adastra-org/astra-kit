import type { HTMLAttributes, Ref } from 'react'
import { cx } from './cx'

const levels = {
  /** Misma capa que el canvas (`surface`). */
  base: 'bg-surface',
  raised: 'bg-surface-raised',
  overlay: 'bg-surface-overlay',
  sunken: 'bg-surface-sunken',
} as const

export type SurfaceLevel = keyof typeof levels

/**
 * Superficie sólida sobre los roles del DS. Es la skin por defecto: glass es opt-in (`Glass`, o `glass` en `Panel`).
 * Borde completo en `border`, nunca un solo lado.
 */
export function Surface({
  level = 'raised',
  elevated = false,
  className,
  ref,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>
  level?: SurfaceLevel
  /** Sombra de card flotante (`shadow-card`). */
  elevated?: boolean
}) {
  return (
    <div
      ref={ref}
      data-adastra="Surface"
      className={cx(
        'rounded-lg border border-border text-ink',
        levels[level],
        elevated && 'shadow-card',
        className,
      )}
      {...rest}
    />
  )
}
