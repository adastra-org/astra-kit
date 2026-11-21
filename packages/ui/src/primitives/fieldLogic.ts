import type { InputField } from '@adastrarp/nui'

// Lógica de los campos de InputDialog, sin React.

export const fieldLabel = (f: InputField) =>
  f.required ? f.label : `${f.label} (opcional)`

export const invalid = (id: string, error?: string) => ({
  'aria-invalid': error ? (true as const) : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
})

/** `YYYY-MM-DD` -> `dd/mm/aaaa`. Cualquier otra cosa queda igual. */
export const isoToDisplay = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}

/** `dd/mm/aaaa` válido -> `YYYY-MM-DD`; si no es una fecha real, `null`. */
export const displayToIso = (text: string): string | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim())
  if (!m) return null
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== mo - 1 ||
    date.getUTCDate() !== d
  )
    return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

/** Escribe las barras solas: `01051990` -> `01/05/1990`. */
export const maskDate = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
