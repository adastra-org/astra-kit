import type { InputField } from '@adastrarp/nui'
import { Check, ChevronDown, Minus, Plus } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../cx'
import { fieldLabel, invalid, maskDate } from './fieldLogic'

/** Valor crudo de un campo mientras se edita: texto o, en checkbox, booleano. */
export type Raw = string | boolean

export interface ControlProps {
  field: InputField
  value: Raw
  error?: string
  onChange: (v: Raw) => void
}

// Springs del DS Faku: `snappy` para estados de control, `gentle` para lo que entra.
const SNAPPY = { type: 'spring', stiffness: 320, damping: 24, mass: 1 } as const
const GENTLE = { type: 'spring', stiffness: 120, damping: 14, mass: 1 } as const

const BOX =
  'h-10 w-full rounded-full border bg-surface-sunken px-4 text-body text-ink transition-colors duration-(--duration-fast) placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus motion-reduce:transition-none'

/** Descripción (si no hay error) o el error del campo, enlazado por `${id}-error`. */
export function FieldNote({
  id,
  description,
  error,
}: {
  id: string
  description?: string
  error?: string
}) {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-caption text-danger">
        Error: {error}
      </p>
    )
  }
  return description ? (
    <p className="text-caption text-ink-muted">{description}</p>
  ) : null
}

const border = (error?: string) =>
  error ? 'border-danger' : 'border-border-strong'

/* ---------- number ---------- */

/**
 * Número con stepper propio: [-] valor [+]. Sin las flechitas nativas (cada navegador las dibuja distinto). ↑ / ↓ suman y
 * restan `step`; los botones se deshabilitan en `min` / `max`.
 */
export function NumberField({
  field: f,
  value,
  error,
  onChange,
}: ControlProps) {
  const id = useId()
  const step = f.step ?? 1
  const n = Number(String(value).trim())
  const has = String(value).trim() !== '' && Number.isFinite(n)
  const clamp = (v: number) =>
    Math.min(f.max ?? Infinity, Math.max(f.min ?? -Infinity, v))
  const bump = (dir: 1 | -1) => {
    const base = has ? n : (f.min ?? 0) - (dir === 1 ? step : -step)
    // Redondeo al múltiplo de step para no arrastrar decimales de coma flotante.
    const next = clamp(Math.round((base + dir * step) / step) * step)
    onChange(String(next))
  }
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    bump(e.key === 'ArrowUp' ? 1 : -1)
  }
  const stepButton =
    'grid size-8 shrink-0 place-items-center rounded-full text-ink transition-colors duration-(--duration-fast) hover:bg-surface-overlay focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:text-ink-subtle disabled:hover:bg-transparent motion-reduce:transition-none'
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-ink">
        {fieldLabel(f)}
      </label>
      <div
        className={cx(
          'flex h-10 items-center gap-1 rounded-full border bg-surface-sunken px-1',
          border(error),
        )}
      >
        <motion.button
          type="button"
          aria-label="Restar"
          tabIndex={-1}
          disabled={has && f.min !== undefined && n <= f.min}
          onClick={() => bump(-1)}
          whileTap={{ scale: 0.85 }}
          transition={SNAPPY}
          className={stepButton}
        >
          <Minus size={16} aria-hidden />
        </motion.button>
        <input
          id={id}
          name={f.id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={String(value)}
          placeholder={f.placeholder}
          {...invalid(id, error)}
          onKeyDown={onKeyDown}
          onChange={(e) => onChange(e.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-center text-body text-ink tabular-nums placeholder:text-ink-subtle focus-visible:outline-none"
        />
        <motion.button
          type="button"
          aria-label="Sumar"
          tabIndex={-1}
          disabled={has && f.max !== undefined && n >= f.max}
          onClick={() => bump(1)}
          whileTap={{ scale: 0.85 }}
          transition={SNAPPY}
          className={stepButton}
        >
          <Plus size={16} aria-hidden />
        </motion.button>
      </div>
      <FieldNote id={id} description={f.description} error={error} />
    </div>
  )
}

/* ---------- date ---------- */

/** Fecha en `dd/mm/aaaa` (formato local). A Lua sigue yendo `YYYY-MM-DD`. */
export function DateField({ field: f, value, error, onChange }: ControlProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-ink">
        {fieldLabel(f)}
      </label>
      <input
        id={id}
        name={f.id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={f.placeholder ?? 'dd/mm/aaaa'}
        value={String(value)}
        {...invalid(id, error)}
        onChange={(e) => onChange(maskDate(e.target.value))}
        className={cx(BOX, 'tabular-nums', border(error))}
      />
      <FieldNote id={id} description={f.description} error={error} />
    </div>
  )
}

/* ---------- select ---------- */

/**
 * Select propio (combobox + listbox): la lista se abre debajo, dentro del flujo del diálogo (no la recorta el scroll),
 * con spring. El foco queda en el disparador y `aria-activedescendant` marca la opción. ↑ ↓ Inicio Fin mueven,
 * Enter / Espacio eligen, Escape cierra la lista sin cerrar el diálogo.
 */
export function SelectField({
  field: f,
  value,
  error,
  onChange,
}: ControlProps) {
  const id = useId()
  const listId = `${id}-list`
  const reduce = useReducedMotion()
  const options = f.options ?? []
  const [open, setOpen] = useState(false)
  const selected = options.findIndex((o) => o.value === value)
  const [active, setActive] = useState(Math.max(0, selected))
  const wrap = useRef<HTMLDivElement>(null)

  // Click afuera cierra.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const show = () => {
    setActive(Math.max(0, selected))
    setOpen(true)
  }
  const choose = (i: number) => {
    const o = options[i]
    if (!o) return
    onChange(o.value)
    setOpen(false)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1
    switch (e.key) {
      case 'ArrowDown':
        if (!open) show()
        else setActive((a) => Math.min(last, a + 1))
        break
      case 'ArrowUp':
        if (!open) show()
        else setActive((a) => Math.max(0, a - 1))
        break
      case 'Home':
        if (!open) return
        setActive(0)
        break
      case 'End':
        if (!open) return
        setActive(last)
        break
      case 'Enter':
      case ' ':
        if (open) choose(active)
        else show()
        break
      case 'Escape':
        if (!open) return
        setOpen(false)
        e.stopPropagation()
        break
      case 'Tab':
        setOpen(false)
        return
      default:
        return
    }
    e.preventDefault()
  }

  const current = options[selected]
  return (
    <div ref={wrap} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-ink">
        {fieldLabel(f)}
      </label>
      <button
        id={id}
        name={f.id}
        type="button"
        role="combobox"
        value={String(value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        {...invalid(id, error)}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={cx(
          BOX,
          'flex items-center justify-between gap-3 text-left',
          border(error),
        )}
      >
        <span className={current ? 'truncate' : 'truncate text-ink-subtle'}>
          {current?.label ?? f.placeholder ?? 'Elige una opción'}
        </span>
        <motion.span
          aria-hidden
          animate={{ rotate: open ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : SNAPPY}
          className="grid shrink-0 place-items-center text-ink-muted"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : GENTLE}
            className="overflow-hidden rounded-3xl border border-border bg-surface-sunken"
          >
            <ul
              id={listId}
              role="listbox"
              aria-label={f.label}
              className="flex flex-col gap-1 p-1.5"
            >
              {options.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === selected}
                  data-active={i === active || undefined}
                  onPointerEnter={() => setActive(i)}
                  // pointerdown: elige antes de que el click afuera cierre la lista.
                  onPointerDown={(e) => {
                    e.preventDefault()
                    choose(i)
                  }}
                  className="flex h-9 cursor-pointer items-center justify-between gap-3 rounded-full px-3 text-body text-ink data-active:bg-surface-overlay"
                >
                  <span className="truncate">{o.label}</span>
                  {i === selected && (
                    <Check size={16} aria-hidden className="text-accent" />
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <FieldNote id={id} description={f.description} error={error} />
    </div>
  )
}

/* ---------- checkbox ---------- */

/**
 * Checkbox propio sobre el input nativo (que sigue siendo el control accesible): caja redondeada que se llena y una
 * tilde que se dibuja con spring. Presionar la achica un poco.
 */
export function CheckboxField({
  field: f,
  value,
  error,
  onChange,
}: ControlProps) {
  const id = useId()
  const reduce = useReducedMotion()
  const on = value === true
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex w-fit cursor-pointer items-center gap-3 text-label text-ink"
      >
        <input
          id={id}
          name={f.id}
          type="checkbox"
          checked={on}
          {...invalid(id, error)}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <motion.span
          aria-hidden
          whileTap={reduce ? undefined : { scale: 0.85 }}
          transition={SNAPPY}
          className={cx(
            'grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors duration-(--duration-fast) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus motion-reduce:transition-none',
            on
              ? 'border-accent-fill bg-accent-fill text-on-accent'
              : error
                ? 'border-danger bg-surface-sunken'
                : 'border-border-strong bg-surface-sunken',
          )}
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none">
            <motion.path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : SNAPPY}
            />
          </svg>
        </motion.span>
        {f.label}
      </label>
      <FieldNote id={id} description={f.description} error={error} />
    </div>
  )
}
