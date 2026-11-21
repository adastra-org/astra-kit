import { emitNui } from './events'
import { fetchNui } from './fetch'
import { useNuiEvent } from './hooks'

/*
 * Contrato de las primitivas de UI (notificación, progreso, text UI, menú, input, alerta, skill check, radial).
 * No depende de ningún framework ni de ox_lib: cualquier script Lua (o TS) que mande estos mensajes las usa.
 *
 *   Lua -> UI   SendNUIMessage({ action = 'notify:show', data = { ... } })        (NuiPrimitiveActions)
 *   UI -> Lua   RegisterNUICallback('input:result', function(data, cb) ... end)   (NuiPrimitiveCallbacks)
 */

// ---------------------------------------------------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------------------------------------------------

export type NotifyType = 'success' | 'info' | 'warning' | 'error'

export interface NotifyData {
  /** Repetir un `id` reemplaza la notificación en lugar de apilar otra. Sin `id`, se genera uno. */
  id?: string
  /** Default `info`. */
  type?: NotifyType
  title?: string
  description: string
  /** Milisegundos visible. Default 4000; `0` = no se cierra sola. */
  duration?: number
}

export interface ProgressData {
  id: string
  /** Barra pill o círculo con anillo. Default `bar`. */
  kind?: 'bar' | 'circle'
  label?: string
  /** Milisegundos hasta completar. */
  duration: number
  /** Se puede cancelar con `cancelKey`. Default `false`. */
  canCancel?: boolean
  /** Tecla que cancela (`KeyboardEvent.key`, sin distinguir mayúsculas). Default `x`. */
  cancelKey?: string
}

export interface TextUiData {
  /** Tecla a mostrar como `Kbd`, p. ej. `E`. Sin tecla, solo texto. */
  key?: string
  text: string
  /** Color de la pill según el lugar: `safe` (zona protegida), `danger` (zona roja), `info`. Sin tono, neutra. */
  tone?: TextUiTone
}

export type TextUiTone = 'safe' | 'danger' | 'info'

export interface ContextMetadata {
  label: string
  value: string | number
  /** Clave de ícono (mapa `icons` del host), a la izquierda del dato. */
  icon?: string
}

/** Peso de una acción: `accent` la destaca, `warning` pide atención (vender, entregar), `danger` es destructiva. */
export type ContextTone = 'accent' | 'warning' | 'danger'

export interface ContextItem {
  /** Estable dentro del menú: es lo que vuelve a Lua en `context:select`. */
  id: string
  label: string
  description?: string
  /** Clave de ícono; la resuelve la app con el mapa `icons` del host (lucide-react). */
  icon?: string
  disabled?: boolean
  /** Acción importante: color propio. Sin tono, neutra. */
  tone?: ContextTone
  metadata?: ContextMetadata[]
  /** Submenú: si tiene `items`, el ítem navega en vez de seleccionar. */
  items?: ContextItem[]
}

export interface ContextMenuData {
  id: string
  title: string
  items: ContextItem[]
}

export type InputFieldType = 'text' | 'number' | 'select' | 'checkbox' | 'date'

export interface InputOption {
  value: string
  label: string
}

export interface InputField {
  /** Clave del valor en `input:result`. */
  id: string
  type: InputFieldType
  label: string
  description?: string
  required?: boolean
  placeholder?: string
  /** `text`/`select`/`date` (YYYY-MM-DD): string; `number`: number; `checkbox`: boolean. */
  default?: string | number | boolean
  /** Solo `select`. */
  options?: InputOption[]
  /** Solo `number`. */
  min?: number
  max?: number
  step?: number
}

export interface InputDialogData {
  id: string
  title: string
  fields: InputField[]
  confirmLabel?: string
  cancelLabel?: string
}

export type InputValue = string | number | boolean | null

export interface AlertData {
  id: string
  title: string
  content?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Muestra el botón de cancelar. Default `true`. Sin cancelar, es un aviso con un solo botón. */
  cancel?: boolean
  /** Acción destructiva: el botón de confirmar va en `danger`. */
  danger?: boolean
}

export type SkillDifficulty = 'easy' | 'medium' | 'hard'

export interface SkillCheckData {
  id: string
  /** Una ronda por dificultad, en orden. Default `['easy']`. */
  rounds?: SkillDifficulty[]
  /** Teclas válidas (`KeyboardEvent.key`). Default `['e']`. */
  keys?: string[]
}

export interface RadialItem {
  id: string
  label: string
  icon?: string
  disabled?: boolean
  /** Submenú: el centro pasa a "volver". */
  items?: RadialItem[]
}

export interface RadialData {
  id: string
  items: RadialItem[]
}

// ---------------------------------------------------------------------------------------------------------------------
// Mensajes
// ---------------------------------------------------------------------------------------------------------------------

/** Lua -> UI: `{ action, data }`. */
export interface NuiPrimitiveActions {
  'notify:show': NotifyData
  'notify:dismiss': { id: string }
  'progress:start': ProgressData
  /** Cancela desde Lua (sin `id`, la que esté en curso). */
  'progress:cancel': { id?: string } | undefined
  'textui:show': TextUiData
  'textui:hide': undefined
  'context:open': ContextMenuData
  'context:close': undefined
  'input:open': InputDialogData
  'input:close': undefined
  'alert:open': AlertData
  'alert:close': undefined
  'skillcheck:start': SkillCheckData
  /** Tecla reenviada desde Lua, para cuando la NUI no tiene el teclado (ver README: foco). */
  'skillcheck:input': { key: string }
  'skillcheck:cancel': undefined
  'radial:open': RadialData
  'radial:close': undefined
}

export type ProgressStatus = 'completed' | 'cancelled'

/** UI -> Lua: `RegisterNUICallback(event, ...)`. Siempre hay que responder con `cb({})`. */
export interface NuiPrimitiveCallbacks {
  'progress:end': { id: string; status: ProgressStatus }
  /** `path`: ids desde el menú raíz hasta el ítem elegido (los submenús suman un id por nivel). */
  'context:select': { id: string; path: string[] }
  'context:close': { id: string }
  /** `values` es `null` si se canceló. */
  'input:result': { id: string; values: Record<string, InputValue> | null }
  'alert:result': { id: string; result: 'confirm' | 'cancel' }
  'skillcheck:result': { id: string; success: boolean }
  'radial:select': { id: string; path: string[] }
  'radial:close': { id: string }
}

export type NuiPrimitiveAction = keyof NuiPrimitiveActions
export type NuiPrimitiveCallback = keyof NuiPrimitiveCallbacks

type Payload<D> = undefined extends D ? [data?: D] : [data: D]

/** Despacha un mensaje Lua -> UI tipado (para el navegador, tests y el lab). */
export function emitPrimitive<A extends NuiPrimitiveAction>(
  action: A,
  ...data: Payload<NuiPrimitiveActions[A]>
): void {
  emitNui(action, data[0])
}

/** `useNuiEvent` tipado con el contrato. */
export function usePrimitiveEvent<A extends NuiPrimitiveAction>(
  action: A,
  handler: (data: NuiPrimitiveActions[A]) => void,
): void {
  useNuiEvent<NuiPrimitiveActions[A]>(action, handler)
}

/** `fetchNui` tipado con el contrato. Un fallo del callback se loguea: la UI no se cuelga por Lua. */
export function callbackPrimitive<E extends NuiPrimitiveCallback>(
  event: E,
  data: NuiPrimitiveCallbacks[E],
): void {
  fetchNui(event, data).catch((error) =>
    console.error(`[nui] ${event} falló`, error),
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Normalización: lo que llega de Lua no es confiable (números como string, campos faltantes, tipos inválidos).
// ---------------------------------------------------------------------------------------------------------------------

export const NOTIFY_TYPES: readonly NotifyType[] = [
  'success',
  'info',
  'warning',
  'error',
]
export const NOTIFY_DURATION = 4000
export const PROGRESS_CANCEL_KEY = 'x'
export const SKILL_KEY = 'e'

let seq = 0
/** Id único dentro de la sesión de la UI. */
export function nextPrimitiveId(prefix = 'p'): string {
  seq += 1
  return `${prefix}-${seq}`
}

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

export type NotifyNormalized = Required<Omit<NotifyData, 'title'>> & {
  title?: string
}

export function normalizeNotify(d: NotifyData): NotifyNormalized {
  return {
    id: d.id ? String(d.id) : nextPrimitiveId('notify'),
    type: NOTIFY_TYPES.includes(d.type as NotifyType)
      ? (d.type as NotifyType)
      : 'info',
    title: d.title ? String(d.title) : undefined,
    description: String(d.description ?? ''),
    duration: Math.max(0, num(d.duration, NOTIFY_DURATION)),
  }
}

export type ProgressNormalized = Required<Omit<ProgressData, 'label'>> & {
  label?: string
}

export function normalizeProgress(d: ProgressData): ProgressNormalized {
  return {
    id: String(d.id),
    kind: d.kind === 'circle' ? 'circle' : 'bar',
    label: d.label ? String(d.label) : undefined,
    // Mínimo 50 ms: una duración 0 o negativa completaría antes de pintar.
    duration: Math.max(50, num(d.duration, 1000)),
    canCancel: d.canCancel === true,
    cancelKey: (d.cancelKey || PROGRESS_CANCEL_KEY).toLowerCase(),
  }
}

export type SkillCheckNormalized = {
  id: string
  rounds: SkillDifficulty[]
  keys: string[]
}

export function normalizeSkillCheck(d: SkillCheckData): SkillCheckNormalized {
  const levels: SkillDifficulty[] = ['easy', 'medium', 'hard']
  const rounds = (d.rounds ?? []).filter((r) => levels.includes(r))
  const keys = (d.keys ?? [])
    .map((k) => String(k).toLowerCase())
    .filter(Boolean)
  return {
    id: String(d.id),
    rounds: rounds.length ? rounds : ['easy'],
    keys: keys.length ? keys : [SKILL_KEY],
  }
}
