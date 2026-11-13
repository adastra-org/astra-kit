import { useId, type ReactNode } from 'react'
import { cx } from './cx'
import { Glass, type GlassMode } from './Glass'
import { Surface, type SurfaceLevel } from './Surface'

export interface PanelProps {
  title?: ReactNode
  /** Controles a la derecha del título (IconButton, Chip…). */
  actions?: ReactNode
  /** Skin glass, opt-in. `false` (default) = sólido. */
  glass?: false | GlassMode
  /** Solo con `glass="backdrop"`. */
  refraction?: boolean | number
  /** Nivel de la skin sólida. */
  level?: SurfaceLevel
  className?: string
  children?: ReactNode
}

/** Panel con encabezado (título + acciones) sobre `Surface` (default) o `Glass` (opt-in). */
export function Panel({
  title,
  actions,
  glass = false,
  refraction,
  level = 'raised',
  className,
  children,
}: PanelProps) {
  const titleId = useId()
  const body = (
    <>
      {(title || actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title && (
            <h2 id={titleId} className="text-h4 text-ink">
              {title}
            </h2>
          )}
          {actions}
        </header>
      )}
      {children}
    </>
  )
  const common = {
    role: 'region' as const,
    'aria-labelledby': title ? titleId : undefined,
    className: cx('p-4', className),
  }

  if (glass === 'backdrop')
    return (
      <Glass mode="backdrop" refraction={refraction} {...common}>
        {body}
      </Glass>
    )
  if (glass === 'fake')
    return (
      <Glass mode="fake" {...common}>
        {body}
      </Glass>
    )
  return (
    <Surface level={level} elevated {...common}>
      {body}
    </Surface>
  )
}
