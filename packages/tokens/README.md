# @adastrarp/tokens

Tokens del design system de Ad Astra para Tailwind v4. Tema por defecto **Void** (oscuro, `:root`); **Dawn** (claro) bajo
`[data-theme="light"]`.

```css
@import 'tailwindcss';
@import '@adastrarp/tokens/theme.css';
```

`theme.css` trae todo: valores por tema (`tokens.css`, generado), fuentes self-hosted (`fonts.css`, `@fontsource`), la skin glass
(`glass.css`, opt-in) y los roles de Tailwind (`bg-surface`, `bg-surface-raised`, `text-ink`, `text-ink-muted`, `text-accent`,
`border-border`, `outline-focus`…), las utilidades tipográficas (`text-h1`…`text-h4`, `text-eyebrow`, `text-body-lg`, `text-body`,
`text-body-sm`, `text-label`, `text-caption`, `text-quote`, `text-code`, `text-data`) y los radios del DS (`rounded-md` = 12 px).
También se pueden importar por separado: `tokens.css`, `fonts.css`, `glass.css`.

Componentes: siempre el rol, nunca el hex ni los colores de marca (`vibrant`, `pink`, `primary-dark`: solo piezas gráficas).

## Lib

```ts
import {
  resolveTheme,
  contrast,
  luminance,
  blend,
  generateCss,
  type TokenFile,
} from '@adastrarp/tokens'
```

- `resolveTheme(file, 'dark', { aliasAsVar? })` — todas las variables de un tema, con alias resueltos.
- `contrast(a, b)` — relación WCAG 2.x entre dos hex. `blend(top, bottom, alpha)` — hex resultante de una capa translúcida.
- `generateCss(file)` — lo que escribe `bun run tokens` en `tokens.css`.

## Fuente

`design/tokens.json` es una **copia** del de `adastra-site`. No se edita acá. Cambia en el DS, copia, `bun run tokens` (raíz).
`bun test` falla si `tokens.css` no coincide con el JSON, si algún par de texto baja de 4.5:1 (3:1 en bordes/foco), o si el texto
sobre glass deja de pasar AA con negro o blanco detrás.

Glass: ver [DESIGN.md](../../DESIGN.md#glass-opt-in-y-por-qué-fake-es-el-default).
