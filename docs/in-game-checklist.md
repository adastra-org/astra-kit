# Verificación en el juego (pendiente)

Todo lo de abajo está sin probar en FiveM. Lo único verificado es: tests (`bun test`), typecheck, lint, build del lab y capturas del
lab en Edge (Chromium de escritorio). Marcar `[x]` solo tras probarlo en el cliente.

## Compatibilidad CEF

- [ ] Versión de Chromium del CEF de FiveM del servidor. **Tailwind v4 exige Chrome >= 111** (`@property`, `color-mix()`, `@layer`).
      Si es menor, la NUI no renderiza bien y hay que fijar Tailwind v3 o actualizar el artefacto de FiveM.
- [ ] `mask-composite` (borde en gradiente) y CSS nesting funcionan.
- [ ] Las fuentes (woff2 bundleadas por Vite en `web/dist`) cargan desde `nui://`.

## Bridge

- [ ] `fetchNui` llega al `RegisterNUICallback` y la respuesta (`cb`) vuelve parseada.
- [ ] `GetParentResourceName` devuelve el resource real; `isEnvBrowser()` es `false` en el juego (`window.invokeNative`).
- [ ] `SendNUIMessage` -> `useNuiEvent` / `useNuiVisibility` (`show` / `hide`).
- [ ] Escape con `SetNuiFocus(true, true)` llega a la NUI y cierra; el foco vuelve al juego.
- [ ] `adastra:screenblur` aplica `TriggerScreenblurFadeIn` / `FadeOut` y no queda colgado al reiniciar el resource.
      Firmas verificadas en los natives (`BOOL ...(float transitionTime)`, ms); su comportamiento real no.

## Glass

- [ ] Confirmar que `backdrop-filter` no difumina el mundo (premisa del diseño). Si lo hiciera, `fake` deja de ser la única opción.
- [ ] `fake` sobre escenas reales (día, noche, interiores, cielo): legibilidad del texto.
- [ ] `backdrop` + `refraction` sobre DOM real (teléfono npwd con wallpaper).
- [ ] `prefers-reduced-transparency` llega a CEF; si no, el ajuste `data-glass="solid"` desde las opciones del jugador.
- [ ] Costo de frame con varios paneles glass abiertos (fake) y con `backdrop` (referencia: sin NUI abierta).
- [ ] Transparencia real: `html, body { background: transparent }` y nada de fondo opaco heredado.

## Publicación

- [ ] Primer `bun run release` de cada paquete y confirmar el scope `@adastra` en npm (ownership del scope no verificado).
- [ ] Repo `adastra-org/astra-kit` en GitHub (no creado) y Trusted Publishing, si se quiere CI.
