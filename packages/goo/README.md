# @adastrarp/goo

Motor de movimiento goo (metaballs) para el sistema de pills de Ad Astra. Basado en física: springs con los presets del DS
Faku (`snappy`, `gentle`, `heavy`, `wobbly`, `float`), anticipación,
arcos, squash & stretch. El loop corre solo mientras algo se mueve. Peer: `react` ^19. Publica source (`.ts`/`.tsx`).

```tsx
import { Goo, GooBlob, row } from '@adastrarp/goo'

const widths = stats.map((s) => (s.open ? 136 : 40))
const xs = row(widths, 12, 48)

<Goo fill="var(--surface-raised)" style={{ width: 1920, height: 1080 }}>
  {stats.map((s, i) => (
    <GooBlob key={s.id} id={s.id} group="estado" x={xs[i]} y={992} w={widths[i]} h={40} label={`${s.label} ${s.value} %`}>
      <StatContent {...s} />   {/* ancho fijo: el blob lo recorta y lo revela al estirarse */}
    </GooBlob>
  ))}
</Goo>
```

## API

```tsx
<Goo fill stiffness damping mass anticipation arc neck reach instant className style />  // un <svg>, un <path> (la unión)
<GooBlob id x y w h group spring stiffness anticipation arc from label />                // una pill; el contenido sigue a la forma
useGooEngine()                                                                       // el motor del <Goo> más cercano
```

| Ajuste         | Default        | Qué hace                                                                      |
| -------------- | -------------- | ----------------------------------------------------------------------------- |
| `stiffness`    | 320 (`snappy`) | Rigidez `k`                                                                   |
| `damping`      | 24 (`snappy`)  | Coeficiente `c`. Crítico (sin rebote) = `critical(k, m)` = 2·√(k·m)           |
| `mass`         | 1 (`snappy`)   | Masa `m`: más inercia, más pesado                                             |
| `anticipation` | 0.5            | Impulso en contra del cambio. 0.5 ≈ 7 % de retroceso, 1 ≈ 21 %                |
| `arc`          | 0.35           | Impulso perpendicular al recorrido. 0.35 ≈ 13 % de comba                      |
| `neck`         | 0.05           | Cuánto se afina el cuerpo con la velocidad del ancho                          |
| `reach`        | 0.3            | Separación (en diámetros de la pill más chica) a la que aparece el puente goo |
| `instant`      | reduced motion | Salta al objetivo, sin frames                                                 |

Por pill: `group` (solo pills del mismo grupo se unen), `spring` (un preset, p. ej. `"gentle"` para lo que nace, o
`{ stiffness, damping, mass }`), `stiffness` (vecinas más lentas = follow-through), `from` (punto
donde nace, p. ej. el centro de otra pill), `anticipation` y `arc` propios.

## Cómo funciona

- Una pill = sus dos círculos extremos + un puente metaball entre ellos + un cuerpo rectangular. Con cuello 0 la unión es
  exactamente la cápsula; con cuello > 0 el cuerpo baja y queda la curva líquida.
- Pills vecinas del mismo grupo: metaball entre sus círculos más cercanos, que se afina hasta 0 en el límite de `reach` (no
  salta). Si se solapan, un cuerpo las funde en una sola.
- Todo sale en un solo `d` (subrutas horarias, `nonzero`): un `<path>` por capa. El `d` y la posición del contenido se
  escriben por ref en cada frame; React no re-renderiza durante la animación.
- Sin `filter` SVG ni `backdrop-filter`: los bordes quedan nítidos, los íconos y el texto no se deforman, y CEF no paga
  un filtro por frame.

`@adastrarp/goo/core` exporta el motor y la geometría sin React (`GooEngine`, `metaballPath`, `pillPath`, `bridgePath`,
`stepSpring`, `PRESETS`, `critical`, `dampingRatio`).
