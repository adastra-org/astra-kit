# Design

Extiende el diseño de la casa WeFaber (`~/.claude/standards/DESIGN.md`) y el diseño del sitio de Ad Astra
(`adastra-org/adastra-site` `DESIGN.md`). Fuente de verdad de marca: el design system **Ad Astra**. Este archivo lista solo lo que
astra-kit agrega o acota; lo que no está acá sigue a esos dos.

Context: UI dentro del juego (NUI de FiveM), mouse + teclado, sin touch. Tema: **Void** (oscuro) por defecto; **Dawn** existe en
los tokens y se activa con `data-theme="light"`.

## Desviaciones

| Regla                               | Acá                                                       | Por qué                                                                         |
| ----------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Español rioplatense ("Tocá")        | Español neutro con **tú**                                 | Igual que adastra-site: audiencia LATAM + EU                                    |
| Hit target 44 px touch              | Controles de 32 px (`sm`) y 40 px (`md`)                  | La NUI se usa con cursor, no con dedo                                           |
| `@wefaber/tokens` como base         | `@adastra/tokens`, generado desde el `tokens.json` del DS | La marca es otra; los **nombres de roles** de la casa se respetan en lo posible |
| Opacidad sobre roles solo en scrims | Igual                                                     | Los hovers son capas de superficie (`surface-overlay`), no `ink/8`              |

## Tokens

- `packages/tokens/design/tokens.json` es copia del de adastra-site. No se edita. `bun run tokens` regenera `tokens.css`
  (con un test que compara contra el JSON).
- Roles: `surface` · `surface-raised` · `surface-overlay` · `surface-sunken`, `ink` · `ink-muted` · `ink-subtle`, `accent` ·
  `accent-fill` · `on-accent`, `border` · `border-strong`, `focus`, `success/warning/danger/info` (+ `-surface`).
- `src/tokens.test.ts` mide cada par de texto (4.5:1) y de control/foco (3:1) en Void y Dawn.
- Tipografía: Unbounded (títulos), Geologica (texto), Space Mono (datos, teclas), Averia Serif Libre (citas). Self-hosted con
  `@fontsource`. MADE Outer Sans no se distribuye (licencia personal).

## Glass: opt-in, y por qué `fake` es el default

**La NUI de FiveM es CEF transparente compuesto encima del frame del juego. El juego no está en el DOM.** `backdrop-filter` solo
puede difuminar HTML que esté detrás del elemento; nunca difumina el mundo. Un panel con `backdrop-filter` sobre el juego se ve
como un panel translúcido **sin** blur (y paga el costo de la capa). Por eso:

| Modo                      | Qué hace                                                                                                      | Cuándo                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `fake` (default)          | Sin blur. Tinte alto de `surface-raised` + brillo interno superior + borde en gradiente + ruido. Casi gratis. | Casi todo: menús, paneles, HUD sobre el juego                                  |
| `backdrop`                | `backdrop-filter` real                                                                                        | Solo si detrás hay DOM: un teléfono con wallpaper (npwd), el lab               |
| `backdrop` + `refraction` | Suma `feDisplacementMap` (SVG) sobre lo que hay detrás                                                        | Idem; solo Chromium; efecto, no función                                        |
| sólido                    | Sin transparencia                                                                                             | Reduced transparency, forced-colors, `solid`, `data-glass="solid"` en `<html>` |

Reglas:

1. **Glass es opt-in.** La skin por defecto es `Surface` sólido. Nada recibe glass sin pedirlo (`<Glass>` o `glass` en `Panel`).
2. **El texto sobre glass pasa AA con cualquier cosa detrás.** El tinte es alto (80 % Void, 92 % Dawn) y el test mide `ink` e
   `ink-muted` en el peor caso (negro y blanco detrás). `ink-subtle` no está garantizado sobre glass: no lo uses. Nunca bajar el tinte.
3. **Blur del mundo = Lua**, no CSS: `TriggerScreenblurFadeIn(ms)` / `TriggerScreenblurFadeOut(ms)` vía `useScreenBlur`. Solo para
   menús modales, nunca HUD.
4. **Sólido** bajo `prefers-reduced-transparency` y `forced-colors`. Como CEF casi nunca recibe esa preferencia, hay un ajuste
   propio (`data-glass="solid"` en `<html>`) para que el servidor lo exponga en sus opciones.
5. **Costo**: nada en loop, sin rAF en reposo, sin `will-change` permanente. `backdrop-filter` y el filtro SVG solo en modo `backdrop`.

## Movimiento

120 ms hover/press, 180 ms panel (`Reveal`), 240 ms reflow. Ease-out de marca, sin rebotes, entradas de 8 px desde abajo.
Animación solo en cambio de estado; con `prefers-reduced-motion` queda solo la opacidad. Press `scale(0.98)` por CSS, apagado con reduced motion.

## Componentes

`Glass` · `Surface` · `Panel` · `Reveal` · `Button` (`primary` | `secondary` | `ghost` | `danger`; uno primario por pantalla) ·
`IconButton` (`label` obligatorio) · `Chip` (`aria-pressed` / `aria-selected`) · `Kbd` · `Field` (label obligatorio, `hint`, `error`).
Radios del DS: controles `rounded-md` (12), paneles `rounded-lg` (16), tags `rounded-sm` (6).

## Checklist (cada pantalla que use el kit)

- [ ] Roles, sin hex ni colores de marca.
- [ ] Glass solo donde se pidió; en juego se probó con y sin blur de Lua.
- [ ] Foco visible (outline 2 px, `focus`), teclado completo, Escape cierra.
- [ ] Reduced motion y reduced transparency respetados.
- [ ] Un solo primario por pantalla; sin bordes de un solo lado.
