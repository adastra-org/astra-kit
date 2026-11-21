/** Lado del cuadrado del radial, diámetro del orbe, del centro y radio del anillo (px). */
export const RADIAL_SIZE = 304
export const ORB = 56
export const HUB = 72
export const RING = 120

/** Centro del orbe `index` de `count`: el primero arriba, en sentido horario. */
export function orbCenter(
  index: number,
  count: number,
  ring = RING,
  size = RADIAL_SIZE,
): { x: number; y: number } {
  const a = ((-90 + (360 * index) / Math.max(1, count)) * Math.PI) / 180
  const c = size / 2
  return { x: c + ring * Math.cos(a), y: c + ring * Math.sin(a) }
}

/**
 * Siguiente ítem habilitado desde `from` en sentido horario (`step` 1) o antihorario (`-1`), dando la vuelta. Devuelve
 * `-1` si no hay ninguno habilitado.
 */
export function nextEnabled(
  items: { disabled?: boolean }[],
  from: number,
  step: 1 | -1,
): number {
  const n = items.length
  for (let k = 1; k <= n; k++) {
    const i = (((from + step * k) % n) + n) % n
    if (!items[i]?.disabled) return i
  }
  return -1
}
