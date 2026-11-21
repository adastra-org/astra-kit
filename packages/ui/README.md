# @adastrarp/ui

Componentes y primitivas de UI para las NUI de Ad Astra, sobre los roles de `@adastrarp/tokens`. Peers: `react` ^19, `motion`,
`tailwindcss` ^4, `lucide-react`, `@adastrarp/tokens`, `@adastrarp/goo`, `@adastrarp/nui`. Publica source (`.tsx`).

```css
@import 'tailwindcss';
@import '@adastrarp/tokens/theme.css';
@import '@adastrarp/ui/styles.css'; /* @source de los componentes: node_modules no se escanea solo */
```

## API

```tsx
<Glass mode="fake" | "backdrop" refraction={true | 0–40} solid className style />  // skin translúcida, OPT-IN
<Surface level="base" | "raised" | "overlay" | "sunken" elevated />                  // sólido, la skin por defecto
<Panel title actions glass={false | 'fake' | 'backdrop'} refraction level />          // encabezado + skin; region etiquetada
<Reveal open className />                      // entra/sale al cambiar `open` (motion, 180 ms); reduced motion -> opacidad
<Button variant="primary" | "secondary" | "ghost" | "danger" size="sm" | "md" />
<IconButton label icon variant size />         // label obligatorio = aria-label + tooltip
<Chip selected />                              // aria-pressed, o aria-selected con role="tab"
<Kbd keys="Ctrl+K" />                          // teclas; texto plano para lectores
<Field label hint error {...inputProps} />     // label obligatorio, aria-invalid y aria-describedby
```

## Glass

- `fake` (default): sin blur; tinte alto + brillo interno + borde en gradiente + ruido. Es lo que funciona sobre el juego.
- `backdrop`: `backdrop-filter` real; solo tiene sentido con DOM detrás (teléfono con wallpaper). `refraction` suma un
  `feDisplacementMap` SVG (Chromium). TypeScript no deja pasar `refraction` en modo `fake`.
- Sólido bajo `prefers-reduced-transparency`, `forced-colors`, la prop `solid` o `data-glass="solid"` en `<html>`.
- Texto sobre glass: solo `ink` e `ink-muted` (AA medido en el peor caso). Detalle: [DESIGN.md](../../DESIGN.md).

Para el blur del mundo en menús modales: `useScreenBlur` de `@adastrarp/nui` (lo hace Lua).

## Primitivas de UI

Reemplazan lo que hoy da ox_lib, sin atarse a ox_lib ni a un framework: cada una es un componente + un mensaje tipado en
[`@adastrarp/nui`](../nui/README.md#primitivas-contrato-de-mensajes). `<NuiPrimitives />` las conecta todas a la vez (se monta
una vez en la raíz); también se pueden usar sueltas.

```tsx
import { NuiPrimitives } from '@adastrarp/ui'

;<NuiPrimitives icons={{ car: <Car size={20} /> }} /> // Lua manda { action, data }; ver el contrato
```

`?page=nui` del lab (`bun run lab`) dispara cada una con el mismo mensaje que mandaría Lua.

| Primitiva    | Componente / hook                               | Mensaje                             |
| ------------ | ----------------------------------------------- | ----------------------------------- |
| Notificación | `<Notifications items />`, `useNotifications()` | `notify:show`, `notify:dismiss`     |
| Progreso     | `<Progress data onEnd />`                       | `progress:start`, `progress:cancel` |
| Text UI      | `<TextUi data />`                               | `textui:show`, `textui:hide`        |
| Menú         | `<ContextMenu data onSelect onClose />`         | `context:open`, `context:close`     |

### Notificación

Toast pill: success / info / warning / error, siempre con ícono (y el tipo en texto para lectores), título opcional, apilado.
Nace del borde derecho como goo (`gentle`, con arco) y se pega a las vecinas cuando la pila se reacomoda. No toma foco ni
mouse (`pointer-events-none`); `aria-live="polite"`, y los errores son `role="alert"`. `duration` en ms (default 4000,
`0` = no se cierra sola); repetir el `id` reemplaza la notificación. Reduced motion: las pills saltan a su caja final.

### Progreso

`<Progress data onEnd />` (o `ProgressBar` / `ProgressCircle`). Barra pill con etiqueta y porcentaje tabular, o círculo con
anillo. Dura `duration` ms y llama `onEnd('completed')` una sola vez; con `canCancel` la tecla (`cancelKey`, default X) o
Escape llama `onEnd('cancelled')` y se muestra la tecla con `Kbd`. El avance se escribe por ref (sin re-render) y el rAF solo
corre mientras hay una corrida. Es información, no decoración: reduced motion no lo frena. `role="progressbar"` con
`aria-valuenow`.

### Text UI

`<TextUi data={{ key: 'E', text: 'Abrir' }} />`: pill con `Kbd` y texto. Sin `key`, solo texto. `role="status"`, sin foco ni
mouse. En el host entra y sale con `Reveal` (180 ms, solo opacidad con reduced motion); un `textui:show` nuevo reemplaza el
anterior.

### Menú de contexto

`<ContextMenu data onSelect onClose icons />`. `role="menu"` con ítems `menuitem` y tabindex móvil (una sola parada de Tab).
↑ ↓ Inicio Fin mueven y dan la vuelta, Enter / Espacio eligen, → abre un submenú, ← / Backspace / Escape vuelven y Escape en
la raíz cierra. Los deshabilitados se saltan y quedan `aria-disabled`. Una fila con descripción o metadata pasa de pill a
`rounded-lg`. `onSelect` recibe el `path` de ids; en el host, elegir o cerrar avisa a Lua (`context:select` / `context:close`)
y el menú usa `useScreenBlur`.
