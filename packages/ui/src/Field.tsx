import { useId, type InputHTMLAttributes } from 'react'
import { cx } from './cx'

/**
 * Input con su `label` (obligatorio, house: todo campo tiene label). `hint` explica por qué se pide el dato;
 * `error` pone `aria-invalid`, borde completo en `danger` y el mensaje junto al campo (con ícono de texto, no solo color).
 */
export function Field({
  label,
  hint,
  error,
  id,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> & {
  label: string
  hint?: string
  error?: string
}) {
  const auto = useId()
  const inputId = id ?? auto
  const hintId = `${inputId}-hint`
  const errorId = `${inputId}-error`
  const showHint = Boolean(hint) && !error
  const describedBy = error ? errorId : showHint ? hintId : undefined
  return (
    <div
      data-adastra="Field"
      className={cx('flex flex-col gap-1.5', className)}
    >
      <label htmlFor={inputId} className="text-label text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          'h-10 w-full rounded-md border bg-surface-sunken px-3 text-body text-ink transition-colors duration-(--duration-fast) placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
          error ? 'border-danger' : 'border-border-strong',
        )}
        {...rest}
      />
      {showHint && (
        <p id={hintId} className="text-caption text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption text-danger">
          Error: {error}
        </p>
      )}
    </div>
  )
}
