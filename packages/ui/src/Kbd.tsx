import { cx } from './cx'
import { keyCaps } from './keys'

/** Atajo como teclas: `<Kbd keys="Ctrl+K" />` -> [Ctrl][K]. Los lectores de pantalla reciben el texto plano. */
export function Kbd({ keys, className }: { keys: string; className?: string }) {
  const caps = keyCaps(keys)
  return (
    <span
      data-adastra="Kbd"
      className={cx('inline-flex items-center gap-1', className)}
    >
      <span className="sr-only">{caps.join(' + ')}</span>
      {caps.map((cap, i) => (
        <kbd
          key={`${cap}-${i}`}
          aria-hidden
          className="inline-grid h-6 min-w-6 place-items-center rounded-sm border border-border-strong bg-surface-overlay px-1.5 text-data text-ink"
        >
          {cap}
        </kbd>
      ))}
    </span>
  )
}
