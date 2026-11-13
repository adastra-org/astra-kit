import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import tokens from '../design/tokens.json'
import { generateCss } from './generate'
import { blend, contrast, resolveTheme, type TokenFile } from './tokens'

const file = tokens as unknown as TokenFile
const root = join(import.meta.dir, '..')

// Pares que la UI usa como texto (4.5:1) o como borde / foco / ícono (3:1).
const TEXT: [string, string][] = [
  ['ink', 'surface'],
  ['ink', 'surface-raised'],
  ['ink', 'surface-overlay'],
  ['ink', 'surface-sunken'],
  ['ink-muted', 'surface'],
  ['ink-muted', 'surface-raised'],
  ['ink-subtle', 'surface'],
  ['ink-subtle', 'surface-raised'],
  ['accent', 'surface'],
  ['accent', 'surface-raised'],
  ['on-accent', 'accent-fill'],
  ['on-accent', 'accent-fill-hover'],
  ['on-brand', 'surface-brand'],
  ['success', 'success-surface'],
  ['warning', 'warning-surface'],
  ['danger', 'danger-surface'],
  ['info', 'info-surface'],
]
const UI: [string, string][] = [
  ['border-strong', 'surface'],
  ['border-strong', 'surface-raised'],
  ['focus', 'surface'],
  ['focus', 'surface-raised'],
]

for (const { id } of file.color.themes) {
  const v = resolveTheme(file, id)
  describe(`tema ${id}`, () => {
    for (const [fg, bg] of TEXT)
      test(`${fg} sobre ${bg} ≥ 4.5`, () => {
        expect(contrast(v[fg]!, v[bg]!)).toBeGreaterThanOrEqual(4.5)
      })
    for (const [fg, bg] of UI)
      test(`${fg} sobre ${bg} ≥ 3`, () => {
        expect(contrast(v[fg]!, v[bg]!)).toBeGreaterThanOrEqual(3)
      })
  })
}

test('alias como var() para el CSS', () => {
  expect(resolveTheme(file, 'dark', { aliasAsVar: true }).surface).toBe(
    'var(--brand-dark)',
  )
})

test('tokens.css está al día con design/tokens.json', async () => {
  const onDisk = await Bun.file(join(root, 'tokens.css')).text()
  expect(onDisk).toBe(generateCss(file))
})

// Glass: el texto tiene que pasar AA con cualquier cosa detrás. Peor caso = fondo blanco o negro
// bajo la superficie tintada (el tinte vive en glass.css, `--glass-tint`).
describe('glass AA (peor caso)', async () => {
  const css = await Bun.file(join(root, 'glass.css')).text()
  const tintOf = (id: string, first: boolean) => {
    const sel = first ? ':root' : String.raw`\[data-theme='${id}'\]`
    const m = new RegExp(
      String.raw`${sel}\s*\{[^}]*--glass-tint:\s*(\d+)%`,
    ).exec(css)
    if (!m?.[1]) throw new Error(`glass.css: sin --glass-tint para ${id}`)
    return Number(m[1]) / 100
  }
  file.color.themes.forEach(({ id }, i) => {
    const v = resolveTheme(file, id)
    const alpha = tintOf(id, i === 0)
    for (const behind of ['#000000', '#ffffff'])
      for (const fg of ['ink', 'ink-muted'])
        test(`${id}: ${fg} sobre glass (tinte ${alpha * 100}%) sobre ${behind} ≥ 4.5`, () => {
          const bg = blend(v['surface-raised']!, behind, alpha)
          expect(contrast(v[fg]!, bg)).toBeGreaterThanOrEqual(4.5)
        })
  })
})
