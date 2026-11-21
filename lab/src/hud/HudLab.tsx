import {
  GOO_DEFAULT,
  Goo,
  GooBlob,
  PRESETS,
  critical,
  row,
  type GooSettings,
  type SpringPreset,
} from '@adastrarp/goo'
import { Button, Chip } from '@adastrarp/ui'
import {
  Droplet,
  Fuel,
  HeartPulse,
  Link,
  PlaneLanding,
  Shield,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AlertContent, StatContent, TextContent, ValueContent } from './parts'
import type { Tone } from './tone'
import { LabNav } from '../LabNav'

// Escenario a 1920 × 1080, escalado para entrar en la ventana. Medidas sobre la grilla del DS (4/8, márgenes de 48).
const W = 1920
const H = 1080
const M = 48
const GAP = 12
const HEAD = 40
const PILL = 136
const MINIMAP = { x: M, y: H - M - HEAD - GAP - 184, w: 288, h: 184 }
const ROW_Y = H - M - HEAD

type Screen = 'pie' | 'auto' | 'avion'
type Region = { x: number; y: number; w: number; h: number }

// Zoom al HUD (16:9): lo que se ve en un teléfono sin achicar todo el escenario.
const FOCUS: Record<Screen, Region> = {
  pie: { x: 0, y: H - 360, w: 640, h: 360 },
  auto: { x: W / 2 - 320, y: H - 360, w: 640, h: 360 },
  avion: { x: 0, y: H - 360, w: 640, h: 360 },
}
const FULL: Region = { x: 0, y: 0, w: W, h: H }
const narrow = () =>
  typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches
type StatId = 'vida' | 'armadura' | 'hambre' | 'sed' | 'estamina'

const STATS: { id: StatId; label: string; icon: React.ReactNode }[] = [
  { id: 'vida', label: 'Vida', icon: <HeartPulse size={18} /> },
  { id: 'armadura', label: 'Armadura', icon: <Shield size={18} /> },
  { id: 'hambre', label: 'Hambre', icon: <Utensils size={18} /> },
  { id: 'sed', label: 'Sed', icon: <Droplet size={18} /> },
  { id: 'estamina', label: 'Estamina', icon: <Zap size={18} /> },
]

type AlertId = 'cinturon' | 'nafta' | 'motor'
const ALERTS: Record<
  AlertId,
  { label: string; tone: Tone; icon: React.ReactNode }
> = {
  cinturon: {
    label: 'Sin cinturón',
    tone: 'danger',
    icon: <Link size={18} />,
  },
  nafta: { label: 'Nafta baja', tone: 'warning', icon: <Fuel size={18} /> },
  motor: { label: 'Motor dañado', tone: 'danger', icon: <Wrench size={18} /> },
}

const SCREENS: { id: Screen; label: string }[] = [
  { id: 'pie', label: 'A pie' },
  { id: 'auto', label: 'Auto (centrado)' },
  { id: 'avion', label: 'Avión (alternativo)' },
]

const SLIDERS: {
  key: keyof Omit<GooSettings, 'instant'>
  label: string
  min: number
  max: number
  step: number
  hint: string
}[] = [
  {
    key: 'stiffness',
    label: 'Rigidez (k)',
    min: 20,
    max: 600,
    step: 10,
    hint: 'Timing: más rígido, más rápido.',
  },
  {
    key: 'damping',
    label: 'Amortiguamiento (c)',
    min: 2,
    max: 60,
    step: 1,
    hint: 'Crítico = 2·√(k·m): llega sin pasarse. Menos, rebota.',
  },
  {
    key: 'mass',
    label: 'Masa (m)',
    min: 0.5,
    max: 4,
    step: 0.1,
    hint: 'Inercia: más masa, más pesado y lento.',
  },
  {
    key: 'anticipation',
    label: 'Anticipación',
    min: 0,
    max: 1.5,
    step: 0.05,
    hint: 'Retrocede antes de moverse.',
  },
  {
    key: 'arc',
    label: 'Arco',
    min: 0,
    max: 1,
    step: 0.05,
    hint: 'Comba de la trayectoria.',
  },
  {
    key: 'neck',
    label: 'Squash & stretch',
    min: 0,
    max: 0.15,
    step: 0.005,
    hint: 'Cuánto se afina al estirarse rápido.',
  },
  {
    key: 'reach',
    label: 'Alcance del goo',
    min: 0,
    max: 1,
    step: 0.05,
    hint: 'Distancia (en diámetros) a la que se pegan.',
  },
]

const PRESET_LIST: { id: SpringPreset; hint: string }[] = [
  { id: 'snappy', hint: 'Estados de UI (default)' },
  { id: 'gentle', hint: 'Entradas' },
  { id: 'heavy', hint: 'Paneles' },
  { id: 'wobbly', hint: 'Arrastre' },
  { id: 'float', hint: 'Deriva' },
]

const query = new URLSearchParams(location.search)

export function HudLab() {
  const [screen, setScreen] = useState<Screen>(
    (['pie', 'auto', 'avion'] as const).find((s) => s === query.get('hud')) ??
      'auto',
  )
  const [physics, setPhysics] = useState<Omit<GooSettings, 'instant'>>({
    stiffness: GOO_DEFAULT.stiffness,
    damping: GOO_DEFAULT.damping,
    mass: GOO_DEFAULT.mass,
    anticipation: GOO_DEFAULT.anticipation,
    arc: GOO_DEFAULT.arc,
    neck: GOO_DEFAULT.neck,
    reach: GOO_DEFAULT.reach,
  })
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [zoom, setZoom] = useState(narrow)
  const [stats, setStats] = useState<Record<StatId, number>>({
    vida: 72,
    armadura: 90,
    hambre: 64,
    sed: 22,
    estamina: 80,
  })
  const [open, setOpen] = useState<Set<StatId>>(new Set())
  const [alerts, setAlerts] = useState<AlertId[]>([])
  const [speed, setSpeed] = useState(87)
  const [gear, setGear] = useState(true)
  const timers = useRef(new Map<StatId, number>())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  // Un valor cambió: la pill se estira para mostrarlo y vuelve a cabeza a los 2.5 s.
  const change = (id: StatId, delta: number) => {
    setStats((s) => ({ ...s, [id]: Math.max(0, Math.min(100, s[id] + delta)) }))
    setOpen((o) => new Set(o).add(id))
    clearTimeout(timers.current.get(id))
    timers.current.set(
      id,
      window.setTimeout(() => {
        setOpen((o) => {
          const n = new Set(o)
          n.delete(id)
          return n
        })
      }, 2500),
    )
  }
  useEffect(() => {
    const t = timers.current
    return () => t.forEach((id) => clearTimeout(id))
  }, [])

  const toggleAlert = (id: AlertId) =>
    setAlerts((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] md:grid-cols-[20rem_minmax(0,1fr)] md:grid-rows-1">
      <aside className="order-2 flex min-h-0 flex-col gap-5 overflow-y-auto border-t border-border bg-surface p-4 md:order-1 md:border-t-0 md:border-r">
        <div className="flex flex-col gap-1">
          <h1 className="text-h4">HUD · pills + goo</h1>
          <LabNav current="hud" />
        </div>
        <Group label="Pantalla">
          {SCREENS.map((s) => (
            <Chip
              key={s.id}
              selected={screen === s.id}
              onClick={() => setScreen(s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </Group>
        <Group label="Vista">
          <Chip selected={zoom} onClick={() => setZoom(true)}>
            Zoom al HUD
          </Chip>
          <Chip selected={!zoom} onClick={() => setZoom(false)}>
            Pantalla completa
          </Chip>
        </Group>
        <Group label="Eventos">
          <Button size="sm" onClick={() => change('vida', -18)}>
            Recibir daño
          </Button>
          <Button size="sm" onClick={() => change('vida', 30)}>
            Curar
          </Button>
          <Button size="sm" onClick={() => change('hambre', 25)}>
            Comer
          </Button>
          <Button size="sm" onClick={() => change('sed', 40)}>
            Tomar agua
          </Button>
          <Button size="sm" onClick={() => change('estamina', -30)}>
            Correr
          </Button>
          <Button size="sm" onClick={() => change('armadura', -25)}>
            Bala en el chaleco
          </Button>
        </Group>
        {screen !== 'pie' && (
          <>
            <Group label="Vehículo">
              {screen === 'auto' &&
                (Object.keys(ALERTS) as AlertId[]).map((id) => (
                  <Chip
                    key={id}
                    selected={alerts.includes(id)}
                    onClick={() => toggleAlert(id)}
                  >
                    {ALERTS[id].label}
                  </Chip>
                ))}
              {screen === 'avion' && (
                <Chip selected={gear} onClick={() => setGear((g) => !g)}>
                  Tren abajo
                </Chip>
              )}
            </Group>
            <label className="flex flex-col gap-1.5 text-label">
              Velocidad: {speed}
              <input
                type="range"
                min={0}
                max={screen === 'avion' ? 400 : 240}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </label>
          </>
        )}
        <Group label="Física (presets del DS Faku)">
          {PRESET_LIST.map((p) => {
            const cfg = PRESETS[p.id]
            const on =
              physics.stiffness === cfg.stiffness &&
              physics.damping === cfg.damping &&
              physics.mass === cfg.mass
            return (
              <Chip
                key={p.id}
                selected={on}
                title={p.hint}
                onClick={() => setPhysics((s) => ({ ...s, ...cfg }))}
              >
                {p.id}
              </Chip>
            )
          })}
          <Chip
            selected={
              physics.damping ===
              Math.round(critical(physics.stiffness, physics.mass))
            }
            title="Sin rebote"
            onClick={() =>
              setPhysics((s) => ({
                ...s,
                damping: Math.round(critical(s.stiffness, s.mass)),
              }))
            }
          >
            crítico
          </Chip>
          <div className="flex w-full flex-col gap-3">
            {SLIDERS.map((s) => (
              <label key={s.key} className="flex flex-col gap-1 text-label">
                <span className="flex justify-between">
                  {s.label}
                  <span className="text-data text-ink-muted">
                    {physics[s.key]}
                  </span>
                </span>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={physics[s.key]}
                  onChange={(e) =>
                    setPhysics((p) => ({
                      ...p,
                      [s.key]: Number(e.target.value),
                    }))
                  }
                />
                <span className="text-caption text-ink-muted">{s.hint}</span>
              </label>
            ))}
          </div>
        </Group>
        <Group label="Tema">
          <Chip selected={theme === 'dark'} onClick={() => setTheme('dark')}>
            Void
          </Chip>
          <Chip selected={theme === 'light'} onClick={() => setTheme('light')}>
            Dawn
          </Chip>
        </Group>
      </aside>

      <Stage region={zoom ? FOCUS[screen] : FULL}>
        <Minimap />
        <Goo
          {...physics}
          instant={query.get('motion') === 'off' || undefined}
          style={{ width: W, height: H }}
        >
          <StatusRow stats={stats} open={open} stiffness={physics.stiffness} />
          {screen === 'auto' && <AutoCluster speed={speed} alerts={alerts} />}
          {screen === 'avion' && <PlaneCluster speed={speed} gear={gear} />}
        </Goo>
      </Stage>
    </div>
  )
}

/** Fila de estado bajo el minimapa. Las vecinas a la derecha tienen más inercia: follow-through y el goo se nota. */
function StatusRow({
  stats,
  open,
  stiffness,
}: {
  stats: Record<StatId, number>
  open: Set<StatId>
  stiffness: number
}) {
  const widths = STATS.map((s) => (open.has(s.id) ? PILL : HEAD))
  const xs = row(widths, GAP, M)
  return STATS.map((s, i) => (
    <GooBlob
      key={s.id}
      id={s.id}
      group="estado"
      x={xs[i]!}
      y={ROW_Y}
      w={widths[i]!}
      h={HEAD}
      stiffness={stiffness * Math.pow(0.82, i)}
      arc={0}
      label={`${s.label} ${Math.round(stats[s.id])} %`}
    >
      <StatContent icon={s.icon} label={s.label} value={stats[s.id]} />
    </GooBlob>
  ))
}

/** Velocímetro centrado: cabeza grande, calle debajo y alertas que brotan de la cabeza en arco. */
function AutoCluster({ speed, alerts }: { speed: number; alerts: AlertId[] }) {
  const size = 120
  const cx = W / 2
  const cy = H - M - HEAD - GAP - size / 2
  const R = size / 2 + 16 + HEAD / 2
  const angles = [-64, -32, 0, 32, 64]
  const street = 264
  return (
    <>
      <GooBlob
        id="velocidad"
        group="auto"
        x={cx - size / 2}
        y={cy - size / 2}
        w={size}
        h={size}
        label={`${speed} kilómetros por hora`}
      >
        <ValueContent
          size={size}
          value={speed}
          unit="km/h"
          ring={speed / 240}
        />
      </GooBlob>
      <GooBlob
        id="calle"
        x={cx - street / 2}
        y={H - M - HEAD}
        w={street}
        h={HEAD}
      >
        <TextContent width={street}>
          <span className="text-data text-accent">3ª</span>
          <span>Vinewood Blvd</span>
        </TextContent>
      </GooBlob>
      {alerts.map((id, i) => {
        const a = ((angles[i] ?? 0) * Math.PI) / 180
        const x = cx + R * Math.sin(a) - HEAD / 2
        const y = cy - R * Math.cos(a) - HEAD / 2
        return (
          <GooBlob
            key={id}
            id={id}
            group="auto"
            x={x}
            y={y}
            w={HEAD}
            h={HEAD}
            from={{ x: cx - 4, y: cy - 4 }}
            spring="gentle"
            label={ALERTS[id].label}
          >
            <AlertContent icon={ALERTS[id].icon} tone={ALERTS[id].tone} />
          </GooBlob>
        )
      })}
    </>
  )
}

/** Variante alternativa (aviones): todo junto al minimapa, se mira de reojo. */
function PlaneCluster({ speed, gear }: { speed: number; gear: boolean }) {
  const size = 120
  const x = MINIMAP.x + MINIMAP.w + GAP
  const y = H - M - HEAD - GAP - size
  const side = x + size + GAP
  return (
    <>
      <GooBlob
        id="velocidad"
        group="avion"
        x={x}
        y={y}
        w={size}
        h={size}
        label={`${speed} nudos`}
      >
        <ValueContent size={size} value={speed} unit="kts" ring={speed / 400} />
      </GooBlob>
      <GooBlob
        id="combustible"
        group="avion"
        x={side}
        y={y + 8}
        w={HEAD}
        h={HEAD}
        label="Combustible bajo"
      >
        <AlertContent icon={<Fuel size={18} />} tone="warning" />
      </GooBlob>
      {gear && (
        <GooBlob
          id="tren"
          group="avion"
          x={side}
          y={y + size - HEAD - 8}
          w={HEAD}
          h={HEAD}
          from={{ x: x + size / 2, y: y + size / 2 }}
          spring="gentle"
          label="Tren de aterrizaje abajo"
        >
          <AlertContent icon={<PlaneLanding size={18} />} tone="accent" />
        </GooBlob>
      )}
      <GooBlob
        id="altitud"
        x={x}
        y={H - M - HEAD}
        w={size + GAP + HEAD}
        h={HEAD}
      >
        <TextContent width={size + GAP + HEAD}>
          <span className="text-data text-accent">ALT</span>
          <span>1.240 m</span>
        </TextContent>
      </GooBlob>
    </>
  )
}

function Minimap() {
  return (
    <div
      aria-hidden
      className="absolute rounded-lg border border-border bg-surface-sunken/70 p-4"
      style={{
        left: MINIMAP.x,
        top: MINIMAP.y,
        width: MINIMAP.w,
        height: MINIMAP.h,
      }}
    >
      <span className="text-eyebrow text-ink-subtle!">Minimapa · nativo</span>
    </div>
  )
}

/**
 * Escenario 1920 × 1080 escalado para entrar en el espacio disponible; `region` recorta (zoom al HUD en teléfono).
 * Fondo = "juego" falso.
 */
function Stage({
  region,
  children,
}: {
  region: Region
  children: React.ReactNode
}) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () =>
      setScale(Math.min(el.clientWidth / region.w, el.clientHeight / region.h))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [region.w, region.h])
  return (
    <main
      ref={box}
      className="relative order-1 grid h-[min(56.25vw,55dvh)] place-items-center overflow-hidden bg-surface-sunken md:order-2 md:h-auto"
    >
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ width: region.w * scale, height: region.h * scale }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: W,
            height: H,
            transform: `scale(${scale}) translate(${-region.x}px, ${-region.y}px)`,
            background:
              'radial-gradient(60% 50% at 20% 30%, #ff9a3c55 0%, transparent 60%), radial-gradient(50% 60% at 80% 70%, #2f7bff55 0%, transparent 60%), linear-gradient(160deg, #1b2236, #241a3a 60%, #0b0d14)',
          }}
        >
          {children}
        </div>
      </div>
    </main>
  )
}

function Group({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-eyebrow">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
