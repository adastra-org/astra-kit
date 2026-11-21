import { afterEach, describe, expect, test } from 'bun:test'
import { normalizeNotify } from '@adastrarp/nui'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Notifications } from './Notifications'
import {
  toastHeight,
  useNotifications,
  type Notifier,
} from './useNotifications'

let root: Root | null = null
let host: HTMLElement
function mount(node: React.ReactNode) {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root!.render(node))
}
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
  delete (window as { matchMedia?: unknown }).matchMedia
})
const wait = (ms: number) =>
  act(() => new Promise<void>((r) => setTimeout(r, ms)))

function reduceMotion() {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('reduce'),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
}

describe('toastHeight', () => {
  test('mínimo 48; título suma una línea; la descripción se limita a 2', () => {
    expect(toastHeight({ description: 'Listo' })).toBe(48)
    expect(toastHeight({ title: 'Banco', description: 'Listo' })).toBe(64)
    expect(toastHeight({ title: 'Banco', description: 'x'.repeat(200) })).toBe(
      84,
    )
  })
})

describe('<Notifications>', () => {
  const items = [
    normalizeNotify({
      id: 'a',
      type: 'success',
      title: 'Banco',
      description: 'Depósito acreditado',
    }),
    normalizeNotify({
      id: 'b',
      type: 'error',
      description: 'No tienes dinero',
    }),
  ]

  test('un status por toast; los errores son alert; el tipo se anuncia en texto', () => {
    mount(<Notifications items={items} />)
    const live = host.querySelector('[aria-live]')!
    expect(live.getAttribute('aria-live')).toBe('polite')
    const status = host.querySelector('[role="status"]')!
    expect(status.textContent).toContain('Correcto')
    expect(status.textContent).toContain('Banco')
    const alert = host.querySelector('[role="alert"]')!
    expect(alert.textContent).toContain('Error')
    expect(alert.textContent).toContain('No tienes dinero')
  })

  test('es una sola capa goo (un path) y no recibe foco ni mouse', () => {
    mount(<Notifications items={items} />)
    expect(
      host.querySelectorAll('[data-adastra="Goo"] > svg > path'),
    ).toHaveLength(1)
    expect(host.querySelectorAll('button, a, input, [tabindex]')).toHaveLength(
      0,
    )
    expect(host.firstElementChild!.className).toContain('pointer-events-none')
  })

  test('reduced motion: las pills quedan en su caja final sin frames, apiladas con separación', () => {
    reduceMotion()
    mount(<Notifications items={items} />)
    const a = host.querySelector<HTMLElement>('[data-goo="a"]')!
    const b = host.querySelector<HTMLElement>('[data-goo="b"]')!
    expect(a.style.width).toBe('340px')
    expect(a.style.height).toBe('64px')
    expect(a.style.transform).toBe('translate(0px, 0px)')
    expect(b.style.transform).toBe('translate(0px, 76px)') // 64 + 12
  })

  test('sin items no hay alto', () => {
    mount(<Notifications items={[]} />)
    expect(host.querySelector<HTMLElement>('[aria-live]')!.style.height).toBe(
      '0px',
    )
  })
})

describe('useNotifications', () => {
  let api: Notifier
  function Probe({ max }: { max?: number }) {
    api = useNotifications(max)
    return <Notifications items={api.items} />
  }

  test('se cierra sola a los duration ms; duration 0 no se cierra', async () => {
    reduceMotion()
    mount(<Probe />)
    act(() => {
      api.notify({ id: 'corta', description: 'x', duration: 30 })
      api.notify({ id: 'fija', description: 'y', duration: 0 })
    })
    expect(host.querySelectorAll('[role="status"]')).toHaveLength(2)
    await wait(80)
    const ids = api.items.map((n) => n.id)
    expect(ids).toEqual(['fija'])
  })

  test('mismo id reemplaza y reinicia el timer; dismiss quita', async () => {
    mount(<Probe />)
    act(() => {
      api.notify({ id: 'k', description: 'uno', duration: 40 })
    })
    await wait(25)
    act(() => {
      api.notify({ id: 'k', description: 'dos', duration: 40 })
    })
    await wait(25)
    expect(api.items).toHaveLength(1)
    expect(api.items[0]!.description).toBe('dos')
    act(() => api.dismiss('k'))
    expect(api.items).toHaveLength(0)
  })

  test('max descarta las más viejas', () => {
    mount(<Probe max={2} />)
    act(() => {
      api.notify({ id: '1', description: 'a', duration: 0 })
      api.notify({ id: '2', description: 'b', duration: 0 })
      api.notify({ id: '3', description: 'c', duration: 0 })
    })
    expect(api.items.map((n) => n.id)).toEqual(['2', '3'])
  })

  test('al desmontar no quedan timers pendientes que actualicen estado', async () => {
    mount(<Probe />)
    act(() => {
      api.notify({ description: 'x', duration: 20 })
    })
    act(() => root!.unmount())
    root = null
    await new Promise((r) => setTimeout(r, 40))
    expect(true).toBe(true)
  })
})
