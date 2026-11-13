import type { ButtonHTMLAttributes } from 'react'
import { control } from './Button'
import { cx } from './cx'

/**
 * Pill mono para filtros, tags y tabs. `selected` mapea a `aria-pressed`, o a `aria-selected` si es `role="tab"`.
 * El seleccionado cambia de relleno y de texto: nunca solo de color.
 */
export function Chip({
  selected = false,
  role,
  type = 'button',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  const aria =
    role === 'tab'
      ? { 'aria-selected': selected }
      : { 'aria-pressed': selected }
  return (
    <button
      type={type}
      role={role}
      data-adastra="Chip"
      {...aria}
      className={cx(
        control,
        'h-7 rounded-sm border px-2.5 text-data',
        selected
          ? 'border-accent-fill bg-accent-fill text-on-accent'
          : 'border-border bg-surface-overlay text-ink hover:border-border-strong',
        className,
      )}
      {...rest}
    />
  )
}
