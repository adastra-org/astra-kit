import { emitPrimitive, nextPrimitiveId, type NotifyType } from '@adastrarp/nui'
import { Button } from '@adastrarp/ui'
import type { ReactNode } from 'react'

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

export function Group({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-eyebrow">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export function NotificationGroup() {
  return (
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
  )
}

export function ProgressGroup() {
  return (
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
  )
}

export function TextUiGroup() {
  return (
    <Group label="Text UI">
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('textui:show', { key: 'E', text: 'Abrir puerta' })
        }
      >
        [E] Abrir
      </Button>
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('textui:show', { text: 'Zona segura', tone: 'safe' })
        }
      >
        Sin tecla
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => emitPrimitive('textui:hide', undefined)}
      >
        Ocultar
      </Button>
    </Group>
  )
}

export function ContextMenuGroup() {
  return (
    <Group label="Menú de contexto">
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('context:open', {
            id: 'garaje',
            title: 'Garaje',
            items: [
              {
                id: 'sacar',
                label: 'Sacar vehículo',
                description: 'Aparece en la salida del garaje',
                icon: 'car',
              },
              {
                id: 'estado',
                label: 'Estado',
                description: 'Motor y carrocería',
                icon: 'gauge',
                metadata: [
                  { label: 'Salud', value: 87, icon: 'heart' },
                  { label: 'Combustible', value: '62 %', icon: 'fuel' },
                ],
              },
              {
                id: 'mods',
                label: 'Modificaciones',
                description: 'Motor, frenos y turbo',
                icon: 'wrench',
                items: [
                  { id: 'motor', label: 'Motor', description: 'Nivel 2 de 4' },
                  {
                    id: 'frenos',
                    label: 'Frenos',
                    description: 'Nivel 1 de 3',
                  },
                  {
                    id: 'turbo',
                    label: 'Turbo',
                    description: 'Requiere motor nivel 3',
                    disabled: true,
                  },
                ],
              },
              {
                id: 'vender',
                label: 'Vender',
                description: 'Se transfiere al concesionario',
                icon: 'banknote',
                tone: 'warning',
              },
            ],
          })
        }
      >
        Abrir menú
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => emitPrimitive('context:close', undefined)}
      >
        Cerrar desde Lua
      </Button>
    </Group>
  )
}

export function InputDialogGroup() {
  return (
    <Group label="Input dialog">
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('input:open', {
            id: 'registro',
            title: 'Registro de vehículo',
            fields: [
              {
                id: 'plate',
                type: 'text',
                label: 'Patente',
                required: true,
                description: 'Tres letras y tres números.',
                placeholder: 'ABC123',
              },
              {
                id: 'seats',
                type: 'number',
                label: 'Asientos',
                min: 1,
                max: 8,
                default: 4,
              },
              {
                id: 'kind',
                type: 'select',
                label: 'Tipo',
                required: true,
                options: [
                  { value: 'auto', label: 'Auto' },
                  { value: 'moto', label: 'Moto' },
                ],
              },
              { id: 'date', type: 'date', label: 'Fecha de compra' },
              { id: 'insured', type: 'checkbox', label: 'Asegurado' },
            ],
          })
        }
      >
        Formulario
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => emitPrimitive('input:close', undefined)}
      >
        Cerrar desde Lua
      </Button>
    </Group>
  )
}

export function AlertGroup() {
  return (
    <Group label="Alerta">
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('alert:open', {
            id: 'salir',
            title: 'Salir del servidor',
            content: 'Se guardará tu progreso antes de desconectarte.',
            confirmLabel: 'Salir',
          })
        }
      >
        Confirmar
      </Button>
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('alert:open', {
            id: 'borrar',
            title: 'Borrar personaje',
            content: 'Esta acción no se puede deshacer.',
            confirmLabel: 'Borrar',
            danger: true,
          })
        }
      >
        Destructiva
      </Button>
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('alert:open', {
            id: 'aviso',
            title: 'Mantenimiento',
            content: 'El servidor se reinicia en 5 minutos.',
            cancel: false,
          })
        }
      >
        Solo aviso
      </Button>
    </Group>
  )
}

export function SkillCheckGroup() {
  return (
    <Group label="Skill check">
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('skillcheck:start', {
            id: 'facil',
            rounds: ['easy'],
          })
        }
      >
        Fácil
      </Button>
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('skillcheck:start', {
            id: 'triple',
            rounds: ['easy', 'medium', 'hard'],
            keys: ['e', 'f'],
          })
        }
      >
        3 rondas
      </Button>
      <Button
        size="sm"
        onClick={() => emitPrimitive('skillcheck:input', { key: 'e' })}
      >
        Enviar E desde Lua
      </Button>
      <Button
        size="sm"
        onClick={() => emitPrimitive('skillcheck:cancel', undefined)}
      >
        Cancelar desde Lua
      </Button>
    </Group>
  )
}

export function RadialGroup() {
  return (
    <Group label="Radial">
      <Button
        size="sm"
        onClick={() =>
          emitPrimitive('radial:open', {
            id: 'acciones',
            items: [
              { id: 'saludar', label: 'Saludar' },
              { id: 'auto', label: 'Vehículo', icon: 'car' },
              { id: 'sentarse', label: 'Sentarse', disabled: true },
              {
                id: 'gestos',
                label: 'Gestos',
                items: [
                  { id: 'ok', label: 'OK' },
                  { id: 'stop', label: 'Stop' },
                  { id: 'seguir', label: 'Seguir' },
                ],
              },
              { id: 'bailar', label: 'Bailar' },
              { id: 'llamar', label: 'Llamar' },
            ],
          })
        }
      >
        Abrir
      </Button>
      <Button
        size="sm"
        onClick={() => emitPrimitive('radial:close', undefined)}
      >
        Cerrar desde Lua
      </Button>
    </Group>
  )
}
