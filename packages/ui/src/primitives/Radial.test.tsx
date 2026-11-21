import { afterEach, describe, expect, test } from 'bun:test'
import type { RadialData } from '@adastrarp/nui'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Radial } from './Radial'
import { ORB, RADIAL_SIZE, nextEnabled, orbCenter } from './radialLayout'

describe('radialLayout', () => {
  test('orbCenter: el primero arriba y el resto en sentido horario', () => {
    const c = RADIAL_SIZE / 2
    const top = orbCenter(0, 4)
    expect(top.x).toBeCloseTo(c)
    expect(top.y).toBeLessThan(c)
    const right = orbCenter(1, 4)
    expect(right.x).toBeGreaterThan(c)
    expect(right.y).toBeCloseTo(c)
    expect(orbCenter(2, 4).y).toBeGreaterThan(c)
    expect(orbCenter(3, 4).x).toBeLessThan(c)
  })

  test('orbCenter: todos a la misma distancia del centro y dentro del cuadrado', () => {
    const c = RADIAL_SIZE / 2
    for (let i = 0; i < 8; i++) {
      const { x, y } = orbCenter(i, 8)
      expect(Math.hypot(x - c, y - c)).toBeCloseTo(120)
      expect(x - ORB / 2).toBeGreaterThanOrEqual(0)
      expect(x + ORB / 2).toBeLessThanOrEqual(RADIAL_SIZE)
      expect(y - ORB / 2).toBeGreaterThanOrEqual(0)
      expect(y + ORB / 2).toBeLessThanOrEqual(RADIAL_SIZE)
    }
  })

  test('nextEnabled: salta deshabilitados, da la vuelta y avisa si no hay', () => {
    const items = [{}, { disabled: true }, {}, {}]
    expect(nextEnabled(items, 0, 1)).toBe(2)
    expect(nextEnabled(items, 3, 1)).toBe(0)
    expect(nextEnabled(items, 0, -1)).toBe(3)
    expect(nextEnabled(items, 2, -1)).toBe(0)
    expect(nextEnabled([{ disabled: true }], 0, 1)).toBe(-1)
    expect(nextEnabled([], -1, 1)).toBe(-1)
  })
})

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
})

const data: RadialData = {
  id: 'r',
  items: [
    { id: 'saludar', label: 'Saludar' },
    { id: 'sentarse', label: 'Sentarse', disabled: true },
    {
      id: 'gestos',
      label: 'Gestos',
      items: [
        { id: 'ok', label: 'OK' },
        { id: 'stop', label: 'Stop' },
      ],
    },
    { id: 'bailar', label: 'Bailar' },
  ],
}

const orbs = () => [...host.querySelectorAll<HTMLElement>('[data-orb]')]
const orb = (label: string) =>
  orbs().find((o) => o.getAttribute('aria-label') === label)!
const hub = () =>
  host.querySelector<HTMLElement>(
    '[aria-label="Cerrar"], [aria-label="Volver"]',
  )!
const key = (k: string) =>
  act(() => {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true }),
    )
  })
const click = (el: Element) => act(async () => (el as HTMLElement).click())

function setup() {
  const picked: string[][] = []
  let closed = 0
  mount(
    <Radial
      data={data}
      onSelect={(p) => picked.push(p)}
      onClose={() => closed++}
    />,
  )
  return { picked, closed: () => closed }
}

describe('<Radial>', () => {
  test('menu con un orbe por ítem, con nombre accesible, y el primero enfocado', () => {
    setup()
    expect(host.querySelector('[role="menu"]')).not.toBeNull()
    expect(orbs().map((o) => o.getAttribute('aria-label'))).toEqual([
      'Saludar',
      'Sentarse',
      'Gestos',
      'Bailar',
    ])
    expect(document.activeElement).toBe(orb('Saludar'))
    expect(orb('Sentarse').getAttribute('aria-disabled')).toBe('true')
    expect(orb('Gestos').getAttribute('aria-haspopup')).toBe('menu')
  })

  test('tabindex móvil: una sola parada de Tab entre los orbes', () => {
    setup()
    expect(orbs().filter((o) => o.tabIndex === 0)).toHaveLength(1)
  })

  test('flechas mueven en sentido horario, saltan deshabilitados y dan la vuelta', async () => {
    setup()
    await key('ArrowRight')
    expect(document.activeElement).toBe(orb('Gestos'))
    await key('ArrowDown')
    expect(document.activeElement).toBe(orb('Bailar'))
    await key('ArrowRight')
    expect(document.activeElement).toBe(orb('Saludar'))
    await key('ArrowLeft')
    expect(document.activeElement).toBe(orb('Bailar'))
    await key('Home')
    expect(document.activeElement).toBe(orb('Saludar'))
    await key('End')
    expect(document.activeElement).toBe(orb('Bailar'))
  })

  test('elegir devuelve el path; un deshabilitado no elige', async () => {
    const { picked } = setup()
    await click(orb('Sentarse'))
    expect(picked).toEqual([])
    await click(orb('Bailar'))
    expect(picked).toEqual([['bailar']])
  })

  test('submenú: entrar, elegir con path completo, volver con Backspace y con el centro', async () => {
    const { picked } = setup()
    await click(orb('Gestos'))
    expect(orbs().map((o) => o.getAttribute('aria-label'))).toEqual([
      'OK',
      'Stop',
    ])
    expect(hub().getAttribute('aria-label')).toBe('Volver')
    await key('Backspace')
    expect(orb('Saludar')).toBeDefined()
    await click(orb('Gestos'))
    await click(hub())
    expect(orbs()).toHaveLength(4)
    await click(orb('Gestos'))
    await click(orb('Stop'))
    expect(picked).toEqual([['gestos', 'stop']])
  })

  test('Escape vuelve de un submenú y cierra en la raíz; el centro cierra', async () => {
    const { closed } = setup()
    await click(orb('Gestos'))
    await key('Escape')
    expect(closed()).toBe(0)
    expect(orbs()).toHaveLength(4)
    await key('Escape')
    expect(closed()).toBe(1)
    await click(hub())
    expect(closed()).toBe(2)
  })

  test('Backspace en la raíz no cierra', async () => {
    const { closed } = setup()
    await key('Backspace')
    expect(closed()).toBe(0)
  })

  test('el ícono sale del mapa; sin ícono, la inicial', () => {
    mount(
      <Radial
        data={{
          id: 'r',
          items: [
            { id: 'a', label: 'Auto', icon: 'car' },
            { id: 'b', label: 'Barco' },
          ],
        }}
        icons={{ car: <svg data-testid="car" /> }}
        onSelect={() => {}}
        onClose={() => {}}
      />,
    )
    expect(orb('Auto').querySelector('[data-testid="car"]')).not.toBeNull()
    expect(orb('Barco').textContent).toBe('B')
  })
})
