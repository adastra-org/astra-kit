import {
  debugData,
  emitNui,
  mockNui,
  useNuiVisibility,
  useScreenBlur,
} from '@adastra/nui'
import {
  Button,
  Chip,
  Field,
  Glass,
  IconButton,
  Kbd,
  Panel,
  Reveal,
  Surface,
  type GlassMode,
} from '@adastra/ui'
import { Search, Settings, X } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'

// "Juego" falso: lo que la NUI real tendría detrás. En el juego NO hay DOM ahí, solo el frame del motor.
const SCENES = {
  calle: {
    label: 'Calle de noche',
    css: 'radial-gradient(60% 50% at 20% 30%, #ff9a3c 0%, transparent 60%), radial-gradient(50% 60% at 80% 70%, #2f7bff 0%, transparent 60%), linear-gradient(160deg, #0b1020, #1a1030 60%, #05070d)',
  },
  dia: {
    label: 'Mediodía (fondo claro)',
    css: 'linear-gradient(180deg, #9fd3ff 0%, #f4f1e4 55%, #d9c9a3 100%)',
  },
  blanco: { label: 'Blanco (peor caso AA)', css: '#ffffff' },
  negro: { label: 'Negro (peor caso AA)', css: '#000000' },
  banner: {
    label: 'DOM detrás (banner)',
    css: 'url(/banner-dusk.png) center / cover, #5d12d2',
  },
} as const
type SceneId = keyof typeof SCENES

type Skin = 'solid' | GlassMode | 'refraction'
const SKINS: { id: Skin; label: string }[] = [
  { id: 'solid', label: 'Sólido' },
  { id: 'fake', label: 'Glass fake' },
  { id: 'backdrop', label: 'Glass backdrop' },
  { id: 'refraction', label: 'Backdrop + refracción' },
]

// Estado inicial por URL (?scene=blanco&skin=refraction&theme=light&tint=90) para compartir una combinación.
const query = new URLSearchParams(location.search)
const pick = <T extends string>(
  key: string,
  allowed: readonly T[],
  fallback: T,
): T => {
  const v = query.get(key)
  return allowed.includes(v as T) ? (v as T) : fallback
}

export function App() {
  const [scene, setScene] = useState<SceneId>(
    pick('scene', Object.keys(SCENES) as SceneId[], 'calle'),
  )
  const [skin, setSkin] = useState<Skin>(
    pick(
      'skin',
      SKINS.map((s) => s.id),
      'fake',
    ),
  )
  const [theme, setTheme] = useState<'dark' | 'light'>(
    pick<'dark' | 'light'>('theme', ['dark', 'light'], 'dark'),
  )
  const [tint, setTint] = useState(Number(query.get('tint')) || 80)
  const [blur, setBlur] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const { visible, show, close } = useNuiVisibility()

  const push = (line: string) => setLog((l) => [line, ...l].slice(0, 6))

  useScreenBlur(blur, 300)

  // Lo que Lua haría: responder a los callbacks. Solo existe en el navegador.
  useEffect(() => {
    const offClose = mockNui('close', () => {
      push('Lua <- close  (SetNuiFocus(false, false))')
      return {}
    })
    const offBlur = mockNui(
      'adastra:screenblur',
      (d: { enabled: boolean; ms: number }) => {
        push(
          d.enabled
            ? `Lua <- TriggerScreenblurFadeIn(${d.ms})`
            : `Lua <- TriggerScreenblurFadeOut(${d.ms})`,
        )
        return {}
      },
    )
    const cancel = debugData([{ action: 'show' }], 300)
    return () => {
      offClose()
      offBlur()
      cancel()
    }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  useEffect(() => {
    if (skin === 'solid') document.documentElement.dataset.glass = 'solid'
    else delete document.documentElement.dataset.glass
  }, [skin])

  const glass: false | GlassMode =
    skin === 'solid' ? false : skin === 'fake' ? 'fake' : 'backdrop'
  const refraction = skin === 'refraction'
  const vars = { '--glass-tint': `${tint}%` } as CSSProperties

  return (
    <div className="grid min-h-screen grid-cols-[18rem_1fr]">
      <aside className="flex flex-col gap-5 border-r border-border bg-surface p-4">
        <h1 className="text-h4">astra-kit lab</h1>
        <Group label="Fondo (el “juego”)">
          {(Object.keys(SCENES) as SceneId[]).map((id) => (
            <Chip key={id} selected={scene === id} onClick={() => setScene(id)}>
              {SCENES[id].label}
            </Chip>
          ))}
        </Group>
        <Group label="Skin del panel">
          {SKINS.map((s) => (
            <Chip
              key={s.id}
              selected={skin === s.id}
              onClick={() => setSkin(s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </Group>
        <Group label="Tema">
          <Chip selected={theme === 'dark'} onClick={() => setTheme('dark')}>
            Void
          </Chip>
          <Chip selected={theme === 'light'} onClick={() => setTheme('light')}>
            Dawn
          </Chip>
        </Group>
        <label className="flex flex-col gap-1.5 text-label">
          Tinte del glass: {tint}%
          <input
            type="range"
            min={50}
            max={100}
            value={tint}
            onChange={(e) => setTint(Number(e.target.value))}
          />
          <span className="text-caption text-ink-muted">
            Por debajo de 80 % (Void) / 92 % (Dawn) el texto deja de pasar AA en
            el peor caso.
          </span>
        </label>
        <Group label="Lua simulado">
          <Chip selected={blur} onClick={() => setBlur((b) => !b)}>
            Blur del mundo
          </Chip>
          <Chip onClick={() => emitNui('show')}>show</Chip>
          <Chip onClick={() => emitNui('hide')}>hide</Chip>
        </Group>
        <Surface level="sunken" className="p-3">
          <p className="mb-1 text-eyebrow">Eventos a Lua</p>
          <ul className="text-code text-ink-muted">
            {log.length === 0 && <li>—</li>}
            {log.map((l, i) => (
              <li key={`${l}-${i}`}>{l}</li>
            ))}
          </ul>
        </Surface>
      </aside>

      <main
        className="relative grid place-items-center overflow-hidden p-8"
        style={{ background: SCENES[scene].css, ...vars }}
      >
        {/* Franjas contrastadas: dan algo que difuminar/refractar cuando hay DOM detrás. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 grid h-28 -translate-y-1/2 grid-cols-6"
        >
          {[
            '#ff4d6d',
            '#ffd23f',
            '#3ddc97',
            '#35a7ff',
            '#b931fc',
            '#ffffff',
          ].map((c) => (
            <div key={c} className="opacity-90" style={{ background: c }} />
          ))}
        </div>

        <Reveal open={visible} className="relative w-[26rem]">
          <Panel
            title="Inventario"
            glass={glass}
            refraction={refraction}
            actions={
              <div className="flex gap-1">
                <IconButton label="Ajustes" icon={<Settings size={18} />} />
                <IconButton
                  label="Cerrar"
                  icon={<X size={18} />}
                  onClick={close}
                />
              </div>
            }
          >
            <div className="flex flex-col gap-4">
              <p className="text-body-sm text-ink-muted">
                Texto secundario sobre la skin elegida. Cambia el fondo y mira
                si se lee.
              </p>
              <Field
                label="Buscar objeto"
                hint="Por nombre o cantidad"
                placeholder="Botiquín"
              />
              <Field
                label="Patente"
                error="Ya existe una con ese número"
                defaultValue="ABC 123"
              />
              <div className="flex flex-wrap gap-2">
                <Chip selected>Todo</Chip>
                <Chip>Armas</Chip>
                <Chip>Consumibles</Chip>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary">
                  <Search size={16} /> Usar
                </Button>
                <Button>Soltar</Button>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="danger">Destruir</Button>
              </div>
              <p className="flex items-center gap-2 text-caption text-ink-muted">
                <Kbd keys="E" /> usar · <Kbd keys="Esc" /> cerrar
              </p>
            </div>
          </Panel>
        </Reveal>

        {!visible && (
          <Glass className="relative p-4">
            <Button variant="primary" onClick={show}>
              Mostrar panel
            </Button>
          </Glass>
        )}
      </main>
    </div>
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
