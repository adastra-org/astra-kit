import { afterEach, describe, expect, test } from 'bun:test'
import {
  normalizeProgress,
  type ProgressData,
  type ProgressStatus,
} from '@adastrarp/nui'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Progress } from './Progress'

let root: Root | null = null
let host: HTMLElement
function mount(data: ProgressData, onEnd: (s: ProgressStatus) => void) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() =>
    root!.render(<Progress data={normalizeProgress(data)} onEnd={onEnd} />),
  )
}
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
  delete (window as { matchMedia?: unknown }).matchMedia
})
const wait = (ms: number) =>
  act(() => new Promise<void>((r) => setTimeout(r, ms)))
const press = (key: string) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }))
  })
const bar = () => host.querySelector('[role="progressbar"]')!

describe('<Progress>', () => {
  test('barra: avanza, llega a 100 y avisa `completed` una sola vez', async () => {
    const ends: ProgressStatus[] = []
    mount({ id: 'p', duration: 150, label: 'Reparando' }, (s) => ends.push(s))
    expect(host.querySelector('[data-kind="bar"]')).not.toBeNull()
    expect(bar().getAttribute('aria-label')).toBe('Reparando')
    await wait(60)
    const mid = Number(bar().getAttribute('aria-valuenow'))
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(100)
    await wait(250)
    expect(bar().getAttribute('aria-valuenow')).toBe('100')
    expect(ends).toEqual(['completed'])
  })

  test('círculo: el anillo se llena y el porcentaje es texto', async () => {
    const ends: ProgressStatus[] = []
    mount({ id: 'c', kind: 'circle', duration: 100 }, (s) => ends.push(s))
    expect(host.querySelector('[data-kind="circle"]')).not.toBeNull()
    await wait(250)
    const arc = host.querySelectorAll('circle')[1]!
    expect(Number(arc.getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 5)
    expect(host.textContent).toContain('100')
    expect(ends).toEqual(['completed'])
  })

  test('canCancel: la tecla configurada cancela y no completa después', async () => {
    const ends: ProgressStatus[] = []
    mount({ id: 'x', duration: 200, canCancel: true, cancelKey: 'g' }, (s) =>
      ends.push(s),
    )
    expect(host.textContent).toContain('Cancelar')
    expect(host.querySelector('kbd')!.textContent).toBe('G')
    await press('G')
    expect(ends).toEqual(['cancelled'])
    await wait(300)
    expect(ends).toEqual(['cancelled'])
  })

  test('canCancel: Escape cancela; otras teclas no', async () => {
    const ends: ProgressStatus[] = []
    mount({ id: 'x', duration: 500, canCancel: true }, (s) => ends.push(s))
    await press('q')
    expect(ends).toEqual([])
    await press('Escape')
    expect(ends).toEqual(['cancelled'])
  })

  test('sin canCancel ignora teclas y no muestra el hint', async () => {
    const ends: ProgressStatus[] = []
    mount({ id: 'x', duration: 120 }, (s) => ends.push(s))
    expect(host.textContent).not.toContain('Cancelar')
    await press('x')
    await press('Escape')
    expect(ends).toEqual([])
    await wait(250)
    expect(ends).toEqual(['completed'])
  })

  test('reduced motion: sigue avanzando (es información)', async () => {
    window.matchMedia = ((q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia
    const ends: ProgressStatus[] = []
    mount({ id: 'x', duration: 100 }, (s) => ends.push(s))
    await wait(250)
    expect(ends).toEqual(['completed'])
  })

  test('desmontar corta la corrida sin avisar', async () => {
    const ends: ProgressStatus[] = []
    mount({ id: 'x', duration: 100, canCancel: true }, (s) => ends.push(s))
    act(() => root!.unmount())
    root = null
    await wait(200)
    await press('Escape')
    expect(ends).toEqual([])
  })
})
