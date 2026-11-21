import type { ContextItem, ContextMenuData, ContextTone } from '@adastrarp/nui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
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

// Cada ítem se ve como botón también en reposo (fondo y borde suaves); hover y foco lo levantan.
const ROW =
  'flex w-full items-center gap-3 border border-border bg-surface-overlay/40 px-4 text-left text-body text-ink transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-overlay focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-transparent aria-disabled:text-ink-subtle aria-disabled:hover:bg-transparent motion-reduce:transition-none'

const TONE: Record<ContextTone, { row: string; icon: string }> = {
  accent: {
    row: 'border-accent/40 bg-accent/10 hover:border-accent/70 hover:bg-accent/20',
    icon: 'text-accent',
  },
  warning: {
    row: 'border-warning/40 bg-warning-surface hover:border-warning/70 hover:bg-warning/20',
    icon: 'text-warning',
  },
  danger: {
    row: 'border-danger/40 bg-danger-surface hover:border-danger/70 hover:bg-danger/20',
    icon: 'text-danger',
  },
}

// Spring `snappy` del DS (k 320, c 24, m 1): cambio de sección.
const SNAPPY = { type: 'spring', stiffness: 320, damping: 24, mass: 1 } as const

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
  // 1 = entra a un submenú (llega desde la derecha), -1 = vuelve (desde la izquierda).
  const [dir, setDir] = useState<1 | -1>(1)
  const reduce = useReducedMotion()
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
      setDir(1)
      setTrail((t) => [...t, item])
      setActive(0)
      return
    }
    onSelect([...trail.map((t) => t.id), item.id])
    setActive(index)
  }
  const back = () => {
    if (trail.length === 0) return onClose()
    setDir(-1)
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
      <motion.div
        key={trail.map((t) => t.id).join('/') || '.'}
        ref={list}
        role="menu"
        aria-label={title}
        className="flex flex-col gap-1.5 p-2"
        custom={dir}
        variants={{
          enter: (d: number) => ({ x: reduce ? 0 : d * 48, opacity: 0 }),
          center: { x: 0, opacity: 1 },
          exit: (d: number) => ({ x: reduce ? 0 : d * -48, opacity: 0 }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={reduce ? { duration: 0 } : SNAPPY}
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
                item.tone && !item.disabled && TONE[item.tone].row,
              )}
            >
              {item.icon && icons?.[item.icon] && (
                <span
                  aria-hidden
                  className={cx(
                    'shrink-0',
                    item.tone && !item.disabled
                      ? TONE[item.tone].icon
                      : 'text-ink-muted',
                  )}
                >
                  {icons[item.icon]}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span
                  className={cx(
                    'block truncate text-label',
                    item.tone && !item.disabled && TONE[item.tone].icon,
                  )}
                >
                  {item.label}
                </span>
                {item.description && (
                  <span className="block text-body-sm text-ink-muted">
                    {item.description}
                  </span>
                )}
                {item.metadata?.map((m) => (
                  <span
                    key={m.label}
                    className="flex items-center justify-between gap-3 text-caption text-ink-muted"
                  >
                    <span className="flex items-center gap-1.5">
                      {m.icon && icons?.[m.icon] && (
                        <span
                          aria-hidden
                          className="grid size-3.5 shrink-0 place-items-center [&_svg]:size-3.5"
                        >
                          {icons[m.icon]}
                        </span>
                      )}
                      {m.label}
                    </span>
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
      </motion.div>
    </Surface>
  )
}
