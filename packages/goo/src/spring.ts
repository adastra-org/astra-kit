/**
 * Spring de un valor. `damping` es la razón de amortiguamiento: 1 = crítico (sin rebote, el default de la casa), < 1
 * rebota. Integración semi-implícita con subpasos fijos de 1/240 s: estable con cualquier frame rate.
 */
export interface SpringConfig {
  /** Rigidez (k). 260 ≈ 240 ms hasta reposo con damping 1. */
  stiffness: number
  /** Razón de amortiguamiento (ζ). */
  damping: number
}

export interface Spring {
  value: number
  velocity: number
  target: number
}

export const SPRING_DEFAULT: SpringConfig = { stiffness: 260, damping: 1 }
const STEP = 1 / 240
const REST = 0.01

export function spring(value: number, target = value): Spring {
  return { value, velocity: 0, target }
}

/** Avanza `dt` segundos. Devuelve true si quedó en reposo (y lo fija exacto en el objetivo). */
export function stepSpring(s: Spring, dt: number, cfg: SpringConfig): boolean {
  const k = cfg.stiffness
  const c = 2 * cfg.damping * Math.sqrt(k)
  let t = dt
  while (t > 0) {
    const h = Math.min(STEP, t)
    s.velocity += (-k * (s.value - s.target) - c * s.velocity) * h
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
