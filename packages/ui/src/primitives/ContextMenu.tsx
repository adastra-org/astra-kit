import type { ContextItem, ContextMenuData } from '@adastrarp/nui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../cx'
import { Surface } from '../Surface'
import { useFocusTrap, type IconMap } from './shared'

export interface ContextMenuProps {
  data: ContextMenuData
  /** Ids desde el menú raíz hasta el ítem elegido (los submenús suman un id por nivel). */
  onSelect: (path: string[]) => void
  /** Escape en el nivel raíz. */
  onClose: () => void
  icons?: IconMap
}

const ROW =
  'flex w-full items-center gap-3 px-4 text-left text-body text-ink transition-colors duration-(--duration-fast) hover:bg-surface-overlay focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:text-ink-subtle aria-disabled:hover:bg-transparent motion-reduce:transition-none'

/**
 * Menú de contexto navegable con teclado: ↑ ↓ Inicio Fin mueven, Enter / Espacio eligen, → o Enter abren un submenú,
 * ← / Backspace / Escape vuelven (Escape en la raíz cierra). Los ítems deshabilitados se saltan y quedan `aria-disabled`.
 * Foco con tabindex móvil: una sola parada de Tab dentro del menú.
 */
export function ContextMenu({
  data,
  onSelect,
  onClose,
  icons,
}: ContextMenuProps) {
  const [trail, setTrail] = useState<ContextItem[]>([])
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  useFocusTrap(root)

  const parent = trail.at(-1)
  const items = parent?.items ?? data.items
  const enabled = items.flatMap((it, i) => (it.disabled ? [] : [i]))
  const current = enabled.includes(active) ? active : (enabled[0] ?? -1)

  // El foco sigue al ítem activo (y cae en el primero al entrar a un submenú).
  useEffect(() => {
    list.current
      ?.querySelectorAll<HTMLElement>('[role="menuitem"]')
      [current]?.focus()
  }, [current, trail.length])

  const go = (step: 1 | -1) => {
    if (enabled.length === 0) return
    const at = enabled.indexOf(current)
    setActive(enabled[(at + step + enabled.length) % enabled.length]!)
  }
  const enter = (item: ContextItem, index: number) => {
    if (item.disabled) return
    if (item.items) {
      setTrail((t) => [...t, item])
      setActive(0)
      return
    }
    onSelect([...trail.map((t) => t.id), item.id])
    setActive(index)
  }
  const back = () => {
    if (trail.length === 0) return onClose()
    setTrail((t) => t.slice(0, -1))
    setActive(0)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const item = items[current]
    switch (e.key) {
      case 'ArrowDown':
        go(1)
        break
      case 'ArrowUp':
        go(-1)
        break
      case 'Home':
        if (enabled.length) setActive(enabled[0]!)
        break
      case 'End':
        if (enabled.length) setActive(enabled[enabled.length - 1]!)
        break
      case 'ArrowRight':
        if (item?.items) enter(item, current)
        break
      case 'ArrowLeft':
      case 'Backspace':
        if (trail.length === 0 && e.key === 'Backspace') return
        back()
        break
      case 'Escape':
        back()
        break
      default:
        return
    }
    e.preventDefault()
    e.stopPropagation()
  }

  const title = parent?.label ?? data.title
  return (
    <Surface
      ref={root}
      elevated
      data-adastra="ContextMenu"
      className="flex w-80 flex-col overflow-hidden"
      onKeyDown={onKeyDown}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        {trail.length > 0 && (
          <button
            type="button"
            aria-label="Volver"
            onClick={back}
            className="-ml-1 grid size-7 place-items-center rounded-full text-ink hover:bg-surface-overlay focus-visible:outline-2 focus-visible:outline-focus"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
        )}
        <h2 className="truncate text-h4">{title}</h2>
      </div>
      <div
        ref={list}
        role="menu"
        aria-label={title}
        className="flex flex-col gap-1 p-2"
      >
        {items.map((item, i) => {
          const rich = Boolean(item.description || item.metadata?.length)
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              aria-haspopup={item.items ? 'menu' : undefined}
              tabIndex={i === current ? 0 : -1}
              onClick={() => enter(item, i)}
              onMouseEnter={() => !item.disabled && setActive(i)}
              className={cx(
                ROW,
                rich ? 'rounded-lg py-3' : 'h-11 rounded-full',
              )}
            >
              {item.icon && icons?.[item.icon] && (
                <span aria-hidden className="shrink-0 text-ink-muted">
                  {icons[item.icon]}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label">{item.label}</span>
                {item.description && (
                  <span className="block text-body-sm text-ink-muted">
                    {item.description}
                  </span>
                )}
                {item.metadata?.map((m) => (
                  <span
                    key={m.label}
                    className="flex justify-between gap-3 text-caption text-ink-muted"
                  >
                    <span>{m.label}</span>
                    <span className="text-data">{m.value}</span>
                  </span>
                ))}
              </span>
              {item.items && (
                <ChevronRight
                  size={16}
                  aria-hidden
                  className="shrink-0 text-ink-muted"
                />
              )}
            </button>
          )
        })}
      </div>
    </Surface>
  )
}
