import { afterEach, describe, expect, test } from 'bun:test'
import type { ContextMenuData } from '@adastrarp/nui'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ContextMenu } from './ContextMenu'

const data: ContextMenuData = {
  id: 'garage',
  title: 'Garaje',
  items: [
    { id: 'open', label: 'Abrir' },
    { id: 'locked', label: 'Bloqueado', disabled: true },
    {
      id: 'info',
      label: 'Estado',
      description: 'Motor y carrocería',
      metadata: [{ label: 'Salud', value: 87 }],
    },
    {
      id: 'more',
      label: 'Más',
      items: [
        { id: 'a', label: 'Opción A' },
        { id: 'b', label: 'Opción B' },
      ],
    },
  ],
}

let root: Root | null = null
let host: HTMLElement
const picked: string[][] = []
let closed = 0
function mount() {
  picked.length = 0
  closed = 0
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() =>
    root!.render(
      <ContextMenu
        data={data}
        onSelect={(p) => picked.push(p)}
        onClose={() => closed++}
      />,
    ),
  )
}
afterEach(() => {
  act(() => root?.unmount())
  root = null
  document.body.innerHTML = ''
})
const items = () => [...host.querySelectorAll<HTMLElement>('[role="menuitem"]')]
const key = (k: string) =>
  act(() => {
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, bubbles: true }),
    )
  })

describe('<ContextMenu>', () => {
  test('roles, foco inicial y tabindex móvil', () => {
    mount()
    expect(
      host.querySelector('[role="menu"]')!.getAttribute('aria-label'),
    ).toBe('Garaje')
    const rows = items()
    expect(rows.map((r) => r.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
      '-1',
    ])
    expect(document.activeElement).toBe(rows[0]!)
    expect(rows[1]!.getAttribute('aria-disabled')).toBe('true')
    expect(rows[3]!.getAttribute('aria-haspopup')).toBe('menu')
  })

  test('flechas saltan los deshabilitados y dan la vuelta; Inicio / Fin', async () => {
    mount()
    await key('ArrowDown')
    expect(document.activeElement).toBe(items()[2]!)
    await key('ArrowDown')
    expect(document.activeElement).toBe(items()[3]!)
    await key('ArrowDown')
    expect(document.activeElement).toBe(items()[0]!)
    await key('ArrowUp')
    expect(document.activeElement).toBe(items()[3]!)
    await key('Home')
    expect(document.activeElement).toBe(items()[0]!)
    await key('End')
    expect(document.activeElement).toBe(items()[3]!)
  })

  test('descripción y metadata se muestran como texto', () => {
    mount()
    const info = items()[2]!
    expect(info.textContent).toContain('Motor y carrocería')
    expect(info.textContent).toContain('Salud')
    expect(info.textContent).toContain('87')
  })

  test('click en un ítem selecciona con su path; el deshabilitado no', async () => {
    mount()
    await act(async () => items()[0]!.click())
    await act(async () => items()[1]!.click())
    expect(picked).toEqual([['open']])
  })

  test('submenú: → entra, elegir devuelve el path completo, ← y Escape vuelven', async () => {
    mount()
    await key('End')
    await key('ArrowRight')
    expect(host.querySelector('h2')!.textContent).toBe('Más')
    expect(items().map((r) => r.textContent)).toEqual(['Opción A', 'Opción B'])
    expect(document.activeElement).toBe(items()[0]!)
    await key('ArrowLeft')
    expect(host.querySelector('h2')!.textContent).toBe('Garaje')
    await key('End')
    await key('ArrowRight')
    await key('Escape')
    expect(host.querySelector('h2')!.textContent).toBe('Garaje')
    expect(closed).toBe(0)
    await key('End')
    await key('ArrowRight')
    await key('ArrowDown')
    await act(async () => items()[1]!.click())
    expect(picked).toEqual([['more', 'b']])
  })

  test('Escape en la raíz cierra; el botón Volver existe solo en submenús', async () => {
    mount()
    expect(host.querySelector('[aria-label="Volver"]')).toBeNull()
    await key('Escape')
    expect(closed).toBe(1)
    await key('End')
    await key('ArrowRight')
    expect(host.querySelector('[aria-label="Volver"]')).not.toBeNull()
  })

  test('Enter sobre un ítem con submenú lo abre', async () => {
    mount()
    await key('End')
    await act(async () =>
      document.activeElement!.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      ),
    )
    expect(host.querySelector('h2')!.textContent).toBe('Más')
  })
})
