import type { InputDialogData, InputField, InputValue } from '@adastrarp/nui'
import { useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '../Button'
import { Field } from '../Field'
import { Dialog } from './Dialog'
import { displayToIso, fieldLabel, isoToDisplay } from './fieldLogic'
import {
  CheckboxField,
  DateField,
  NumberField,
  SelectField,
  type ControlProps,
  type Raw,
} from './fields'

export interface InputDialogProps {
  data: InputDialogData
  /** `values` por `id` de campo, o `null` si se canceló (botón o Escape). */
  onResult: (values: Record<string, InputValue> | null) => void
}

const initial = (f: InputField): Raw =>
  f.type === 'checkbox'
    ? f.default === true
    : f.default === undefined
      ? ''
      : f.type === 'date'
        ? isoToDisplay(String(f.default))
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
  if (f.type === 'date' && displayToIso(text) === null)
    return 'Escribe una fecha real en formato dd/mm/aaaa.'
  return undefined
}

/** Valor final para Lua: número -> `number`, checkbox -> `boolean`, fecha -> `YYYY-MM-DD`, vacío en number/select/date -> `null`. */
function toValue(f: InputField, raw: Raw): InputValue {
  if (f.type === 'checkbox') return raw === true
  const text = String(raw).trim()
  if (f.type === 'number') return text === '' ? null : Number(text)
  if (f.type === 'text') return String(raw)
  if (f.type === 'date') return text === '' ? null : displayToIso(text)
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
      const controls = form.current?.querySelectorAll<HTMLElement>('[name]')
      ;[...(controls ?? [])]
        .find((el) => el.getAttribute('name') === first!.id)
        ?.focus()
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

function FieldControl(props: ControlProps) {
  switch (props.field.type) {
    case 'select':
      return <SelectField {...props} />
    case 'checkbox':
      return <CheckboxField {...props} />
    case 'number':
      return <NumberField {...props} />
    case 'date':
      return <DateField {...props} />
    default:
      return <TextField {...props} />
  }
}

function TextField({ field: f, value, error, onChange }: ControlProps) {
  return (
    <Field
      name={f.id}
      label={fieldLabel(f)}
      hint={f.description}
      error={error}
      type="text"
      value={String(value)}
      placeholder={f.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
