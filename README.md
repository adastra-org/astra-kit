# astra-kit

UI reutilizable para todas las NUI del servidor FiveM **Ad Astra**. Monorepo Bun; los paquetes publican su código fuente
(`.ts`, `.tsx`, `.css`), sin paso de build, bajo el scope público `@adastra` en npm.

| Paquete                              | Qué es                                                                                                                                     | Versión |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| [`@adastra/tokens`](packages/tokens) | Tokens del DS de Ad Astra para Tailwind v4: Void (oscuro, default) y Dawn, roles, utilidades tipográficas, fuentes self-hosted, skin glass | 0.1.0   |
| [`@adastra/nui`](packages/nui)       | Bridge tipado React <-> Lua: `fetchNui`, `useNuiEvent`, `useNuiVisibility`, `debugData` / `mockNui`, blur del mundo                        | 0.1.0   |
| [`@adastra/ui`](packages/ui)         | Primitivas: `Glass`, `Surface`, `Panel`, `Reveal`, `Button`, `IconButton`, `Chip`, `Kbd`, `Field`                                          | 0.1.0   |
| [`@adastra/config`](packages/config) | Presets de TypeScript y oxlint                                                                                                             | 0.1.0   |
| [`lab/`](lab)                        | App Vite de desarrollo (no se publica): cada componente sobre un "juego" falso                                                             | —       |

## Uso en una NUI

```bash
bun add @adastra/tokens @adastra/nui @adastra/ui react react-dom motion tailwindcss
```

```css
/* src/styles.css */
@import 'tailwindcss';
@import '@adastra/tokens/theme.css';
@import '@adastra/ui/styles.css'; /* le dice a Tailwind dónde están las clases de los componentes */

html,
body {
  background: transparent;
} /* la NUI es transparente sobre el juego */
```

```tsx
import { useNuiVisibility } from '@adastra/nui'
import { Panel, Button, Reveal } from '@adastra/ui'

export function App() {
  const { visible, close } = useNuiVisibility()
  return (
    <Reveal open={visible}>
      <Panel
        title="Inventario"
        glass="fake"
        actions={<Button onClick={close}>Cerrar</Button>}
      />
    </Reveal>
  )
}
```

El lado Lua mínimo está en [`packages/nui/README.md`](packages/nui/README.md).

## Glass: léelo antes de usarlo

La NUI es CEF transparente compuesto **encima** del frame del juego. El mundo no está en el DOM, así que `backdrop-filter`
solo difumina HTML que haya detrás y nunca el mundo. Por eso `Glass` tiene dos modos (`fake` por defecto, `backdrop`
opt-in) y el blur del mundo lo hace Lua con `useScreenBlur`. Detalle y razones en [DESIGN.md](DESIGN.md) y
[docs/glass.md](docs/glass.md). Nada de esto está verificado dentro del juego todavía: ver
[docs/in-game-checklist.md](docs/in-game-checklist.md).

## Desarrollo

```bash
bun install
bun run lab           # lab en http://localhost:5173
bun run check         # typecheck + oxlint + oxfmt --check + bun test
bun run tokens        # packages/tokens/design/tokens.json -> tokens.css
```

`?scene=blanco&skin=refraction&theme=light&tint=90` en la URL del lab abre una combinación concreta.

Publicar: `bun run release` (solo Faku, desde un shell con `npm login`; no corre en CI todavía).
Flujo: rama -> commit con `bun run check` verde -> PR -> review de Faku -> merge. Ver [CLAUDE.md](CLAUDE.md).
