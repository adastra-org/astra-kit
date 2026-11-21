/**
 * Geometría goo: todo es una pill (cápsula de radio = alto / 2). Una pill se dibuja como la unión de sus dos círculos
 * extremos, un puente metaball entre ellos y un cuerpo rectangular cuya altura baja con el "cuello" (necking). Con cuello 0
 * la unión es exactamente la cápsula. Todas las subrutas giran en sentido horario para que `fill-rule: nonzero` las una sin
 * huecos.
 */

export interface Circle {
  x: number
  y: number
  r: number
}

type Pt = [number, number]

const f = (n: number) => (Math.round(n * 100) / 100).toString()
const pt = (p: Pt) => `${f(p[0])} ${f(p[1])}`
const along = (c: Pt, a: number, r: number): Pt => [
  c[0] + r * Math.cos(a),
  c[1] + r * Math.sin(a),
]
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n))

/** Ancho mínimo del cuello de un puente, relativo al radio menor, antes de cortarse. */
export const PINCH = 0.3

/** Círculo como dos arcos en sentido horario. Radio <= 0: nada. */
export function circlePath({ x, y, r }: Circle): string {
  if (!(r > 0)) return ''
  return `M${f(x - r)} ${f(y)}A${f(r)} ${f(r)} 0 1 1 ${f(x + r)} ${f(y)}A${f(r)} ${f(r)} 0 1 1 ${f(x - r)} ${f(y)}Z`
}

/** Rectángulo en sentido horario. */
export function rectPath(x: number, y: number, w: number, h: number): string {
  if (!(w > 0 && h > 0)) return ''
  return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`
}

/**
 * Puente metaball entre dos círculos (algoritmo de Hiroyuki Sato). `reach` es la separación entre bordes a partir de la cual
 * aparece el puente; al acercarse a `reach` se afina y se corta (`PINCH`) antes de volverse un hilo. Devuelve '' si no hay
 * puente.
 */
export function metaballPath(
  a: Circle,
  b: Circle,
  reach: number,
  { spread = 0.5, handle = 2.4 }: { spread?: number; handle?: number } = {},
): string {
  // El algoritmo asume r1 >= r2.
  const [c1, c2] = a.r >= b.r ? [a, b] : [b, a]
  const r1 = c1.r
  const r2 = c2.r
  if (!(r1 > 0 && r2 > 0)) return ''
  const p1c: Pt = [c1.x, c1.y]
  const p2c: Pt = [c2.x, c2.y]
  const d = dist(p1c, p2c)
  const gap = d - r1 - r2
  if (d <= Math.abs(r1 - r2) || gap >= reach) return ''
  // Afinado suave cerca del límite.
  const v = spread * (gap > 0 ? clamp(1 - gap / reach, 0, 1) : 1)
  if (v <= 0) return ''

  let u1 = 0
  let u2 = 0
  if (d < r1 + r2) {
    u1 = Math.acos(clamp((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d), -1, 1))
    u2 = Math.acos(clamp((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d), -1, 1))
  }
  const between = Math.atan2(c2.y - c1.y, c2.x - c1.x)
  const maxSpread = Math.acos(clamp((r1 - r2) / d, -1, 1))
  const a1 = between + u1 + (maxSpread - u1) * v
  const a2 = between - u1 - (maxSpread - u1) * v
  const a3 = between + Math.PI - u2 - (Math.PI - u2 - maxSpread) * v
  const a4 = between - Math.PI + u2 + (Math.PI - u2 - maxSpread) * v
  const p1 = along(p1c, a1, r1)
  const p2 = along(p1c, a2, r1)
  const p3 = along(p2c, a3, r2)
  const p4 = along(p2c, a4, r2)
  const total = r1 + r2
  const d2 =
    Math.min(v * handle, dist(p1, p3) / total) * Math.min(1, (d * 2) / total)
  const h1 = along(p1, a1 - Math.PI / 2, r1 * d2)
  const h2 = along(p2, a2 + Math.PI / 2, r1 * d2)
  const h3 = along(p3, a3 + Math.PI / 2, r2 * d2)
  const h4 = along(p4, a4 - Math.PI / 2, r2 * d2)

  // Ruptura (pinch-off): un líquido real se corta cuando el cuello se afina. Si el ancho a mitad del puente baja de
  // `PINCH` del radio menor, no se dibuja: así no quedan hilos de 1 px entre pills que se separan.
  const mid = (a: Pt, b: Pt, c: Pt, e: Pt): Pt => [
    (a[0] + 3 * b[0] + 3 * c[0] + e[0]) / 8,
    (a[1] + 3 * b[1] + 3 * c[1] + e[1]) / 8,
  ]
  const waist = dist(mid(p1, h1, h3, p3), mid(p2, h2, h4, p4))
  if (gap > 0 && waist < Math.max(2, r2 * PINCH)) return ''

  // Orientación: polígono de control p1 -> p3 -> p4 -> p2; si es antihorario, se recorre al revés.
  const poly = [p1, p3, p4, p2]
  let area = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]!
    const [x2, y2] = poly[(i + 1) % poly.length]!
    area += x1 * y2 - x2 * y1
  }
  return area >= 0
    ? `M${pt(p1)}C${pt(h1)} ${pt(h3)} ${pt(p3)}L${pt(p4)}C${pt(h4)} ${pt(h2)} ${pt(p2)}Z`
    : `M${pt(p2)}C${pt(h2)} ${pt(h4)} ${pt(p4)}L${pt(p3)}C${pt(h3)} ${pt(h1)} ${pt(p1)}Z`
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Círculos extremos de una pill. Si es más angosta que alta, es un solo círculo centrado. */
export function pillEnds({ x, y, w, h }: Box): Circle[] {
  const r = Math.min(w, h) / 2
  if (!(r > 0)) return []
  const cy = y + h / 2
  if (w - h < 0.5) return [{ x: x + w / 2, y: cy, r }]
  return [
    { x: x + r, y: cy, r },
    { x: x + w - r, y: cy, r },
  ]
}

/**
 * Pill con cuello: `neck` 0 = cápsula exacta; 0.6 = el cuerpo baja al 40 % del alto y el puente metaball le da la curva
 * líquida. El cuello lo calcula el motor a partir de la velocidad con que cambia el ancho.
 */
export function pillPath(box: Box, neck = 0): string {
  const ends = pillEnds(box)
  if (ends.length === 0) return ''
  if (ends.length === 1) return circlePath(ends[0]!)
  const [a, b] = ends as [Circle, Circle]
  const body = a.r * 2 * (1 - clamp(neck, 0, 0.9))
  return (
    circlePath(a) +
    circlePath(b) +
    metaballPath(a, b, Number.POSITIVE_INFINITY) +
    rectPath(a.x, a.y - body / 2, b.x - a.x, body)
  )
}

/**
 * Puente entre dos pills vecinas: une sus círculos extremos más cercanos. Con separación menor que `reach` aparece el
 * metaball; si se solapan, un cuerpo rellena hasta fundirlas en una sola pill.
 */
export function bridgePath(a: Box, b: Box, reach: number): string {
  const ea = pillEnds(a)
  const eb = pillEnds(b)
  let best: [Circle, Circle, number] | null = null
  for (const ca of ea)
    for (const cb of eb) {
      const gap = Math.hypot(ca.x - cb.x, ca.y - cb.y) - ca.r - cb.r
      if (!best || gap < best[2]) best = [ca, cb, gap]
    }
  if (!best) return ''
  const [ca, cb, gap] = best
  let d = metaballPath(ca, cb, reach)
  // Fusión: solape de hasta un radio -> cuerpo completo entre centros (solo si están alineadas en horizontal).
  const r = Math.min(ca.r, cb.r)
  if (gap < 0 && Math.abs(ca.y - cb.y) < 0.5) {
    const k = clamp(-gap / r, 0, 1)
    const x0 = Math.min(ca.x, cb.x)
    d += rectPath(x0, ca.y - r * k, Math.abs(cb.x - ca.x), 2 * r * k)
  }
  return d
}
