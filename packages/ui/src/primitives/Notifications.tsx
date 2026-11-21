import { Goo, GooBlob } from '@adastrarp/goo'
import type { NotifyNormalized, NotifyType } from '@adastrarp/nui'
import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { TOAST_GAP, TOAST_WIDTH, toastHeight } from './useNotifications'

const TYPES: Record<
  NotifyType,
  { icon: ReactNode; tone: string; name: string }
> = {
  success: {
    icon: <CircleCheck size={20} />,
    tone: 'text-success',
    name: 'Correcto',
  },
  info: { icon: <Info size={20} />, tone: 'text-info', name: 'Información' },
  warning: {
    icon: <CircleAlert size={20} />,
    tone: 'text-warning',
    name: 'Aviso',
  },
  error: { icon: <CircleX size={20} />, tone: 'text-danger', name: 'Error' },
}

/**
 * Pila de toasts: cada uno es una pill que nace del borde derecho (goo, spring `gentle`, con arco) y se pega a las
 * vecinas mientras la pila se reacomoda. Sin foco ni mouse: es feedback, no un control. `aria-live` anuncia las nuevas
 * (los errores como `alert`).
 */
export function Notifications({
  items,
  className,
}: {
  items: NotifyNormalized[]
  className?: string
}) {
  const placed: { n: NotifyNormalized; h: number; y: number }[] = []
  for (const n of items) {
    const last = placed.at(-1)
    placed.push({
      n,
      h: toastHeight(n),
      y: last ? last.y + last.h + TOAST_GAP : 0,
    })
  }
  const end = placed.at(-1)
  const total = end ? end.y + end.h : 0
  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      data-adastra="Notifications"
      className={className ?? 'pointer-events-none fixed top-6 right-6 z-50'}
      style={{ width: TOAST_WIDTH, height: total }}
    >
      <Goo
        fill="var(--surface-raised)"
        style={{ width: TOAST_WIDTH, height: total }}
      >
        {placed.map(({ n, h, y: top }) => {
          const t = TYPES[n.type]
          return (
            <GooBlob
              key={n.id}
              id={n.id}
              group="toasts"
              x={0}
              y={top}
              w={TOAST_WIDTH}
              h={h}
              spring="gentle"
              from={{ x: TOAST_WIDTH + 48, y: top + h / 2 }}
            >
              <div
                role={n.type === 'error' ? 'alert' : 'status'}
                data-type={n.type}
                className="flex items-center gap-3 text-ink"
                style={{
                  width: TOAST_WIDTH,
                  height: h,
                  padding: '0 24px 0 20px',
                }}
              >
                <span aria-hidden className={`shrink-0 ${t.tone}`}>
                  {t.icon}
                </span>
                <span className="sr-only">{t.name}: </span>
                <div className="min-w-0 flex-1">
                  {n.title && (
                    <p className="truncate text-label text-ink">{n.title}</p>
                  )}
                  <p
                    className={`line-clamp-2 text-body-sm ${n.title ? 'text-ink-muted' : 'text-ink'}`}
                  >
                    {n.description}
                  </p>
                </div>
              </div>
            </GooBlob>
          )
        })}
      </Goo>
    </div>
  )
}
