import type { TextUiData, TextUiTone } from '@adastrarp/nui'
import { Info, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cx } from '../cx'
import { Kbd } from '../Kbd'

const TONES: Record<TextUiTone, { icon: ReactNode; className: string }> = {
  safe: {
    icon: <ShieldCheck size={16} />,
    className: 'border-success/50 bg-success-surface [--lead:var(--success)]',
  },
  danger: {
    icon: <TriangleAlert size={16} />,
    className: 'border-danger/50 bg-danger-surface [--lead:var(--danger)]',
  },
  info: {
    icon: <Info size={16} />,
    className: 'border-info/50 bg-info-surface [--lead:var(--info)]',
  },
}

/**
 * Pill de interacción: `[E] Abrir`. Sin tecla, solo texto centrado. `tone` la colorea según el lugar (zona protegida,
 * zona roja). Es un aviso (`role="status"`), no toma foco ni mouse. La entrada y salida la da `Reveal` en el host.
 *
 * Radios concéntricos: lo que va a la izquierda (tecla o ícono) es una pill de 24 px con el mismo padding (8 px) arriba,
 * abajo y a la izquierda, así su radio es el de la pill menos ese padding.
 */
export function TextUi({ data }: { data: TextUiData }) {
  const tone = data.tone ? TONES[data.tone] : null
  const lead = data.key ? (
    <Kbd
      keys={data.key.length === 1 ? data.key.toUpperCase() : data.key}
      round
    />
  ) : tone ? (
    <span
      aria-hidden
      className="grid size-6 place-items-center rounded-full text-(--lead)"
    >
      {tone.icon}
    </span>
  ) : null
  return (
    <div
      role="status"
      data-adastra="TextUi"
      data-tone={data.tone}
      className={cx(
        'inline-flex items-center gap-3 rounded-full border py-2 text-label text-ink shadow-card',
        lead ? 'pr-5 pl-2' : 'px-5',
        tone ? tone.className : 'border-border bg-surface-raised',
      )}
    >
      {lead}
      <span className={lead ? undefined : 'flex h-6 items-center'}>
        {data.text}
      </span>
    </div>
  )
}
