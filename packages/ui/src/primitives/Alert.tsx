import type { AlertData } from '@adastrarp/nui'
import { useId } from 'react'
import { Button } from '../Button'
import { Dialog } from './Dialog'

export interface AlertProps {
  data: AlertData
  onResult: (result: 'confirm' | 'cancel') => void
}

/**
 * Confirmación modal (`role="alertdialog"`). Escape = cancelar. En acciones destructivas (`danger`) el foco arranca en
 * "Cancelar" para que un Enter distraído no borre nada. Con `cancel: false` es un aviso de un solo botón.
 */
export function Alert({ data, onResult }: AlertProps) {
  const titleId = useId()
  const bodyId = useId()
  const hasCancel = data.cancel !== false
  const cancelFirst = hasCancel && data.danger === true
  return (
    <Dialog
      role="alertdialog"
      labelledBy={titleId}
      describedBy={data.content ? bodyId : undefined}
      onEscape={() => onResult('cancel')}
      className="w-[24rem]"
    >
      <h2 id={titleId} className="text-h4">
        {data.title}
      </h2>
      {data.content && (
        <p id={bodyId} className="text-body text-ink-muted">
          {data.content}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {hasCancel && (
          <Button
            data-autofocus={cancelFirst ? '' : undefined}
            onClick={() => onResult('cancel')}
          >
            {data.cancelLabel ?? 'Cancelar'}
          </Button>
        )}
        <Button
          variant={data.danger ? 'danger' : 'primary'}
          data-autofocus={cancelFirst ? undefined : ''}
          onClick={() => onResult('confirm')}
        >
          {data.confirmLabel ?? 'Aceptar'}
        </Button>
      </div>
    </Dialog>
  )
}
