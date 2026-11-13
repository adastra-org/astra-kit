# @adastrarp/nui

Bridge tipado React <-> Lua para NUI de FiveM. Sin dependencias; peer `react` ^19. Publica source (`.ts`).

```bash
bun add @adastrarp/nui
```

## API

```ts
fetchNui<T>(event: string, data?: unknown): Promise<T>   // POST https://<resource>/<event>, JSON; resuelve lo que Lua pasó a cb()
useNuiEvent<T>(action: string, handler: (data: T) => void) // escucha window 'message' con { action, data }
useNuiVisibility(opts?): { visible, show, hide, close }    // show/hide desde Lua; Escape -> hide + fetchNui('close')
isEnvBrowser(): boolean                                    // true fuera del juego (no existe window.invokeNative)
getParentResourceName(): string                            // GetParentResourceName() o 'nui-frame-app'
```

Navegador sin juego:

```ts
mockNui('close', {}) // fetchNui('close') resuelve el mock en vez de hacer fetch
mockNui('buy', (d: { id: number }) => ({ ok: true }))
debugData([{ action: 'show' }], 500) // despacha { action, data } como si fuera Lua; no hace nada en el juego
emitNui('inventory', { items: [] }) // idem, inmediato
```

`mockNui` y `debugData` solo actúan si `isEnvBrowser()`; dentro del juego se ignoran. Sin mock, `fetchNui` resuelve `undefined`.

Si Lua responde con un status no-2xx, `fetchNui` lanza `NuiError` (`.event`, `.status`).

### Blur del mundo

`backdrop-filter` no puede difuminar el juego (no está en el DOM). El blur del mundo lo hace el motor desde Lua:

```ts
useScreenBlur(visible, 250) // in al activarse, out al desactivarse/desmontar; nada en loop
requestScreenBlur(true, 250) // imperativo; llama al callback 'adastra:screenblur'
```

Natives (firma verificada en los natives de GTA, `GRAPHICS`): `BOOL TRIGGER_SCREENBLUR_FADE_IN(float transitionTime)` y
`BOOL TRIGGER_SCREENBLUR_FADE_OUT(float transitionTime)`; el tiempo es en milisegundos. Úsalo en menús modales, no en HUD.

## Lado Lua mínimo

`fxmanifest.lua`:

```lua
fx_version 'cerulean'
game 'gta5'

ui_page 'web/dist/index.html'
files { 'web/dist/**' }
client_script 'client.lua'
```

`client.lua`:

```lua
local open = false

local function setOpen(state)
  open = state
  SetNuiFocus(state, state)                                  -- foco de mouse y teclado en la NUI
  SendNUIMessage({ action = state and 'show' or 'hide' })    -- lo recibe useNuiVisibility
end

-- fetchNui('close'): Escape o el botón de cerrar de la UI
RegisterNUICallback('close', function(_, cb)
  setOpen(false)
  cb({ ok = true })                                          -- siempre responder: si no, el fetch queda colgado
end)

-- requestScreenBlur / useScreenBlur
RegisterNUICallback('adastra:screenblur', function(data, cb)
  local ms = (data.ms or 250) + 0.0                          -- float
  if data.enabled then TriggerScreenblurFadeIn(ms) else TriggerScreenblurFadeOut(ms) end
  cb({ ok = true })
end)

-- no dejar el blur ni el foco colgados si el resource se reinicia con la UI abierta
AddEventHandler('onResourceStop', function(resource)
  if resource ~= GetCurrentResourceName() then return end
  TriggerScreenblurFadeOut(0.0)
  SetNuiFocus(false, false)
end)

RegisterCommand('astra_ui', function() setOpen(not open) end, false)
```

Para mandar datos a la UI: `SendNUIMessage({ action = 'inventory', data = { items = items } })` y en React
`useNuiEvent<{ items: Item[] }>('inventory', (d) => setItems(d.items))`.
