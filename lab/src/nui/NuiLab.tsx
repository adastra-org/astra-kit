import { mockNui } from '@adastrarp/nui'
import { Chip, NuiPrimitives, Surface } from '@adastrarp/ui'
import { Car } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  AlertGroup,
  ContextMenuGroup,
  Group,
  InputDialogGroup,
  NotificationGroup,
  ProgressGroup,
  RadialGroup,
  SkillCheckGroup,
  TextUiGroup,
} from './groups'

// Escenario: un "juego" falso detrás. En el juego real no hay DOM detrás de la NUI.
const SCENES = {
  calle:
    'radial-gradient(60% 50% at 20% 30%, #ff9a3c 0%, transparent 60%), radial-gradient(50% 60% at 80% 70%, #2f7bff 0%, transparent 60%), linear-gradient(160deg, #0b1020, #1a1030 60%, #05070d)',
  dia: 'linear-gradient(180deg, #9fd3ff 0%, #f4f1e4 55%, #d9c9a3 100%)',
} as const
type Scene = keyof typeof SCENES

/** `?page=nui`: dispara cada primitiva con el mismo mensaje que mandaría Lua. */
export function NuiLab() {
  const [scene, setScene] = useState<Scene>('calle')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [log, setLog] = useState<string[]>([])
  const push = (line: string) => setLog((l) => [line, ...l].slice(0, 8))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    return () => {
      delete document.documentElement.dataset.theme
    }
  }, [theme])

  // Lua simulado: responde a los callbacks y los anota.
  useEffect(() => {
    const events = [
      'progress:end',
      'context:select',
      'context:close',
      'input:result',
      'alert:result',
      'skillcheck:result',
      'radial:select',
      'radial:close',
    ]
    const offs = events.map((e) =>
      mockNui(e, (d: unknown) => {
        push(`Lua <- ${e} ${JSON.stringify(d)}`)
        return {}
      }),
    )
    return () => offs.forEach((off) => off())
  }, [])

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,55fr)_minmax(0,45fr)] md:grid-cols-[22rem_minmax(0,1fr)] md:grid-rows-1">
      <aside className="order-2 flex min-h-0 flex-col gap-6 overflow-y-auto border-t border-border bg-surface p-4 md:order-1 md:border-t-0 md:border-r">
        <div className="flex items-baseline justify-between">
          <h1 className="text-h4">Primitivas NUI</h1>
          <a href="?" className="text-caption text-ink-muted underline">
            Componentes
          </a>
        </div>
        <Group label="Fondo">
          {(Object.keys(SCENES) as Scene[]).map((s) => (
            <Chip key={s} selected={scene === s} onClick={() => setScene(s)}>
              {s === 'calle' ? 'Calle de noche' : 'Mediodía'}
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

        <NotificationGroup />
        <ProgressGroup />
        <TextUiGroup />
        <ContextMenuGroup />
        <InputDialogGroup />
        <AlertGroup />
        <SkillCheckGroup />
        <RadialGroup />

        <Surface level="sunken" className="p-3">
          <p className="mb-1 text-eyebrow">Eventos a Lua</p>
          <ul className="text-code break-all text-ink-muted">
            {log.length === 0 && <li>—</li>}
            {log.map((l, i) => (
              <li key={`${l}-${i}`}>{l}</li>
            ))}
          </ul>
        </Surface>
      </aside>

      <Stage background={SCENES[scene]}>
        <NuiPrimitives icons={{ car: <Car size={20} /> }} />
      </Stage>
    </div>
  )
}

// Ancho mínimo del escenario virtual: el diálogo más ancho (26rem) con su margen entra sin recortarse.
const MIN_STAGE = 480

/**
 * Escenario del lab. Las primitivas usan `position: fixed` (en el juego, la pantalla); acá el `transform` las ancla al
 * escenario. En un teléfono el escenario es más angosto que `MIN_STAGE`: se dibuja a ese ancho y se escala para entrar.
 */
function Stage({
  background,
  children,
}: {
  background: string
  children: React.ReactNode
}) {
  const box = useRef<HTMLElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const scale = size.w > 0 ? Math.min(1, size.w / MIN_STAGE) : 1
  return (
    <main
      ref={box}
      className="relative order-1 overflow-hidden md:order-2"
      style={{ background }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: size.w / scale || '100%',
          height: size.h / scale || '100%',
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </main>
  )
}
