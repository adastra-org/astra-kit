import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { control } from './Button'
import { cx } from './cx'

const variants = {
  secondary:
    'border border-border bg-surface-overlay text-ink hover:border-border-strong',
  ghost: 'text-ink-muted hover:bg-surface-overlay hover:text-ink',
} as const

const sizes = { sm: 'size-8', md: 'size-10' } as const

/** Botón solo ícono. `label` es obligatorio: es el nombre accesible y el tooltip. Los íconos son de lucide-react. */
export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string
  icon: ReactNode
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}) {
  return (
    <button
      type={type}
      data-adastra="IconButton"
      aria-label={label}
      title={label}
      className={cx(
        control,
        'rounded-md',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="grid place-items-center">
        {icon}
      </span>
    </button>
  )
}
