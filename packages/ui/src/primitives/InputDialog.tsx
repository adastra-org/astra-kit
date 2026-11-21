import type { InputDialogData, InputField, InputValue } from '@adastrarp/nui'
import { useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '../Button'
import { Field } from '../Field'
import { Dialog } from './Dialog'

export interface InputDialogProps {
  data: InputDialogData
  /** `values` por `id` de campo, o `null` si se canceló (botón o Escape). */
  onResult: (values: Record<string, InputValue> | null) => void
}

type Raw = string | boolean

const SELECT_CLASS =
  'h-10 w-full rounded-md border bg-surface-sunken px-3 text-body text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

const initial = (f: InputField): Raw =>
  f.type === 'checkbox'
    ? f.default === true
    : f.default === undefined
      ? ''
      : String(f.default)

/** Error de validación en español o `undefined`. Los vacíos opcionales son válidos. */
function validate(f: InputField, raw: Raw): string | undefined {
  if (f.type === 'checkbox') {
    return f.required && raw !== true ? 'Debes marcar esta casilla.' : undefined
  }
  const text = String(raw).trim()
  if (text === '') return f.required ? 'Este campo es obligatorio.' : undefined
  if (f.type === 'number') {
    const n = Number(text)
    if (!Number.isFinite(n)) return 'Escribe un número.'
    if (f.min !== undefined && n < f.min) return `El mínimo es ${f.min}.`
    if (f.max !== undefined && n > f.max) return `El máximo es ${f.max}.`
  }
  return undefined
}

/** Valor final para Lua: número -> `number`, checkbox -> `boolean`, vacío en number/select/date -> `null`. */
function toValue(f: InputField, raw: Raw): InputValue {
  if (f.type === 'checkbox') return raw === true
  const text = String(raw).trim()
  if (f.type === 'number') return text === '' ? null : Number(text)
  if (f.type === 'text') return String(raw)
  return text === '' ? null : text
}

/**
 * Diálogo de formulario: text, number, select, checkbox y date. Valida `required` / `min` / `max` al enviar y deja el
 * foco en el primer campo con error. Escape o "Cancelar" devuelven `null`.
 */
export function InputDialog({ data, onResult }: InputDialogProps) {
  const titleId = useId()
  const formId = useId()
  const form = useRef<HTMLFormElement>(null)
  const [raw, setRaw] = useState<Record<string, Raw>>(() =>
    Object.fromEntries(data.fields.map((f) => [f.id, initial(f)])),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (id: string, v: Raw) => {
    setRaw((r) => ({ ...r, [id]: v }))
    setErrors((e) => {
      if (!(id in e)) return e
      const { [id]: _drop, ...rest } = e
      return rest
    })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    for (const f of data.fields) {
      const msg = validate(f, raw[f.id] ?? '')
      if (msg) found[f.id] = msg
    }
    if (Object.keys(found).length > 0) {
      setErrors(found)
      const first = data.fields.find((f) => found[f.id])
      const controls =
        form.current?.querySelectorAll<HTMLInputElement>('[name]')
      ;[...(controls ?? [])].find((el) => el.name === first!.id)?.focus()
      return
    }
    onResult(
      Object.fromEntries(
        data.fields.map((f) => [f.id, toValue(f, raw[f.id] ?? '')]),
      ),
    )
  }

  return (
    <Dialog labelledBy={titleId} onEscape={() => onResult(null)}>
      <h2 id={titleId} className="text-h4">
        {data.title}
      </h2>
      <form
        id={formId}
        ref={form}
        noValidate
        onSubmit={submit}
        className="flex flex-col gap-4"
      >
        {data.fields.map((f) => (
          <FieldControl
            key={f.id}
            field={f}
            value={raw[f.id] ?? ''}
            error={errors[f.id]}
            onChange={(v) => set(f.id, v)}
          />
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={() => onResult(null)}>
            {data.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button type="submit" variant="primary">
            {data.confirmLabel ?? 'Aceptar'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

interface ControlProps {
  field: InputField
  value: Raw
  error?: string
  onChange: (v: Raw) => void
}

function FieldControl(props: ControlProps) {
  const { field: f } = props
  if (f.type === 'select') return <SelectField {...props} />
  if (f.type === 'checkbox') return <CheckboxField {...props} />
  return <TextField {...props} />
}

/** Descripción (si no hay error) o el error del campo, enlazado por `${id}-error`. */
function FieldNote({
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

const invalid = (id: string, error?: string) => ({
  'aria-invalid': error ? (true as const) : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
})

function SelectField({ field: f, value, error, onChange }: ControlProps) {
  const id = useId()
  const label = f.required ? f.label : `${f.label} (opcional)`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-ink">
        {label}
      </label>
      <select
        id={id}
        name={f.id}
        value={String(value)}
        {...invalid(id, error)}
        onChange={(e) => onChange(e.target.value)}
        className={`${SELECT_CLASS} ${error ? 'border-danger' : 'border-border-strong'}`}
      >
        <option value="">Elige una opción</option>
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldNote id={id} description={f.description} error={error} />
    </div>
  )
}

function CheckboxField({ field: f, value, error, onChange }: ControlProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-3 text-label text-ink"
      >
        <input
          id={id}
          name={f.id}
          type="checkbox"
          checked={value === true}
          {...invalid(id, error)}
          onChange={(e) => onChange(e.target.checked)}
          className="size-5 accent-accent-fill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        {f.label}
      </label>
      <FieldNote id={id} description={f.description} error={error} />
    </div>
  )
}

function TextField({ field: f, value, error, onChange }: ControlProps) {
  const label = f.required ? f.label : `${f.label} (opcional)`
  const num = f.type === 'number'
  return (
    <Field
      name={f.id}
      label={label}
      hint={f.description}
      error={error}
      type={f.type === 'number' || f.type === 'date' ? f.type : 'text'}
      value={String(value)}
      placeholder={f.placeholder}
      min={num ? f.min : undefined}
      max={num ? f.max : undefined}
      step={num ? f.step : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
