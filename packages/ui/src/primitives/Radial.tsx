import { Goo, GooBlob } from '@adastrarp/goo'
import type { RadialData, RadialItem } from '@adastrarp/nui'
import { ChevronLeft, X } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../cx'
import { HUB, ORB, RADIAL_SIZE, nextEnabled, orbCenter } from './radialLayout'
import { useFocusTrap, type IconMap } from './shared'

export interface RadialProps {
  data: RadialData
  /** Ids desde el menú raíz hasta el ítem elegido (los submenús suman un id por nivel). */
  onSelect: (path: string[]) => void
  /** Escape o el centro en el nivel raíz. */
  onClose: () => void
  icons?: IconMap
}

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

/**
 * Menú radial: orbes goo en anillo alrededor de un centro; cada orbe nace del centro y se estira a su lugar. Centro =
 * cerrar (o volver, dentro de un submenú). Teclado: → ↓ siguiente (horario), ← ↑ anterior, Inicio Fin, Enter / Espacio
 * eligen y abren submenús, Backspace / Escape vuelven (Escape en la raíz cierra). Los deshabilitados se saltan y quedan
 * `aria-disabled`. El nombre del ítem activo se lee bajo el centro. Pensado para 3 a 10 ítems.
 */
export function Radial({ data, onSelect, onClose, icons }: RadialProps) {
  const [trail, setTrail] = useState<RadialItem[]>([])
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  useFocusTrap(root)

  const parent = trail.at(-1)
  const items = parent?.items ?? data.items
  const first = nextEnabled(items, -1, 1)
  const current = items[active] && !items[active].disabled ? active : first
  const depth = trail.length

  // El foco sigue al ítem activo (y cae en el primero al entrar a un submenú).
  useEffect(() => {
    list.current?.querySelectorAll<HTMLElement>('[data-orb]')[current]?.focus()
  }, [current, depth])

  const enter = (item: RadialItem, index: number) => {
    if (item.disabled) return
    if (item.items) {
      setTrail((t) => [...t, item])
      setActive(0)
      return
    }
    setActive(index)
    onSelect([...trail.map((t) => t.id), item.id])
  }
  const back = () => {
    if (depth === 0) return onClose()
    setTrail((t) => t.slice(0, -1))
    setActive(0)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        setActive(nextEnabled(items, current, 1))
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        setActive(nextEnabled(items, current, -1))
        break
      case 'Home':
        setActive(first)
        break
      case 'End':
        setActive(nextEnabled(items, 0, -1))
        break
      case 'Backspace':
        if (depth === 0) return
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

  const c = RADIAL_SIZE / 2
  const title = parent?.label ?? 'Menú radial'
  const label = items[current]?.label ?? ''
  return (
    <div
      ref={root}
      data-adastra="Radial"
      className="flex flex-col items-center gap-2 text-ink"
      onKeyDown={onKeyDown}
    >
      <div ref={list} role="menu" aria-label={title}>
        <Goo
          fill="var(--surface-raised)"
          style={{ width: RADIAL_SIZE, height: RADIAL_SIZE }}
        >
          <GooBlob
            id="hub"
            group="radial"
            x={c - HUB / 2}
            y={c - HUB / 2}
            w={HUB}
            h={HUB}
            spring="gentle"
          >
            <button
              type="button"
              role="menuitem"
              aria-label={depth === 0 ? 'Cerrar' : 'Volver'}
              onClick={back}
              style={{ width: HUB, height: HUB }}
              className={cx(
                'grid place-items-center rounded-full text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink motion-reduce:transition-none',
                FOCUS,
              )}
            >
              {depth === 0 ? (
                <X size={22} aria-hidden />
              ) : (
                <ChevronLeft size={22} aria-hidden />
              )}
            </button>
          </GooBlob>
          {items.map((item, i) => {
            const { x, y } = orbCenter(i, items.length)
            const icon = item.icon ? icons?.[item.icon] : undefined
            return (
              <GooBlob
                key={`${depth}/${item.id}`}
                id={`${depth}/${item.id}`}
                group="radial"
                x={x - ORB / 2}
                y={y - ORB / 2}
                w={ORB}
                h={ORB}
                spring="gentle"
                from={{ x: c, y: c }}
              >
                <div style={{ width: ORB, height: ORB }}>
                  <button
                    type="button"
                    role="menuitem"
                    data-orb
                    aria-label={item.label}
                    aria-disabled={item.disabled || undefined}
                    aria-haspopup={item.items ? 'menu' : undefined}
                    tabIndex={i === current ? 0 : -1}
                    onClick={() => enter(item, i)}
                    onMouseEnter={() => !item.disabled && setActive(i)}
                    style={{ width: ORB, height: ORB }}
                    className={cx(
                      'grid place-items-center rounded-full text-ink transition-colors duration-(--duration-fast) aria-disabled:cursor-not-allowed aria-disabled:text-ink-subtle motion-reduce:transition-none',
                      i === current && 'bg-accent-fill text-on-accent',
                      FOCUS,
                    )}
                  >
                    <span aria-hidden className="text-label">
                      {icon ?? item.label.slice(0, 1).toUpperCase()}
                    </span>
                  </button>
                </div>
              </GooBlob>
            )
          })}
        </Goo>
      </div>
      <p aria-hidden className="h-6 text-label text-ink">
        {label}
      </p>
    </div>
  )
}
