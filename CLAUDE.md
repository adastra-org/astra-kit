# astra-kit — instrucciones para agentes

UI compartida de las NUI de Ad Astra (FiveM). Org: `adastra-org`. Ver [README.md](README.md).

## Leer antes de tocar

| Tocas…                           | Lee primero                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| Cualquier UI, tokens, glass      | [DESIGN.md](DESIGN.md), luego `~/.claude/standards/DESIGN.md` y el `DESIGN.md` de `adastra-site` |
| Servidor, deploy, repo           | `~/.claude/standards/ARCHITECTURE.md`                                                            |
| Glass o lo que dependa del juego | [docs/glass.md](docs/glass.md) y [docs/in-game-checklist.md](docs/in-game-checklist.md)          |

## Reglas

- Bun, TS `strict`, React 19, Tailwind v4, lucide-react. Nunca npm/npx/yarn/pnpm.
- Los paquetes publican **source** (`exports` apuntan a `.ts`/`.tsx`/`.css`). Sin build.
- `packages/tokens/design/tokens.json` es **copia** del de `adastra-site` (que copia el DS). Nunca se edita: se cambia en el DS, se
  copia y se corre `bun run tokens`. `tokens.css` es generado; un test falla si no coincide con el JSON.
- Componentes: roles (`bg-surface-raised`, `text-ink`…), nunca hex ni colores de marca. Sin opacidades sobre roles salvo scrims.
- Glass es **opt-in** y `fake` es el default. Tinte alto (80 % Void / 92 % Dawn); el test mide AA en el peor caso. No lo bajes.
- Nada en loop, sin rAF en reposo. Animación solo en cambio de estado (`Reveal`, motion); reduced motion -> solo opacidad.
- Cambia un paquete publicado -> sube su `version` en el mismo PR (minor feature, patch fix).
- Copy en español neutro con **tú**, sin emojis ni exclamaciones.

## Entrega

Rama -> PR -> review de Faku -> merge. `bun run check` verde antes de cada commit (el commit gate lo exige).
Commits: `<type>(<scope>): <msg> [v<version>]`, identidad `Faku <hola@facupresa.com>`,
trailer `Co-authored-by: Ether <ether@itica.lat>`. `scripts/publish.ts` lo corre Faku a mano.
