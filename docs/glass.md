# Glass

## El problema

La NUI de FiveM es una página CEF transparente compuesta **encima** del frame del juego. El juego se dibuja en otra capa: no
está en el DOM. `backdrop-filter` solo muestrea lo que el navegador tiene detrás del elemento dentro de la página. Sobre un fondo
transparente eso es nada, así que el mundo **no** se difumina. (Esto es lo esperado por cómo compone CEF; no se verificó en el
juego, ver [in-game-checklist.md](in-game-checklist.md).)

## Los tres niveles

1. **`fake`** (default). Se parece a vidrio sin pedirle nada al GPU: `color-mix(surface-raised 80 %, transparent)`, un sheen vertical, `inset 0 1px` de brillo, un borde en gradiente (pseudo-elemento enmascarado) y ruido SVG de 160 px. Sin `backdrop-filter`.
2. **`backdrop`**. `backdrop-filter: blur(16px) saturate(1.35)`. Para DOM detrás.
3. **Blur del mundo desde Lua**. `TriggerScreenblurFadeIn(ms)` / `TriggerScreenblurFadeOut(ms)` desenfocan el frame del juego.
   `useScreenBlur(active, ms)` llama al callback `adastra:screenblur` solo al cambiar `active`. Para menús modales.

`fake` + blur del mundo de Lua es la combinación pensada para menús sobre el juego.

## Contraste

`tokens.test.ts` calcula, por tema, el color de `surface-raised` al tinte de `glass.css` sobre negro y sobre blanco, y exige 4.5:1
para `ink` e `ink-muted`. Void 80 %, Dawn 92 %. Bajar el tinte rompe el test. `ink-subtle` no está cubierto: no va sobre glass.

## Accesibilidad y preferencias

Sólido (sin transparencia, ruido ni gradiente de borde) con `prefers-reduced-transparency: reduce`, `forced-colors: active`,
`<Glass solid>` o `<html data-glass="solid">`. El último es el que el servidor debería exponer como opción de jugador, porque CEF
puede no reenviar la preferencia del SO.

## Refracción

`<Glass mode="backdrop" refraction={14}>` crea un `<svg>` de 0x0 con `feTurbulence` + `feDisplacementMap` y lo referencia con
`--glass-refract: url(#id)` dentro de `backdrop-filter`. Es estático (sin animación). `backdrop-filter: url(#…)` es
Chromium-only; en otros navegadores el filtro se descarta entero. Verificado en Edge (Chromium) con el lab; no en CEF.

## Afinar sin el juego

`bun run lab`. Fondos de peor caso (blanco, negro, mediodía), slider de tinte, Void/Dawn, y la lista de eventos que Lua recibiría.
