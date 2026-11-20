import { afterEach, describe, expect, test } from 'bun:test'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  GooEngine,
  Goo,
  GooBlob,
  PRESETS,
  bridgePath,
  circlePath,
  critical,
  dampingRatio,
  metaballPath,
  pillEnds,
  pillPath,
  row,
  spring,
  stepSpring,
} from './index'

// Reloj manual para el motor: cada `frame()` corre el rAF pendiente a 60 fps.
function clock() {
  let next: ((t: number) => void) | null = null
  let t = 0
  let scheduled = 0
  return {
    schedule: (cb: (t: number) => void) => {
      next = cb
      scheduled++
      return scheduled
    },
    cancel: () => {
      next = null
    },
    frame() {
      const cb = next
      next = null
      t += 1000 / 60
      cb?.(t)
    },
    get pending() {
      return next !== null
    },
  }
}

describe('geometría', () => {
  test('círculo: dos arcos horarios; radio 0 no dibuja', () => {
    expect(circlePath({ x: 10, y: 10, r: 5 })).toBe(
      'M5 10A5 5 0 1 1 15 10A5 5 0 1 1 5 10Z',
    )
    expect(circlePath({ x: 0, y: 0, r: 0 })).toBe('')
  })

  test('metaball: sin puente más allá de reach; afinado continuo cerca del límite', () => {
    const a = { x: 0, y: 0, r: 20 }
    expect(metaballPath(a, { x: 52, y: 0, r: 20 }, 12)).toBe('')
    expect(metaballPath(a, { x: 51, y: 0, r: 20 }, 12)).not.toBe('')
    // Uno adentro del otro: no hay puente.
    expect(metaballPath(a, { x: 2, y: 0, r: 5 }, 12)).toBe('')
  })

  test('metaball: el orden de los círculos no cambia la forma', () => {
    const a = { x: 0, y: 0, r: 24 }
    const b = { x: 60, y: 0, r: 16 }
    expect(metaballPath(a, b, 40)).toBe(metaballPath(b, a, 40))
  })

  test('pill: cabeza = un círculo; estirada = dos extremos + cuerpo', () => {
    expect(pillEnds({ x: 0, y: 0, w: 40, h: 40 })).toEqual([
      { x: 20, y: 20, r: 20 },
    ])
    expect(pillEnds({ x: 0, y: 0, w: 120, h: 40 })).toEqual([
      { x: 20, y: 20, r: 20 },
      { x: 100, y: 20, r: 20 },
    ])
    // Cuello 0: cuerpo de alto completo entre centros.
    expect(pillPath({ x: 0, y: 0, w: 120, h: 40 })).toContain(
      'M20 0H100V40H20Z',
    )
    // Cuello 0.5: cuerpo a la mitad.
    expect(pillPath({ x: 0, y: 0, w: 120, h: 40 }, 0.5)).toContain(
      'M20 10H100V30H20Z',
    )
    expect(pillPath({ x: 0, y: 0, w: 0, h: 0 })).toBe('')
  })

  test('puente entre pills: nada lejos, metaball cerca, cuerpo al solaparse', () => {
    const a = { x: 0, y: 0, w: 40, h: 40 }
    expect(bridgePath(a, { x: 60, y: 0, w: 40, h: 40 }, 12)).toBe('')
    expect(bridgePath(a, { x: 46, y: 0, w: 40, h: 40 }, 12)).not.toBe('')
    expect(bridgePath(a, { x: 20, y: 0, w: 40, h: 40 }, 12)).toContain(
      'M20 0H40V40H20Z',
    )
  })

  test('row: x acumulada con gap', () => {
    expect(row([40, 136, 40], 12, 48)).toEqual([48, 100, 248])
  })
})

describe('spring', () => {
  test('crítico: llega sin pasarse y queda exacto en reposo', () => {
    const s = spring(0, 100)
    let max = 0
    let rested = false
    for (let i = 0; i < 120 && !rested; i++) {
      rested = stepSpring(s, 1 / 60, {
        stiffness: 260,
        damping: critical(260),
        mass: 1,
      })
      max = Math.max(max, s.value)
    }
    expect(rested).toBe(true)
    expect(s.value).toBe(100)
    expect(max).toBeLessThanOrEqual(100.01)
  })

  test('subamortiguado rebota', () => {
    const s = spring(0, 100)
    let max = 0
    for (let i = 0; i < 60; i++) {
      stepSpring(s, 1 / 60, {
        stiffness: 260,
        damping: 0.3 * critical(260),
        mass: 1,
      })
      max = Math.max(max, s.value)
    }
    expect(max).toBeGreaterThan(110)
  })

  test('presets del DS Faku: snappy rebota poco, wobbly se nota, heavy tarda más', () => {
    const peak = (cfg: (typeof PRESETS)[keyof typeof PRESETS]) => {
      const s = spring(0, 100)
      let max = 0
      let frames = 0
      while (!stepSpring(s, 1 / 60, cfg) && frames < 600) {
        max = Math.max(max, s.value)
        frames++
      }
      return { max, frames }
    }
    expect(dampingRatio(PRESETS.snappy)).toBeCloseTo(0.67, 2)
    expect(peak(PRESETS.snappy).max).toBeLessThan(108)
    expect(peak(PRESETS.wobbly).max).toBeGreaterThan(130)
    expect(peak(PRESETS.heavy).frames).toBeGreaterThan(
      peak(PRESETS.snappy).frames,
    )
  })
})

describe('GooEngine', () => {
  test('rAF solo mientras se mueve; en reposo no queda nada pendiente', () => {
    const c = clock()
    const e = new GooEngine({ schedule: c.schedule, cancel: c.cancel })
    expect(c.pending).toBe(false)
    e.upsert({ id: 'vida', x: 0, y: 0, w: 40, h: 40 })
    expect(c.pending).toBe(true)
    for (let i = 0; i < 120 && c.pending; i++) c.frame()
    expect(c.pending).toBe(false)
    expect(e.running).toBe(false)
    expect(e.frame.blobs.get('vida')).toMatchObject({
      x: 0,
      y: 0,
      w: 40,
      h: 40,
      neck: 0,
    })
    // Mismo objetivo: no arranca el loop.
    e.upsert({ id: 'vida', x: 0, y: 0, w: 40, h: 40 })
    expect(c.pending).toBe(false)
  })

  test('nace desde `from` y crece desde 0', () => {
    const c = clock()
    const e = new GooEngine({ schedule: c.schedule, cancel: c.cancel })
    e.upsert({ id: 'alerta', x: 100, y: 0, w: 40, h: 40, from: { x: 0, y: 0 } })
    c.frame()
    const s = e.frame.blobs.get('alerta')!
    expect(s.x).toBeLessThan(50)
    expect(s.w).toBeGreaterThan(0)
    expect(s.w).toBeLessThan(40)
  })

  test('estirarse rápido genera cuello; en reposo vuelve a 0', () => {
    const c = clock()
    const e = new GooEngine({
      schedule: c.schedule,
      cancel: c.cancel,
      instant: true,
    })
    e.upsert({ id: 'vida', x: 0, y: 0, w: 40, h: 40 })
    e.configure({ instant: false })
    e.upsert({ id: 'vida', x: 0, y: 0, w: 160, h: 40 })
    let peak = 0
    for (let i = 0; i < 120 && c.pending; i++) {
      c.frame()
      peak = Math.max(peak, e.frame.blobs.get('vida')!.neck)
    }
    expect(peak).toBeGreaterThan(0.2)
    expect(e.frame.blobs.get('vida')!.neck).toBe(0)
  })

  test('anticipación: retrocede antes de estirarse y llega sin pasarse', () => {
    const c = clock()
    const e = new GooEngine({
      schedule: c.schedule,
      cancel: c.cancel,
      instant: true,
    })
    e.upsert({ id: 'a', x: 0, y: 0, w: 40, h: 40 })
    e.configure({
      instant: false,
      anticipation: 1,
      arc: 0,
      stiffness: 260,
      damping: critical(260),
      mass: 1,
    })
    e.upsert({ id: 'a', x: 0, y: 0, w: 140, h: 40 })
    let min = 40
    let max = 40
    for (let i = 0; i < 120 && c.pending; i++) {
      c.frame()
      const w = e.frame.blobs.get('a')!.w
      min = Math.min(min, w)
      max = Math.max(max, w)
    }
    expect(min).toBeLessThan(30) // ~21 % de 100 px hacia atrás
    expect(max).toBeLessThanOrEqual(140.01)
    expect(e.frame.blobs.get('a')!.w).toBe(140)
  })

  test('arco: un desplazamiento horizontal se comba hacia arriba y vuelve a su y', () => {
    const c = clock()
    const e = new GooEngine({
      schedule: c.schedule,
      cancel: c.cancel,
      instant: true,
    })
    e.upsert({ id: 'a', x: 0, y: 100, w: 40, h: 40 })
    e.configure({ instant: false, anticipation: 0, arc: 0.35 })
    e.upsert({ id: 'a', x: 200, y: 100, w: 40, h: 40 })
    let minY = 100
    for (let i = 0; i < 120 && c.pending; i++) {
      c.frame()
      minY = Math.min(minY, e.frame.blobs.get('a')!.y)
    }
    expect(minY).toBeLessThan(85) // ~13 % de 200 px de comba
    expect(e.frame.blobs.get('a')!.y).toBe(100)
  })

  test('spring por pill: un preset propio pisa al del motor', () => {
    const run = (spring?: 'heavy') => {
      const c = clock()
      const e = new GooEngine({ schedule: c.schedule, cancel: c.cancel })
      e.upsert({ id: 'a', x: 0, y: 0, w: 40, h: 40, spring })
      let frames = 0
      while (c.pending && frames < 1000) {
        c.frame()
        frames++
      }
      return frames
    }
    expect(run('heavy')).toBeGreaterThan(run())
  })

  test('remove: se encoge y desaparece del frame', () => {
    const c = clock()
    const e = new GooEngine({ schedule: c.schedule, cancel: c.cancel })
    e.configure({ instant: true })
    e.upsert({ id: 'a', x: 0, y: 0, w: 40, h: 40 })
    e.configure({ instant: false })
    e.remove('a')
    expect(e.frame.blobs.has('a')).toBe(true)
    for (let i = 0; i < 120 && c.pending; i++) c.frame()
    expect(e.frame.blobs.has('a')).toBe(false)
    expect(e.frame.d).toBe('')
  })

  test('instant: salta al objetivo sin programar frames', () => {
    const c = clock()
    const e = new GooEngine({
      schedule: c.schedule,
      cancel: c.cancel,
      instant: true,
    })
    e.upsert({ id: 'a', x: 10, y: 0, w: 40, h: 40 })
    expect(c.pending).toBe(false)
    expect(e.frame.blobs.get('a')).toMatchObject({ x: 10, w: 40 })
  })

  test('puentes solo dentro del mismo grupo', () => {
    const e = new GooEngine({ instant: true })
    e.upsert({ id: 'a', x: 0, y: 0, w: 40, h: 40, group: 'g' })
    e.upsert({ id: 'b', x: 44, y: 0, w: 40, h: 40, group: 'g' })
    const withBridge = e.frame.d
    e.upsert({ id: 'b', x: 44, y: 0, w: 40, h: 40, group: 'otro' })
    expect(e.frame.d.length).toBeLessThan(withBridge.length)
  })
})

describe('<Goo>', () => {
  let root: Root | null = null
  afterEach(() => {
    act(() => root?.unmount())
    root = null
    document.body.innerHTML = ''
  })

  test('un path, contenido posicionado por el motor', () => {
    const host = document.createElement('div')
    document.body.append(host)
    root = createRoot(host)
    act(() =>
      root!.render(
        <Goo instant>
          <GooBlob id="vida" x={12} y={8} w={40} h={40} label="Vida 72 %">
            72
          </GooBlob>
        </Goo>,
      ),
    )
    expect(host.querySelectorAll('svg path')).toHaveLength(1)
    expect(
      host.querySelector<HTMLElement>('[data-adastra="Goo"]')!.style
        .fontVariantNumeric,
    ).toBe('tabular-nums')
    expect(host.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
    expect(host.querySelector('svg path')!.getAttribute('d')).toContain(
      'A20 20',
    )
    const blob = host.querySelector<HTMLElement>('[data-goo="vida"]')!
    expect(blob.style.transform).toBe('translate(12px, 8px)')
    expect(blob.style.width).toBe('40px')
    expect(blob.style.borderRadius).toBe('20px')
    expect(blob.getAttribute('aria-label')).toBe('Vida 72 %')
  })
})
