export type Tone = 'accent' | 'warning' | 'danger'

/** El color dice el estado, no el indicador. */
export const toneOf = (v: number): Tone =>
  v < 10 ? 'danger' : v < 25 ? 'warning' : 'accent'
