/**
 * Coloca pills en fila: devuelve la `x` de cada una a partir de sus anchos. Útil para filas de estado donde una pill se
 * estira y empuja a las vecinas.
 */
export function row(widths: readonly number[], gap: number, x0 = 0): number[] {
  const out: number[] = []
  let x = x0
  for (const w of widths) {
    out.push(x)
    x += w + gap
  }
  return out
}
