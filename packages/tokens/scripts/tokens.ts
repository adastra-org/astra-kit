// Uso: bun run tokens  (desde la raíz del monorepo)
import { join } from 'node:path'
import { generateCss } from '../src/generate'
import type { TokenFile } from '../src/tokens'

const root = join(import.meta.dir, '..')
const src = (await Bun.file(
  join(root, 'design/tokens.json'),
).json()) as TokenFile
await Bun.write(join(root, 'tokens.css'), generateCss(src))
console.log(
  `tokens.css: ${src.color.tokens.length} colores, temas ${src.color.themes.map((t) => t.id).join(', ')}`,
)
