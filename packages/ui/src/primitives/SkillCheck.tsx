import type { SkillCheckNormalized } from '@adastrarp/nui'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Kbd } from '../Kbd'
import { useLatest } from './shared'
import { createRound, judgeKey, markerAngle } from './skillCheckLogic'

export interface SkillCheckProps {
  data: SkillCheckNormalized
  /** Una sola vez: `true` si se acertaron todas las rondas, `false` al primer fallo, tiempo agotado o Escape. */
  onResult: (success: boolean) => void
}

const SIZE = 160
const STROKE = 10
const R = (SIZE - STROKE) / 2
const C = SIZE / 2

const point = (deg: number, r = R) => {
  const a = ((deg - 90) * Math.PI) / 180
  return `${C + r * Math.cos(a)} ${C + r * Math.sin(a)}`
}
/** Arco SVG de `start` a `start + size` grados, en sentido horario. */
const arc = (start: number, size: number) =>
  `M ${point(start)} A ${R} ${R} 0 ${size > 180 ? 1 : 0} 1 ${point(start + size)}`

/**
 * Anillo con una zona: el marcador da una vuelta y hay que pulsar la tecla indicada mientras está dentro. Una ronda por
 * dificultad. El rAF solo corre mientras hay una ronda activa y escribe el ángulo por ref. Teclado: la tecla de la
 * ronda; otra tecla de `keys` falla; Escape falla. Reduced motion no cambia nada: el marcador es el juego, no decoración.
 */
export function SkillCheck({ data, onResult }: SkillCheckProps) {
  const [index, setIndex] = useState(0)
  const keysKey = data.keys.join('|')
  const rounds = useMemo(
    () => data.rounds.map((d) => createRound(d, data.keys)),
    // `id` regenera las rondas si Lua manda otra prueba.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.id, keysKey, data.rounds.join('|')],
  )
  const round = rounds[index]!
  const marker = useRef<SVGGElement>(null)
  const result = useLatest(onResult)
  const roundRef = useLatest(round)
  const live = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    let done = false
    let raf = 0
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      cancelAnimationFrame(raf)
      if (ok && index + 1 < rounds.length) setIndex(index + 1)
      else result.current?.(ok)
    }
    let angle = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      angle = markerAngle(now - t0, round.duration)
      marker.current?.setAttribute('transform', `rotate(${angle} ${C} ${C})`)
      if (angle >= 360) finish(false)
      else raf = requestAnimationFrame(tick)
    }
    marker.current?.setAttribute('transform', `rotate(0 ${C} ${C})`)
    raf = requestAnimationFrame(tick)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return finish(false)
      const verdict = judgeKey(e.key, angle, roundRef.current!, data.keys)
      if (verdict === 'ignore') return
      e.preventDefault()
      finish(verdict === 'hit')
    }
    window.addEventListener('keydown', onKey)
    return () => {
      done = true
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
    }
  }, [index, round, rounds.length, data.keys, result, roundRef])

  const cap = round.key.length === 1 ? round.key.toUpperCase() : round.key
  return (
    <div
      data-adastra="SkillCheck"
      className="flex flex-col items-center gap-3 text-ink"
    >
      <div className="relative grid size-44 place-items-center rounded-full border border-border bg-surface-raised shadow-card">
        <svg aria-hidden width={SIZE} height={SIZE} className="absolute">
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-border"
          />
          <path
            d={arc(round.zoneStart, round.zoneSize)}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className="stroke-accent"
            data-zone
          />
          <g ref={marker}>
            <line
              x1={C}
              y1={STROKE / 2 - 4}
              x2={C}
              y2={STROKE + 8}
              strokeWidth={4}
              strokeLinecap="round"
              className="stroke-ink"
            />
          </g>
        </svg>
        <Kbd keys={cap} />
      </div>
      <p ref={live} role="status" className="text-caption text-ink-muted">
        Ronda {index + 1} de {rounds.length}: pulsa {cap} dentro de la zona.
      </p>
    </div>
  )
}
