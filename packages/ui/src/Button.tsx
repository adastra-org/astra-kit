import type { ButtonHTMLAttributes } from 'react'
import { cx } from './cx'

export const control =
  'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,transform] duration-(--duration-fast) ease-out-brand active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100'

const variants = {
  primary: 'bg-accent-fill text-on-accent hover:bg-accent-fill-hover',
  secondary:
    'border border-border bg-surface-overlay text-ink hover:border-border-strong',
  ghost: 'text-ink-muted hover:bg-surface-overlay hover:text-ink',
  danger:
    'border border-danger bg-danger-surface text-danger hover:brightness-110',
} as const

const sizes = {
  sm: 'h-8 gap-1.5 px-3 text-label',
  md: 'h-10 gap-2 px-4 text-label',
} as const

export type ButtonVariant = keyof typeof variants

/** Un primario por pantalla; `danger` va último. Los radios y colores salen de los roles del DS. */
export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: keyof typeof sizes
}) {
  return (
    <button
      type={type}
      data-adastra="Button"
      className={cx(
        control,
        'rounded-md',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  )
}
