import { usePrimitiveEvent } from '@adastrarp/nui'
import { Notifications } from './Notifications'
import { useNotifications } from './useNotifications'
import type { IconMap } from './shared'

export interface NuiPrimitivesProps {
  /** Íconos por clave para los datos de Lua (`icon: "car"`). Ver `IconMap`. */
  icons?: IconMap
}

/**
 * Conecta el contrato de mensajes de `@adastrarp/nui` con los componentes: monta una vez en la raíz de la NUI y Lua
 * maneja todo con `SendNUIMessage`. Cada primitiva también se puede usar suelta, sin este host.
 */
export function NuiPrimitives(_props: NuiPrimitivesProps = {}) {
  const toasts = useNotifications()
  usePrimitiveEvent('notify:show', (d) => toasts.notify(d))
  usePrimitiveEvent('notify:dismiss', (d) => toasts.dismiss(d.id))

  return (
    <>
      <Notifications items={toasts.items} />
    </>
  )
}
