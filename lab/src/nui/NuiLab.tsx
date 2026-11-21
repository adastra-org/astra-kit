import {
  emitPrimitive,
  mockNui,
  nextPrimitiveId,
  type NotifyType,
} from '@adastrarp/nui'
import { Button, Chip, NuiPrimitives, Surface } from '@adastrarp/ui'
import { useEffect, useState, type ReactNode } from 'react'

// Escenario: un "juego" falso detrás. En el juego real no hay DOM detrás de la NUI.
const SCENES = {
  calle:
    'radial-gradient(60% 50% at 20% 30%, #ff9a3c 0%, transparent 60%), radial-gradient(50% 60% at 80% 70%, #2f7bff 0%, transparent 60%), linear-gradient(160deg, #0b1020, #1a1030 60%, #05070d)',
  dia: 'linear-gradient(180deg, #9fd3ff 0%, #f4f1e4 55%, #d9c9a3 100%)',
} as const
type Scene = keyof typeof SCENES

const TYPES: { id: NotifyType; label: string; title?: string; text: string }[] =
  [
    {
      id: 'success',
      label: 'Éxito',
      title: 'Banco',
      text: 'Depósito acreditado: $1.250',
    },
    { id: 'info', label: 'Info', text: 'Tienes una llamada perdida.' },
    {
      id: 'warning',
      label: 'Aviso',
      title: 'Combustible',
      text: 'Queda menos de un cuarto de tanque.',
    },
    {
      id: 'error',
      label: 'Error',
      title: 'No se pudo pagar',
      text: 'No tienes saldo suficiente para completar esta compra. Revisa tu cuenta e inténtalo de nuevo.',
    },
  ]

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
    <div className="grid min-h-screen grid-cols-[22rem_1fr]">
      <aside className="flex flex-col gap-6 overflow-y-auto border-r border-border bg-surface p-4">
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

        <Group label="Notificación">
          {TYPES.map((t) => (
            <Button
              key={t.id}
              size="sm"
              onClick={() =>
                emitPrimitive('notify:show', {
                  type: t.id,
                  title: t.title,
                  description: t.text,
                })
              }
            >
              {t.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              emitPrimitive('notify:show', {
                id: 'fija',
                type: 'info',
                description: 'No se cierra sola (duration 0)',
                duration: 0,
              })
            }
          >
            Fija
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => emitPrimitive('notify:dismiss', { id: 'fija' })}
          >
            Quitar fija
          </Button>
        </Group>

        <Group label="Progreso">
          <Button
            size="sm"
            onClick={() =>
              emitPrimitive('progress:start', {
                id: nextPrimitiveId('progress'),
                label: 'Reparando motor',
                duration: 4000,
              })
            }
          >
            Barra
          </Button>
          <Button
            size="sm"
            onClick={() =>
              emitPrimitive('progress:start', {
                id: nextPrimitiveId('progress'),
                kind: 'circle',
                label: 'Abriendo cerradura',
                duration: 4000,
              })
            }
          >
            Círculo
          </Button>
          <Button
            size="sm"
            onClick={() =>
              emitPrimitive('progress:start', {
                id: nextPrimitiveId('progress'),
                label: 'Cancelable',
                duration: 6000,
                canCancel: true,
                cancelKey: 'x',
              })
            }
          >
            Cancelable (X)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => emitPrimitive('progress:cancel', undefined)}
          >
            Cancelar desde Lua
          </Button>
        </Group>

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

      <main
        className="relative min-h-screen overflow-hidden"
        style={{ background: SCENES[scene] }}
      >
        <NuiPrimitives />
      </main>
    </div>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-eyebrow">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}
