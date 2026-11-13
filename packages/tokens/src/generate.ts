// Genera tokens.css desde design/tokens.json (copia del design system de Ad Astra, nunca se edita).
// Tema por defecto (:root) = Void (oscuro). `[data-theme="light"]` = Dawn.
import { resolveTheme, type TokenFile } from './tokens'

export function generateCss(src: TokenFile): string {
  const [primary, ...rest] = src.color.themes.map((t) => t.id)
  if (!primary) throw new Error('tokens.json: sin temas de color')

  const block = (sel: string, theme: string) => {
    const vars = resolveTheme(src, theme, { aliasAsVar: true })
    const lines = Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`)
    return `${sel} {\n${lines.join('\n')}\n}\n`
  }

  // Radios: iguales en todos los temas y con los nombres de Tailwind (rounded-md…).
  const radius = src.radius.tokens
    .map((r) => `  --${r.name}: ${String(r.value)};`)
    .join('\n')

  return [
    `/* ${src.name} — generado desde design/tokens.json por scripts/tokens.ts. No editar a mano. */`,
    '',
    block(':root', primary),
    ...rest.map((id) => block(`[data-theme="${id}"]`, id)),
    `@theme {\n${radius}\n}\n`,
  ].join('\n')
}
