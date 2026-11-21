import {
  callbackPrimitive,
  normalizeProgress,
  usePrimitiveEvent,
  useScreenBlur,
  type ContextMenuData,
  type ProgressNormalized,
  type ProgressStatus,
  type TextUiData,
} from '@adastrarp/nui'
import { useCallback, useRef, useState } from 'react'
import { Reveal } from '../Reveal'
import { ContextMenu } from './ContextMenu'
import { Notifications } from './Notifications'
import { Progress } from './Progress'
import type { IconMap } from './shared'
import { TextUi } from './TextUi'
import { useNotifications } from './useNotifications'

export interface NuiPrimitivesProps {
  /** Íconos por clave para los datos de Lua (`icon: "car"`). Ver `IconMap`. */
  icons?: IconMap
}

/**
 * Conecta el contrato de mensajes de `@adastrarp/nui` con los componentes: monta una vez en la raíz de la NUI y Lua
 * maneja todo con `SendNUIMessage`. Cada primitiva también se puede usar suelta, sin este host.
 */
export function NuiPrimitives({ icons }: NuiPrimitivesProps = {}) {
  const toasts = useNotifications()
  usePrimitiveEvent('notify:show', (d) => toasts.notify(d))
  usePrimitiveEvent('notify:dismiss', (d) => toasts.dismiss(d.id))

  // Una sola barra a la vez: una nueva cancela la anterior (Lua recibe `cancelled` con el id viejo).
  const [progress, setProgress] = useState<ProgressNormalized | null>(null)
  const active = useRef<ProgressNormalized | null>(null)
  const endProgress = useCallback((id: string, status: ProgressStatus) => {
    if (active.current?.id !== id) return
    active.current = null
    setProgress(null)
    void callbackPrimitive('progress:end', { id, status })
  }, [])
  usePrimitiveEvent('progress:start', (d) => {
    const prev = active.current
    if (prev)
      void callbackPrimitive('progress:end', {
        id: prev.id,
        status: 'cancelled',
      })
    const next = normalizeProgress(d)
    active.current = next
    setProgress(next)
  })
  usePrimitiveEvent('progress:cancel', (d) => {
    const cur = active.current
    if (cur && (!d?.id || d.id === cur.id)) endProgress(cur.id, 'cancelled')
  })

  // Text UI: una sola pill; `hide` conserva el último texto mientras `Reveal` la saca.
  const [textUi, setTextUi] = useState<TextUiData | null>(null)
  const [textUiOpen, setTextUiOpen] = useState(false)
  usePrimitiveEvent('textui:show', (d) => {
    setTextUi(d)
    setTextUiOpen(true)
  })
  usePrimitiveEvent('textui:hide', () => setTextUiOpen(false))

  // Menú de contexto: modal, con blur del mundo. Elegir o cerrar avisa a Lua; Lua decide si abre otro.
  const [menu, setMenu] = useState<ContextMenuData | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  useScreenBlur(menuOpen)
  usePrimitiveEvent('context:open', (d) => {
    setMenu(d)
    setMenuOpen(true)
  })
  usePrimitiveEvent('context:close', () => setMenuOpen(false))

  return (
    <>
      <Notifications items={toasts.items} />
      <Reveal
        open={menuOpen}
        className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2"
      >
        {menu && (
          <ContextMenu
            key={menu.id}
            data={menu}
            icons={icons}
            onSelect={(path) => {
              setMenuOpen(false)
              void callbackPrimitive('context:select', { id: menu.id, path })
            }}
            onClose={() => {
              setMenuOpen(false)
              void callbackPrimitive('context:close', { id: menu.id })
            }}
          />
        )}
      </Reveal>
      <Reveal
        open={textUiOpen}
        className="pointer-events-none fixed bottom-1/3 left-1/2 z-40 -translate-x-1/2"
      >
        {textUi && <TextUi data={textUi} />}
      </Reveal>
      {progress && (
        <div
          data-adastra="ProgressHost"
          className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center"
        >
          <Progress
            key={progress.id}
            data={progress}
            onEnd={(status) => endProgress(progress.id, status)}
          />
        </div>
      )}
    </>
  )
}
