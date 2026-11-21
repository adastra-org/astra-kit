import type { TextUiData } from '@adastrarp/nui'
import { Kbd } from '../Kbd'

/**
 * Pill de interacción: `[E] Abrir`. Sin tecla, solo texto. Es un aviso (`role="status"`), no toma foco ni mouse.
 * La entrada y salida la da `Reveal` en el host; suelta, queda estática.
 */
export function TextUi({ data }: { data: TextUiData }) {
  return (
    <div
      role="status"
      data-adastra="TextUi"
      className="inline-flex items-center gap-3 rounded-full border border-border bg-surface-raised py-2 pr-5 pl-3 text-label text-ink shadow-card"
    >
      {data.key && (
        <Kbd keys={data.key.length === 1 ? data.key.toUpperCase() : data.key} />
      )}
      <span>{data.text}</span>
    </div>
  )
}
