# @adastra/ui

Primitivas para las NUI de Ad Astra, sobre los roles de `@adastra/tokens`. Peers: `react` ^19, `motion`, `tailwindcss` ^4,
`@adastra/tokens`. Publica source (`.tsx`).

```css
@import 'tailwindcss';
@import '@adastra/tokens/theme.css';
@import '@adastra/ui/styles.css'; /* @source de los componentes: node_modules no se escanea solo */
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

Para el blur del mundo en menús modales: `useScreenBlur` de `@adastra/nui` (lo hace Lua).
