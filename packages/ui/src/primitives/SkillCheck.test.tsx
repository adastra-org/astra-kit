import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { SkillCheckNormalized } from '@adastrarp/nui'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { SkillCheck } from './SkillCheck'
import {
  DIFFICULTY,
  createRound,
  inZone,
  judgeKey,
  markerAngle,
} from './skillCheckLogic'

describe('skillCheckLogic', () => {
  test('createRound: la zona cabe en el anillo y no arranca pegada al inicio', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      for (const r of [0, 0.5, 0.999]) {
        const round = createRound(d, ['e', 'f'], () => r)
        expect(round.zoneSize).toBe(DIFFICULTY[d].zone)
        expect(round.zoneStart).toBeGreaterThanOrEqual(70)
        expect(round.zoneStart + round.zoneSize).toBeLessThanOrEqual(360)
      }
    }
  })

  test('createRound: elige la tecla con el azar inyectado', () => {
    expect(createRound('easy', ['e', 'f', 'g'], () => 0).key).toBe('e')
    expect(createRound('easy', ['e', 'f', 'g'], () => 0.99).key).toBe('g')
  })

  test('markerAngle recorre 0 a 360 y se queda en los extremos', () => {
    expect(markerAngle(-5, 1000)).toBe(0)
    expect(markerAngle(500, 1000)).toBe(180)
    expect(markerAngle(5000, 1000)).toBe(360)
  })

  test('judgeKey: acierto, fallo e ignorada', () => {
    const round = createRound('easy', ['e', 'f'], () => 0) // key e, zona 70..134
    const keys = ['e', 'f']
    expect(judgeKey('e', 100, round, keys)).toBe('hit')
    expect(judgeKey('E', 100, round, keys)).toBe('hit')
    expect(judgeKey('e', 20, round, keys)).toBe('miss')
    expect(judgeKey('f', 100, round, keys)).toBe('miss')
    expect(judgeKey('x', 100, round, keys)).toBe('ignore')
    expect(inZone(70, round) && inZone(134, round) && !inZone(135, round)).toBe(
      true,
    )
  })
})

// --- Componente: reloj y rAF controlados ------------------------------------------------------------------------------

let root: Root | null = null
let host: HTMLElement
let now = 0
let pending: FrameRequestCallback | null = null
const realRaf = globalThis.requestAnimationFrame
const realCancel = globalThis.cancelAnimationFrame
const realNow = performance.now.bind(performance)
const realRandom = Math.random

beforeEach(() => {
  now = 0
  pending = null
  Math.random = () => 0 // key = primera de la lista, zona en 70..134 (easy)
  performance.now = () => now
  globalThis.requestAnimationFrame = (cb) => {
    pending = cb
    return 1
  }
  globalThis.cancelAnimationFrame = () => {
    pending = null
  }
})
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
  Math.random = realRandom
  performance.now = realNow
  globalThis.requestAnimationFrame = realRaf
  globalThis.cancelAnimationFrame = realCancel
})

/** Avanza el reloj a `ms` y corre el frame pendiente. */
const at = (ms: number) =>
  act(() => {
    now = ms
    const cb = pending
    pending = null
    cb?.(ms)
  })
const press = (key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  })

function mount(data: Partial<SkillCheckNormalized>, out: boolean[]) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() =>
    root!.render(
      <SkillCheck
        data={{ id: 's', rounds: ['easy'], keys: ['e'], ...data }}
        onResult={(ok) => out.push(ok)}
      />,
    ),
  )
}

describe('<SkillCheck>', () => {
  test('anuncia ronda y tecla en una región viva', () => {
    mount({ rounds: ['easy', 'hard'], keys: ['e'] }, [])
    const status = host.querySelector('[role="status"]')!
    expect(status.textContent).toContain('Ronda 1 de 2')
    expect(status.textContent).toContain('E')
  })

  test('la tecla correcta dentro de la zona acierta', () => {
    const out: boolean[] = []
    mount({}, out)
    at(600) // 98 grados
    press('e')
    expect(out).toEqual([true])
  })

  test('la tecla correcta fuera de la zona falla', () => {
    const out: boolean[] = []
    mount({}, out)
    at(100) // 16 grados
    press('e')
    expect(out).toEqual([false])
  })

  test('otra tecla de la lista falla; una ajena se ignora', () => {
    const out: boolean[] = []
    mount({ keys: ['e', 'f'] }, out)
    at(600)
    press('x')
    expect(out).toEqual([])
    press('f')
    expect(out).toEqual([false])
  })

  test('Escape falla', () => {
    const out: boolean[] = []
    mount({}, out)
    at(600)
    press('Escape')
    expect(out).toEqual([false])
  })

  test('agotar el tiempo falla', () => {
    const out: boolean[] = []
    mount({}, out)
    at(2300)
    expect(out).toEqual([false])
  })

  test('varias rondas: avanza al acertar y resulta una sola vez al final', () => {
    const out: boolean[] = []
    mount({ rounds: ['easy', 'easy'] }, out)
    at(600)
    press('e')
    expect(out).toEqual([])
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      'Ronda 2 de 2',
    )
    at(1200) // la ronda nueva arrancó su reloj en 600: lleva 600 ms
    press('e')
    expect(out).toEqual([true])
    press('e')
    expect(out).toEqual([true])
  })

  test('el marcador se escribe por ref y no hay rAF tras terminar', () => {
    mount({}, [])
    at(1100) // 180 grados
    expect(host.querySelector('g')!.getAttribute('transform')).toBe(
      'rotate(180 80 80)',
    )
    press('e') // fuera de zona: falla y termina
    expect(pending).toBeNull()
  })
})
