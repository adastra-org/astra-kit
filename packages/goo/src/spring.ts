/**
 * Spring físico de un valor: F = -k·x - c·v, a = F / m. Mismo modelo y presets que el DS personal de Faku
 * (`window.Faku.presets`). Integración semi-implícita con subpasos fijos de 1/240 s: estable con cualquier frame rate.
 */
export interface SpringConfig {
  /** Rigidez (k). */
  stiffness: number
  /** Coeficiente de amortiguamiento (c). Crítico = 2·√(k·m); menos rebota. */
  damping: number
  /** Masa (m). Más masa = más inercia: tarda más y se siente pesado. */
  mass: number
}

export interface Spring {
  value: number
  velocity: number
  target: number
}

/** Presets del DS Faku. */
export const PRESETS = {
  /** Deriva de orbes y blobs. */
  float: { stiffness: 26, damping: 5, mass: 1.4 },
  /** Entradas de elementos (una alerta que nace). */
  gentle: { stiffness: 120, damping: 14, mass: 1 },
  /** Respuesta a arrastre, rebote visible. */
  wobbly: { stiffness: 180, damping: 9, mass: 1 },
  /** Estados de UI: una pill que se estira, hover, press. */
  snappy: { stiffness: 320, damping: 24, mass: 1 },
  /** Paneles: se sienten pesados. */
  heavy: { stiffness: 90, damping: 18, mass: 3 },
} as const satisfies Record<string, SpringConfig>

export type SpringPreset = keyof typeof PRESETS

export const SPRING_DEFAULT: SpringConfig = PRESETS.snappy

/** Amortiguamiento crítico para k y m: llega sin pasarse. */
export function critical(stiffness: number, mass = 1): number {
  return 2 * Math.sqrt(stiffness * mass)
}

/** Razón de amortiguamiento ζ (1 = crítico, < 1 rebota). */
export function dampingRatio(cfg: SpringConfig): number {
  return cfg.damping / critical(cfg.stiffness, cfg.mass)
}

const STEP = 1 / 240
const REST = 0.01

export function spring(value: number, target = value): Spring {
  return { value, velocity: 0, target }
}

/** Avanza `dt` segundos. Devuelve true si quedó en reposo (y lo fija exacto en el objetivo). */
export function stepSpring(s: Spring, dt: number, cfg: SpringConfig): boolean {
  const { stiffness: k, damping: c } = cfg
  const m = cfg.mass > 0 ? cfg.mass : 1
  let t = dt
  while (t > 0) {
    const h = Math.min(STEP, t)
    s.velocity += ((-k * (s.value - s.target) - c * s.velocity) / m) * h
    s.value += s.velocity * h
    t -= h
  }
  if (Math.abs(s.value - s.target) < REST && Math.abs(s.velocity) < REST) {
    s.value = s.target
    s.velocity = 0
    return true
  }
  return false
}

export function atRest(s: Spring): boolean {
  return s.value === s.target && s.velocity === 0
}
