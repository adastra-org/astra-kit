import type { ProgressNormalized, ProgressStatus } from '@adastrarp/nui'
import { useEffect, useRef } from 'react'
import { Kbd } from '../Kbd'
import { sameKey, useLatest } from './shared'

export interface ProgressProps {
  data: ProgressNormalized
  /** Una sola vez: `completed` al llegar a la duración, `cancelled` con la tecla (o Escape) si `canCancel`. */
  onEnd: (status: ProgressStatus) => void
}

const RING = 72
const RING_STROKE = 5
const RADIUS = (RING - RING_STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS

/**
 * Corre `duration` ms y avisa al terminar. El avance se escribe por ref en cada frame (React no re-renderiza) y el
 * rAF solo corre mientras hay una barra en curso. Es información, no decoración: con reduced motion igual avanza.
 */
function useProgressRun(
  data: ProgressNormalized,
  onEnd: ProgressProps['onEnd'],
  paint: (p: number) => void,
) {
  const end = useLatest(onEnd)
  const paintRef = useLatest(paint)
  const { id, duration, canCancel, cancelKey } = data

  useEffect(() => {
    let done = false
    let raf = 0
    const finish = (status: ProgressStatus) => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      end.current?.(status)
    }
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / duration))
      paintRef.current?.(p)
      if (p >= 1) finish('completed')
      else raf = requestAnimationFrame(tick)
    }
    paintRef.current?.(0)
    raf = requestAnimationFrame(tick)

    const onKey = (e: KeyboardEvent) => {
      if (!canCancel) return
      if (sameKey(e, cancelKey) || e.key === 'Escape') finish('cancelled')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      done = true
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
    }
    // `id` reinicia la corrida si Lua manda otra con el mismo componente montado.
  }, [id, duration, canCancel, cancelKey, end, paintRef])
}

/** Barra pill: etiqueta, porcentaje tabular y pista. Cancelable: muestra la tecla. */
export function ProgressBar({ data, onEnd }: ProgressProps) {
  const fill = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const pct = useRef<HTMLSpanElement>(null)

  useProgressRun(data, onEnd, (p) => {
    const n = Math.round(p * 100)
    if (fill.current) fill.current.style.transform = `scaleX(${p})`
    if (pct.current) pct.current.textContent = `${n} %`
    bar.current?.setAttribute('aria-valuenow', String(n))
  })

  return (
    <div
      data-adastra="ProgressBar"
      data-kind="bar"
      className="flex w-80 flex-col gap-2 rounded-full border border-border bg-surface-raised px-6 py-3 text-ink shadow-card"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-label">
          {data.label ?? 'Procesando'}
        </span>
        <span ref={pct} className="text-data text-ink-muted">
          0 %
        </span>
      </div>
      <div
        ref={bar}
        role="progressbar"
        aria-label={data.label ?? 'Progreso'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        className="h-2 overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          ref={fill}
          className="h-full origin-left rounded-full bg-accent"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>
      {data.canCancel && <CancelHint cancelKey={data.cancelKey} />}
    </div>
  )
}

/** Orbe con anillo: porcentaje al centro, etiqueta debajo. */
export function ProgressCircle({ data, onEnd }: ProgressProps) {
  const arc = useRef<SVGCircleElement>(null)
  const orb = useRef<HTMLDivElement>(null)
  const pct = useRef<HTMLSpanElement>(null)

  useProgressRun(data, onEnd, (p) => {
    const n = Math.round(p * 100)
    arc.current?.setAttribute('stroke-dashoffset', String(CIRC * (1 - p)))
    if (pct.current) pct.current.textContent = `${n}`
    orb.current?.setAttribute('aria-valuenow', String(n))
  })

  return (
    <div
      data-adastra="ProgressCircle"
      data-kind="circle"
      className="flex flex-col items-center gap-2 text-ink"
    >
      <div
        ref={orb}
        role="progressbar"
        aria-label={data.label ?? 'Progreso'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
        className="relative grid size-24 place-items-center rounded-full border border-border bg-surface-raised shadow-card"
      >
        <svg
          aria-hidden
          width={RING}
          height={RING}
          className="absolute -rotate-90"
        >
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            className="stroke-border"
          />
          <circle
            ref={arc}
            cx={RING / 2}
            cy={RING / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC}
            className="stroke-accent"
          />
        </svg>
        <span className="text-data text-ink">
          <span ref={pct}>0</span> %
        </span>
      </div>
      {data.label && (
        <span className="rounded-full border border-border bg-surface-raised px-4 py-1 text-label shadow-card">
          {data.label}
        </span>
      )}
      {data.canCancel && <CancelHint cancelKey={data.cancelKey} />}
    </div>
  )
}

function CancelHint({ cancelKey }: { cancelKey: string }) {
  return (
    <p className="flex items-center gap-2 text-caption text-ink-muted">
      <Kbd
        keys={cancelKey.length === 1 ? cancelKey.toUpperCase() : cancelKey}
      />
      Cancelar
    </p>
  )
}

/** Barra o círculo según `data.kind`. */
export function Progress(props: ProgressProps) {
  return props.data.kind === 'circle' ? (
    <ProgressCircle {...props} />
  ) : (
    <ProgressBar {...props} />
  )
}
